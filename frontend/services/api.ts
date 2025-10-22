// frontend/api.ts
import axios from 'axios';
import Constants from 'expo-constants';
import { eventBus } from './eventBus';

// Pega a URL do objeto 'extra' que definimos no app.config.js
const apiUrl = Constants.expoConfig?.extra?.apiUrl;

const api = axios.create({
   baseURL: apiUrl,
});

api.interceptors.response.use(
   (response) => response,
   (error) => {
      if (error.response?.status === 401) {
         eventBus.emit('auth-unauthorized', {}); // <-- Usa o event bus
      }
      return Promise.reject(error);
   }
);

export default api;