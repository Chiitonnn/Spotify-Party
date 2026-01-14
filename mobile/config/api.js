import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const API_URL = 'https://spotify-party.onrender.com/api'; // Changez pour votre IP en dev
// const API_URL = 'http://172.20.10.7:3000/api'; // partage co
const API_URL = 'https://pseudoemotionally-fleshiest-barb.ngrok-free.dev/api'; // partage co

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // Rediriger vers login
    }
    return Promise.reject(error);
  }
);

export default api;