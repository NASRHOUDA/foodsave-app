import axios from 'axios';

const API_URL = 'http://localhost:3002/api';

const requestService = {
  // Créer une demande
  createRequest: async (requestData) => {
    try {
      // S'assurer que tous les IDs sont des strings
      const formattedData = {
        donation_id: String(requestData.donation_id),
        association_id: String(requestData.association_id),
        association_name: requestData.association_name,
        merchant_id: String(requestData.merchant_id),
        message: requestData.message
      };
      
      console.log('📤 Données formatées:', formattedData);
      
      const response = await axios.post(`${API_URL}/requests`, formattedData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Réponse:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur détaillée:', error.response?.data);
      throw error.response?.data || { error: 'Erreur lors de la demande' };
    }
  },

  // Récupérer les demandes reçues par un commerçant
  getMerchantRequests: async (merchantId) => {
    try {
      const response = await axios.get(`${API_URL}/requests/merchant/${String(merchantId)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  // Récupérer les demandes envoyées par une association
  getAssociationRequests: async (associationId) => {
    try {
      const response = await axios.get(`${API_URL}/requests/association/${String(associationId)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  // Répondre à une demande (accepter/refuser)
  respondToRequest: async (requestId, status, message) => {
    try {
      const response = await axios.post(`${API_URL}/requests/${String(requestId)}/respond`, {
        status,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Erreur réponse:', error);
      throw error.response?.data || { error: 'Erreur lors de la réponse' };
    }
  }
};

export default requestService;
