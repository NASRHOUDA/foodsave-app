
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const userService = {
  // Inscription
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/users/register`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erreur de connexion' };
    }
  },

  // Connexion
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/users/login`, credentials);
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erreur de connexion' };
    }
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  // Récupérer l'utilisateur connecté
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Récupérer le token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Récupérer tous les commerçants
  getMerchants: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/merchants`);
      return response.data;
    } catch (error) {
      console.error('Erreur merchants:', error);
      return [];
    }
  },

  // Récupérer toutes les associations
  getAssociations: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/associations`);
      return response.data;
    } catch (error) {
      console.error('Erreur associations:', error);
      return [];
    }
  }
};

export default userService;
