import axios from 'axios';

const api = axios.create({
   // URL de produção
   baseURL: 'https://evolua-ponto-sistema-production.up.railway.app/api/',
});

export default api;