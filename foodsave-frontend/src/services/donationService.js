import axios from 'axios';

const API_URL = 'http://localhost:3002/api';

const donationService = {
  // Créer un don
  createDonation: async (donationData) => {
    try {
      // S'assurer que les dates sont au bon format ISO avec Z
      const formattedData = {
        ...donationData,
        pickup_time_start: new Date(donationData.pickup_time_start).toISOString(),
        pickup_time_end: new Date(donationData.pickup_time_end).toISOString(),
        quantity: parseFloat(donationData.quantity)
      };
      
      console.log('Données formatées:', formattedData);
      
      const response = await axios.post(`${API_URL}/donations`, formattedData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur création don:', error.response?.data || error.message);
      throw error.response?.data || { error: 'Erreur de création' };
    }
  },

  // Récupérer tous les dons
  getAllDonations: async () => {
    try {
      const response = await axios.get(`${API_URL}/donations`);
      return response.data;
    } catch (error) {
      console.error('Erreur:', error);
      throw error.response?.data;
    }
  },

  // Récupérer les dons d'un commerçant
  getMerchantDonations: async (merchantId) => {
    try {
      const response = await axios.get(`${API_URL}/donations/merchant/${merchantId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  // Récupérer les dons réservés par une association
  getAssociationDonations: async (associationId) => {
    try {
      const response = await axios.get(`${API_URL}/donations/association/${associationId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  // Récupérer les dons disponibles près d'une position
  getNearbyDonations: async (lat, lon, radius = 10) => {
    try {
      const response = await axios.get(
        `${API_URL}/donations/available/nearby?lat=${lat}&lon=${lon}&radius_km=${radius}`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  // Réserver un don
  reserveDonation: async (donationId, associationId) => {
    try {
      const response = await axios.post(
        `${API_URL}/donations/${donationId}/reserve?association_id=${associationId}`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur réservation:', error);
      throw error.response?.data || { error: 'Erreur de réservation' };
    }
  }
};

export default donationService;
