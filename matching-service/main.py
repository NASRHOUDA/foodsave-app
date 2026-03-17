from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timezone
import numpy as np
from geopy.distance import geodesic
import httpx
import os
import logging
import time
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FoodSave Matching Service v2")

DONATION_SERVICE_URL = os.getenv("DONATION_SERVICE_URL", "http://donation-service:3002")
USER_SERVICE_URL     = os.getenv("USER_SERVICE_URL",     "http://user-service:3001")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== MODÈLES ====================

class MatchRequest(BaseModel):
    donation_id: str
    association_id: str
    association_lat: float
    association_lon: float
    association_capacity: float
    preferred_food_types: List[str] = []

class MatchResponse(BaseModel):
    score: float
    score_breakdown: Dict
    reasons: List[str]
    estimated_distance: float
    compatibility: str
    urgency_level: str
    confidence: float

class BatchMatchRequest(BaseModel):
    donation_id: str
    associations: List[Dict]

class BatchMatchResponse(BaseModel):
    matches: List[Dict]
    best_match: Optional[Dict] = None
    total_evaluated: int
    processing_time_ms: float

# ==================== ALGORITHME AMÉLIORÉ ====================

def calculate_distance_score(distance_km: float) -> tuple:
    """
    Score distance avec courbe exponentielle décroissante.
    Plus c'est proche, mieux c'est — mais pas en paliers brutaux.
    """
    if distance_km == 0:
        return 40, "[Distance] Meme quartier - ideal"

    # Formule: score = 40 * e^(-distance/8)
    # A 0km → 40pts, 5km → 27pts, 10km → 18pts, 20km → 8pts
    raw = 40 * math.exp(-distance_km / 8)
    score = round(max(0, raw))

    if distance_km < 2:
        label = f"[Distance] Tres proche ({distance_km:.1f}km)"
    elif distance_km < 5:
        label = f"[Distance] Proche ({distance_km:.1f}km)"
    elif distance_km < 10:
        label = f"[Distance] Acceptable ({distance_km:.1f}km)"
    elif distance_km < 20:
        label = f"[Distance] Eloigne ({distance_km:.1f}km)"
    else:
        label = f"[Distance] Tres eloigne ({distance_km:.1f}km)"

    return score, label


def calculate_capacity_score(donation_qty: float, assoc_capacity: float) -> tuple:
    """
    Score capacité — récompense les associations bien dimensionnées.
    Pénalise légèrement la sur-capacité (gaspillage potentiel).
    """
    if assoc_capacity <= 0:
        return 0, "[Capacite] Capacite non renseignee"

    ratio = assoc_capacity / donation_qty if donation_qty > 0 else 1

    if ratio >= 1.0 and ratio <= 3.0:
        # Capacité idéale : entre 100% et 300% de la quantité
        score = 30
        label = f"[Capacite] Capacite ideale ({assoc_capacity:.0f}kg dispo)"
    elif ratio > 3.0:
        # Sur-capacité — légère pénalité
        score = 22
        label = f"[Capacite] Sur-capacite ({assoc_capacity:.0f}kg dispo)"
    elif ratio >= 0.7:
        # Capacité partielle
        score = 20
        label = f"[Capacite] Capacite partielle ({ratio*100:.0f}% couverte)"
    elif ratio >= 0.5:
        score = 12
        label = f"[Capacite] Capacite faible ({ratio*100:.0f}% couverte)"
    else:
        score = 0
        label = f"[Capacite] Capacite insuffisante ({assoc_capacity:.0f}kg pour {donation_qty:.0f}kg)"

    return score, label


def calculate_food_type_score(donation_type: str, preferred_types: List[str]) -> tuple:
    """
    Score type d'aliment — match exact ou compatibilité partielle.
    """
    if not preferred_types:
        # Pas de préférences = accepte tout → score neutre
        return 10, "[Aliment] Accepte tous les types"

    if donation_type in preferred_types:
        return 20, f"[Aliment] Type {donation_type} correspond aux preferences"

    # Compatibilités partielles entre types
    compatible_groups = [
        {"bakery", "packaged"},   # Boulangerie et emballé souvent compatibles
        {"prepared", "fresh"},    # Cuisiné et frais souvent compatibles
    ]

    for group in compatible_groups:
        if donation_type in group:
            compatible = group - {donation_type}
            if any(t in preferred_types for t in compatible):
                return 10, f"[Aliment] Type compatible avec les preferences"

    return 0, f"[Aliment] Type {donation_type} hors preferences"


def calculate_urgency_score(donation: Dict) -> tuple:
    """
    Bonus/malus selon l'urgence du don.
    Un don qui expire bientôt doit être récupéré rapidement.
    """
    pickup_end_str = donation.get('pickup_time_end')
    if not pickup_end_str:
        return 0, None, "normal"

    try:
        pickup_end = datetime.fromisoformat(pickup_end_str.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        hours_left = (pickup_end - now).total_seconds() / 3600

        if hours_left < 0:
            return -10, "[Urgence] Don expiré", "expired"
        elif hours_left < 2:
            return 8, "[Urgence] URGENT - moins de 2h", "critical"
        elif hours_left < 6:
            return 5, "[Urgence] Urgent - moins de 6h", "high"
        elif hours_left < 24:
            return 2, "[Urgence] Disponible aujourd'hui", "medium"
        else:
            return 0, None, "normal"
    except Exception:
        return 0, None, "normal"


def calculate_history_score(
    donation: Dict,
    association: Dict,
    all_donations: List[Dict]
) -> tuple:
    """
    Score basé sur l'historique réel des collaborations.
    Compte le nombre de dons acceptés entre ce commerçant et cette association.
    """
    merchant_id    = str(donation.get('merchant_id', ''))
    association_id = str(association.get('id', ''))

    if not all_donations or not merchant_id or not association_id:
        return 0, None

    # Compter les dons acceptés ensemble
    accepted_together = sum(
        1 for d in all_donations
        if str(d.get('merchant_id', '')) == merchant_id
        and str(d.get('accepted_by', '')) == association_id
        and d.get('status') in ('accepted', 'completed')
    )

    if accepted_together == 0:
        return 0, None
    elif accepted_together == 1:
        return 3, f"[Historique] 1 collaboration passee"
    elif accepted_together <= 3:
        return 6, f"[Historique] {accepted_together} collaborations"
    else:
        return 10, f"[Historique] {accepted_together} collaborations - partenaire regulier"


def calculate_compatibility_score(
    donation: Dict,
    association: Dict,
    distance_km: float,
    all_donations: List[Dict] = []
) -> tuple:
    """
    Algorithme principal — agrège tous les critères.
    Score max théorique: 40 + 30 + 20 + 10 + 8(urgence) = 108
    Normalisé à 100.
    """
    reasons = []
    breakdown = {}

    # 1. Distance (40 pts max)
    dist_score, dist_reason = calculate_distance_score(distance_km)
    breakdown["distance"] = dist_score
    reasons.append(dist_reason)

    # 2. Capacité (30 pts max)
    cap_score, cap_reason = calculate_capacity_score(
        donation.get('quantity', 0),
        association.get('capacity', 100)
    )
    breakdown["capacity"] = cap_score
    reasons.append(cap_reason)

    # 3. Type d'aliment (20 pts max)
    type_score, type_reason = calculate_food_type_score(
        donation.get('food_type', ''),
        association.get('preferred_food_types', [])
    )
    breakdown["food_type"] = type_score
    reasons.append(type_reason)

    # 4. Historique réel (10 pts max)
    hist_score, hist_reason = calculate_history_score(donation, association, all_donations)
    breakdown["history"] = hist_score
    if hist_reason:
        reasons.append(hist_reason)

    # 5. Urgence (bonus/malus)
    urgency_score, urgency_reason, urgency_level = calculate_urgency_score(donation)
    breakdown["urgency"] = urgency_score
    if urgency_reason:
        reasons.append(urgency_reason)

    # Score total normalisé à 100
    raw_score = dist_score + cap_score + type_score + hist_score + urgency_score
    final_score = min(100, max(0, raw_score))

    return final_score, reasons, breakdown, urgency_level


def get_compatibility_label(score: float) -> str:
    if score >= 80: return "excellente"
    if score >= 65: return "bonne"
    if score >= 45: return "moyenne"
    return "faible"

# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    return {
        "message": "FoodSave Matching Service v2",
        "algorithm": "multi-criteria weighted scoring",
        "criteria": ["distance(40)", "capacity(30)", "food_type(20)", "history(10)", "urgency(bonus)"],
        "status": "running",
        "endpoints": [
            "GET  /health",
            "GET  /api/stats",
            "POST /api/match/single",
            "POST /api/match/batch",
            "GET  /api/match/donation/{id}/suggestions",
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "matching-service-v2"}


@app.get("/api/stats")
async def get_stats():
    """Stats du service — à enrichir avec une vraie DB de métriques si besoin"""
    return {
        "service":       "matching-service-v2",
        "algorithm":     "multi-criteria",
        "criteria":      ["distance", "capacity", "food_type", "history", "urgency"],
        "max_score":     100,
        "status":        "running"
    }


@app.post("/api/match/single")
async def match_single(request: MatchRequest):
    try:
        logger.info(f"Match single: don {request.donation_id} / asso {request.association_id}")

        async with httpx.AsyncClient() as client:
            don_resp = await client.get(
                f"{DONATION_SERVICE_URL}/api/donations/{request.donation_id}",
                timeout=10.0
            )
            if don_resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Don non trouve")
            donation = don_resp.json()

            # Récupérer l'historique
            all_donations = []
            try:
                all_resp = await client.get(
                    f"{DONATION_SERVICE_URL}/api/donations",
                    timeout=10.0
                )
                if all_resp.status_code == 200:
                    all_donations = all_resp.json()
            except Exception:
                pass

        distance = geodesic(
            (request.association_lat, request.association_lon),
            (donation['pickup_lat'], donation['pickup_lon'])
        ).kilometers

        score, reasons, breakdown, urgency = calculate_compatibility_score(
            donation,
            {
                'id':                   request.association_id,
                'capacity':             request.association_capacity,
                'preferred_food_types': request.preferred_food_types
            },
            distance,
            all_donations
        )

        return {
            "score":                score,
            "score_breakdown":      breakdown,
            "reasons":              reasons,
            "estimated_distance":   round(distance, 2),
            "compatibility":        get_compatibility_label(score),
            "urgency_level":        urgency,
            "estimated_pickup_time": donation.get('pickup_time_start'),
            "confidence":           round(score / 100, 2)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur match_single: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/match/batch")
async def match_batch(request: BatchMatchRequest):
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            don_resp = await client.get(
                f"{DONATION_SERVICE_URL}/api/donations/{request.donation_id}",
                timeout=10.0
            )
            if don_resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Don non trouve")
            donation = don_resp.json()

            all_donations = []
            try:
                all_resp = await client.get(f"{DONATION_SERVICE_URL}/api/donations", timeout=10.0)
                if all_resp.status_code == 200:
                    all_donations = all_resp.json()
            except Exception:
                pass

        matches = []
        for assoc in request.associations:
            distance = geodesic(
                (assoc.get('lat', 48.8566), assoc.get('lon', 2.3522)),
                (donation['pickup_lat'], donation['pickup_lon'])
            ).kilometers

            score, reasons, breakdown, urgency = calculate_compatibility_score(
                donation, assoc, distance, all_donations
            )

            matches.append({
                "association_id":     assoc.get('id', ''),
                "association_name":   assoc.get('name', 'Inconnu'),
                "score":              score,
                "score_breakdown":    breakdown,
                "compatibility":      get_compatibility_label(score),
                "urgency_level":      urgency,
                "reasons":            reasons[:4],
                "estimated_distance": round(distance, 2)
            })

        matches.sort(key=lambda x: x['score'], reverse=True)

        return {
            "matches":            matches[:10],
            "best_match":         matches[0] if matches else None,
            "total_evaluated":    len(matches),
            "processing_time_ms": round((time.time() - start) * 1000, 2)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur match_batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/match/donation/{donation_id}/suggestions")
async def get_suggestions(donation_id: str, limit: int = 5):
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            don_resp = await client.get(
                f"{DONATION_SERVICE_URL}/api/donations/{donation_id}",
                timeout=10.0
            )
            if don_resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Don non trouve")
            donation = don_resp.json()

            # Associations
            associations = []
            try:
                users_resp = await client.get(
                    f"{USER_SERVICE_URL}/api/users/associations",
                    timeout=10.0
                )
                if users_resp.status_code == 200:
                    associations = users_resp.json()
                    logger.info(f"Associations: {len(associations)}")
            except Exception as e:
                logger.warning(f"User-service indisponible: {e}")

            # Historique complet
            all_donations = []
            try:
                all_resp = await client.get(
                    f"{DONATION_SERVICE_URL}/api/donations",
                    timeout=10.0
                )
                if all_resp.status_code == 200:
                    all_donations = all_resp.json()
            except Exception:
                pass

        if not associations:
            return {
                "donation_id":        donation_id,
                "suggestions":        [],
                "total":              0,
                "message":            "Aucune association disponible",
                "processing_time_ms": round((time.time() - start) * 1000, 2)
            }

        matches = []
        for assoc in associations:
            distance = geodesic(
                (assoc.get('lat', 48.8566), assoc.get('lon', 2.3522)),
                (donation['pickup_lat'], donation['pickup_lon'])
            ).kilometers

            score, reasons, breakdown, urgency = calculate_compatibility_score(
                donation,
                {
                    'id':                   str(assoc.get('id', '')),
                    'capacity':             assoc.get('capacity', 100),
                    'preferred_food_types': assoc.get('preferred_food_types', [])
                },
                distance,
                all_donations
            )

            matches.append({
                "association_id":     str(assoc.get('id', '')),
                "association_name":   assoc.get('name', 'Inconnu'),
                "score":              score,
                "score_breakdown":    breakdown,
                "compatibility":      get_compatibility_label(score),
                "urgency_level":      urgency,
                "reasons":            reasons,
                "estimated_distance": round(distance, 2)
            })

        matches.sort(key=lambda x: x['score'], reverse=True)

        return {
            "donation_id":        donation_id,
            "suggestions":        matches[:limit],
            "total":              len(matches),
            "algorithm":          "multi-criteria-v2",
            "processing_time_ms": round((time.time() - start) * 1000, 2)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3005)