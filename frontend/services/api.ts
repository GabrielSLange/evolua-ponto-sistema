// frontend/api.ts
import axios from 'axios';
import Constants from 'expo-constants';

// Pega a URL do objeto 'extra' que definimos no app.config.js
const apiUrl = Constants.expoConfig?.extra?.apiUrl;

const api = axios.create({
   baseURL: apiUrl,
});

export default api;