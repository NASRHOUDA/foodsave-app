import axios from 'axios';

const API_URL = 'http://localhost:3005/api';

class MatchingService {
  // Calculer la compatibilité avec une association
  async matchSingle(donationId, associationData) {
    try {
      const response = await axios.post(`${API_URL}/match/single`, {
        donation_id: donationId,
        ...associationData
      });
      return response.data;
    } catch (error) {
      console.error('Erreur matching:', error);
      return null;
    }
  }

  // Trouver les meilleures associations pour un don
  async matchBatch(donationId, associations) {
    try {
      const response = await axios.post(`${API_URL}/match/batch`, {
        donation_id: donationId,
        associations
      });
      return response.data;
    } catch (error) {
      console.error('Erreur batch matching:', error);
      return null;
    }
  }

  // Obtenir des suggestions pour un don
  async getSuggestions(donationId, limit = 5) {
    try {
      const response = await axios.get(
        `${API_URL}/match/donation/${donationId}/suggestions?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur suggestions:', error);
      return null;
    }
  }

  // Obtenir les statistiques
  async getStats() {
    try {
      const response = await axios.get(`${API_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erreur stats matching:', error);
      return null;
    }
  }
}

export default new MatchingService();
