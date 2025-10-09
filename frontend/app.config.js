// frontend/app.config.js
require('dotenv').config({ path: '.env.local' });

module.exports = {
   name: 'evolua-ponto-frontend',
   slug: 'evolua-ponto-frontend',
   version: '1.0.0',
   platforms: ['ios', 'android', 'web'],
   
   // Configurações para react-native-maps
   plugins: [
      [
         'expo-location',
         {
            locationAlwaysAndWhenInUsePermission: 'Este app precisa acessar sua localização para funcionar corretamente.',
         },
      ],
   ],
   
   // Configurações específicas para Android
   android: {
      permissions: [
         'ACCESS_FINE_LOCATION',
         'ACCESS_COARSE_LOCATION',
      ],
      config: {
         googleMaps: {
            apiKey: process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
         },
      },
   },
   
   // Configurações específicas para iOS
   ios: {
      infoPlist: {
         NSLocationWhenInUseUsageDescription: 'Este app precisa acessar sua localização para funcionar corretamente.',
         NSLocationAlwaysAndWhenInUseUsageDescription: 'Este app precisa acessar sua localização para funcionar corretamente.',
      },
   },

   extra: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
   },
};