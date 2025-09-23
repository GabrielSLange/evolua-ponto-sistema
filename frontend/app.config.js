// frontend/app.config.js
require('dotenv').config({ path: '.env.local' });

module.exports = {
   // Você provavelmente já tem configurações como 'name', 'slug', 'version', etc.
   // Pode mantê-las. A parte mais importante é adicionar o objeto 'extra'.
   name: 'evolua-ponto-frontend', // Use o nome do seu app
   slug: 'evolua-ponto-frontend',
   version: '1.0.0',

   // ... outras configurações do seu app ...

   // Adicione esta seção "extra":
   extra: {
      // Esta é a parte importante.
      // Ele pega a variável de ambiente do processo de build...
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
   },
};