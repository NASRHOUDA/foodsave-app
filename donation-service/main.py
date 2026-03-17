
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import uuid
import os
import logging
import httpx  # ← AJOUT pour faire des requêtes HTTP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FoodSave Donation Service")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3003", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connexion MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://foodsave-mongodb:27017")
logger.info(f"Tentative de connexion à MongoDB: {MONGODB_URI}")

donations_collection = None
requests_collection = None
in_memory_db = {}
in_memory_requests = {}

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client.foodsave
    donations_collection = db.donations
    requests_collection = db.requests
    logger.info("✅ Connexion MongoDB établie avec succès")
except Exception as e:
    logger.error(f"❌ Erreur de connexion MongoDB: {e}")


# ─────────────────────────────────────────────
# Utilitaire : supprime / convertit les ObjectId
# ─────────────────────────────────────────────
def clean_mongo_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [clean_mongo_doc(item) for item in doc]
    if not isinstance(doc, dict):
        return doc

    new_doc = {}
    for key, value in doc.items():
        if key == "_id":
            continue
        elif isinstance(value, ObjectId):
            new_doc[key] = str(value)
        elif isinstance(value, dict):
            new_doc[key] = clean_mongo_doc(value)
        elif isinstance(value, list):
            new_doc[key] = [
                clean_mongo_doc(item) if isinstance(item, dict)
                else str(item) if isinstance(item, ObjectId)
                else item
                for item in value
            ]
        else:
            new_doc[key] = value
    return new_doc


def strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ─────────────────────────────────────────────
# Fonction pour envoyer une notification
# ─────────────────────────────────────────────
async def send_notification(user_id: str, type: str, title: str, message: str, data: dict = None):
    """Envoie une notification via le notification-service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://notification-service:3004/api/notifications",
                json={
                    "userId": user_id,
                    "type": type,
                    "title": title,
                    "message": message,
                    "data": data or {}
                },
                timeout=5.0
            )
            if response.status_code == 201:
                logger.info(f"✅ Notification envoyée à l'utilisateur {user_id}")
            else:
                logger.warning(f"⚠️ Échec envoi notification: {response.status_code}")
    except Exception as e:
        logger.error(f"❌ Erreur envoi notification: {e}")


# ─────────────────────────────────────────────
# Modèles Pydantic
# ─────────────────────────────────────────────
class DonationCreate(BaseModel):
    merchant_id: str
    food_type: str
    quantity: float
    description: str
    pickup_address: str
    pickup_lat: float
    pickup_lon: float
    pickup_time_start: datetime
    pickup_time_end: datetime


class Donation(DonationCreate):
    id: str
    status: str = "available"
    created_at: datetime
    requested_by: Optional[str] = None
    requested_at: Optional[datetime] = None
    accepted_by: Optional[str] = None
    accepted_at: Optional[datetime] = None


class RequestCreate(BaseModel):
    donation_id: str
    association_id: str
    association_name: str
    merchant_id: str
    message: str


class Request(BaseModel):
    id: str
    donation_id: str
    association_id: str
    association_name: str
    merchant_id: str
    message: str
    status: str = "pending"
    created_at: datetime
    response_message: Optional[str] = None
    responded_at: Optional[datetime] = None


class RequestResponse(BaseModel):
    status: str
    message: str


# ─────────────────────────────────────────────
# Routes générales
# ─────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message": "FoodSave Donation Service",
        "status": "running",
        "cors": "enabled",
        "endpoints": [
            "GET  /health",
            "POST /api/donations",
            "GET  /api/donations",
            "GET  /api/donations/merchant/{merchant_id}",
            "GET  /api/donations/association/{association_id}",
            "GET  /api/donations/available/nearby",
            "GET  /api/donations/{donation_id}",
            "POST /api/requests",
            "GET  /api/requests/merchant/{merchant_id}",
            "GET  /api/requests/association/{association_id}",
            "POST /api/requests/{request_id}/respond",
        ],
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "donation-service"}


# ─────────────────────────────────────────────
# DONATIONS
# ─────────────────────────────────────────────
@app.post("/api/donations", status_code=201)
async def create_donation(donation: DonationCreate):
    logger.info(f"Création d'un don: {donation}")

    donation_dict = donation.dict()
    donation_dict["id"] = str(uuid.uuid4())
    donation_dict["status"] = "available"
    donation_dict["created_at"] = datetime.now()

    if donations_collection is not None:
        donations_collection.insert_one(donation_dict)
        strip_id(donation_dict)
        logger.info(f"Don créé dans MongoDB avec ID: {donation_dict['id']}")
    else:
        in_memory_db[donation_dict["id"]] = donation_dict

    return donation_dict


@app.get("/api/donations")
async def list_donations():
    if donations_collection is not None:
        donations = list(donations_collection.find())
        return clean_mongo_doc(donations)
    return list(in_memory_db.values())


@app.get("/api/donations/merchant/{merchant_id}")
async def get_merchant_donations(merchant_id: str):
    if donations_collection is not None:
        donations = list(donations_collection.find({"merchant_id": merchant_id}))
        return clean_mongo_doc(donations)
    return [d for d in in_memory_db.values() if d["merchant_id"] == merchant_id]


@app.get("/api/donations/association/{association_id}")
async def get_association_donations(association_id: str):
    if donations_collection is not None:
        donations = list(donations_collection.find({"accepted_by": association_id}))
        return clean_mongo_doc(donations)
    return [d for d in in_memory_db.values() if d.get("accepted_by") == association_id]


@app.get("/api/donations/{donation_id}")
async def get_donation_by_id(donation_id: str):
    logger.info(f"🔍 Recherche du don: {donation_id}")
    
    if donations_collection is not None:
        donation = donations_collection.find_one({"id": donation_id})
        if donation:
            cleaned = clean_mongo_doc(donation)
            logger.info(f"✅ Don trouvé: {donation_id}")
            return cleaned
    else:
        donation = in_memory_db.get(donation_id)
        if donation:
            return donation
    
    logger.warning(f"❌ Don non trouvé: {donation_id}")
    raise HTTPException(status_code=404, detail=f"Don non trouvé: {donation_id}")


@app.get("/api/donations/available/nearby")
async def get_nearby_donations(lat: float, lon: float, radius_km: float = 10):
    try:
        from geopy.distance import geodesic

        if donations_collection is not None:
            all_donations = clean_mongo_doc(
                list(donations_collection.find({"status": "available"}))
            )
        else:
            all_donations = [d for d in in_memory_db.values() if d["status"] == "available"]

        for d in all_donations:
            d["distance_km"] = geodesic(
                (lat, lon), (d["pickup_lat"], d["pickup_lon"])
            ).kilometers

        nearby = [d for d in all_donations if d.get("distance_km", 999) <= radius_km]
        nearby.sort(key=lambda x: x["distance_km"])
        return nearby

    except Exception as e:
        logger.error(f"Erreur nearby: {e}")
        return []


# ─────────────────────────────────────────────
# DEMANDES (REQUESTS)
# ─────────────────────────────────────────────
@app.post("/api/requests", status_code=201)
async def create_request(request: RequestCreate):
    logger.info(f"Nouvelle demande: {request}")

    # Vérifier que le don existe
    if donations_collection is not None:
        donation = donations_collection.find_one({"id": request.donation_id})
    else:
        donation = in_memory_db.get(request.donation_id)

    if not donation:
        raise HTTPException(status_code=404, detail="Don non trouvé")

    if donation["status"] != "available":
        raise HTTPException(status_code=400, detail="Ce don n'est plus disponible")

    # Mettre à jour le statut du don
    if donations_collection is not None:
        donations_collection.update_one(
            {"id": request.donation_id},
            {"$set": {
                "status": "requested",
                "requested_by": request.association_id,
                "requested_at": datetime.now(),
            }},
        )
    else:
        donation["status"] = "requested"
        donation["requested_by"] = request.association_id
        donation["requested_at"] = datetime.now()

    # Créer la demande
    request_dict = request.dict()
    request_dict["id"] = str(uuid.uuid4())
    request_dict["status"] = "pending"
    request_dict["created_at"] = datetime.now()

    if requests_collection is not None:
        requests_collection.insert_one(request_dict)
        strip_id(request_dict)
        logger.info(f"Demande créée avec ID: {request_dict['id']}")
    else:
        in_memory_requests[request_dict["id"]] = request_dict

    # 🔔 ENVOYER UNE NOTIFICATION AU COMMERÇANT
    await send_notification(
        user_id=request.merchant_id,
        type="new_request",
        title="📥 Nouvelle demande",
        message=f"{request.association_name} a fait une demande pour votre don",
        data={
            "donation_id": request.donation_id,
            "request_id": request_dict["id"],
            "association_id": request.association_id
        }
    )

    return request_dict


@app.get("/api/requests/merchant/{merchant_id}")
async def get_merchant_requests(merchant_id: str):
    if requests_collection is not None:
        requests = list(requests_collection.find({"merchant_id": merchant_id}))
        return clean_mongo_doc(requests)
    return [r for r in in_memory_requests.values() if r["merchant_id"] == merchant_id]


@app.get("/api/requests/association/{association_id}")
async def get_association_requests(association_id: str):
    if requests_collection is not None:
        requests = list(requests_collection.find({"association_id": association_id}))
        return clean_mongo_doc(requests)
    return [r for r in in_memory_requests.values() if r["association_id"] == association_id]


@app.post("/api/requests/{request_id}/respond")
async def respond_to_request(request_id: str, response: RequestResponse):
    logger.info(f"Réponse à la demande {request_id}: {response.status}")

    if requests_collection is not None:
        req = requests_collection.find_one({"id": request_id})
    else:
        req = in_memory_requests.get(request_id)

    if not req:
        raise HTTPException(status_code=404, detail="Demande non trouvée")

    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Cette demande a déjà été traitée")

    update_data = {
        "status": response.status,
        "response_message": response.message,
        "responded_at": datetime.now(),
    }

    if requests_collection is not None:
        requests_collection.update_one({"id": request_id}, {"$set": update_data})
    else:
        req.update(update_data)

    # Mettre à jour le don en fonction de la réponse
    if response.status == "accepted":
        if donations_collection is not None:
            donations_collection.update_one(
                {"id": req["donation_id"]},
                {"$set": {
                    "status": "accepted",
                    "accepted_by": req["association_id"],
                    "accepted_at": datetime.now(),
                }},
            )
        else:
            d = in_memory_db.get(req["donation_id"])
            if d:
                d["status"] = "accepted"
                d["accepted_by"] = req["association_id"]
                d["accepted_at"] = datetime.now()
        
        # 🔔 NOTIFICATION À L'ASSOCIATION (demande acceptée)
        await send_notification(
            user_id=req["association_id"],
            type="request_accepted",
            title="✅ Demande acceptée",
            message=f"Votre demande a été acceptée. {response.message}",
            data={"request_id": request_id, "donation_id": req["donation_id"]}
        )
    else:
        if donations_collection is not None:
            donations_collection.update_one(
                {"id": req["donation_id"]},
                {"$set": {"status": "available"}},
            )
        else:
            d = in_memory_db.get(req["donation_id"])
            if d:
                d["status"] = "available"
        
        # 🔔 NOTIFICATION À L'ASSOCIATION (demande refusée)
        await send_notification(
            user_id=req["association_id"],
            type="request_rejected",
            title="❌ Demande refusée",
            message=f"Votre demande a été refusée. {response.message}",
            data={"request_id": request_id, "donation_id": req["donation_id"]}
        )

    return {"message": f"Demande {response.status}", "request_id": request_id}
