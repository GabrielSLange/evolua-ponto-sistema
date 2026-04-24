// frontend/app.config.js
require('dotenv').config({ path: '.env.local' });

module.exports = {
   name: 'Evolua Ponto',
   slug: 'evolua-ponto',
   version: '1.0.0',

   extra: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
   },

   // Adiciona isso:
   web: {
      bundler: "metro",
      output: "single",
   },
};