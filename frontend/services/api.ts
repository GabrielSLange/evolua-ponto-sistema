import axios from 'axios';

const api = axios.create({
   // URL de produção
   // baseURL: 'https://evolua-ponto-sistema-production.up.railway.app/api/',
   baseURL: 'https://localhost:7080/api/',
});

export default api;