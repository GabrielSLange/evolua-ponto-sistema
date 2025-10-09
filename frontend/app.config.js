// frontend/app.config.js
module.exports = {
   name: 'evolua-ponto-frontend',
   slug: 'evolua-ponto-frontend',
   version: '1.0.0',
   platforms: ['ios', 'android', 'web'],
   orientation: 'portrait',
   icon: './assets/images/icon.png',
   userInterfaceStyle: 'light',
   splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
   },
   assetBundlePatterns: [
      '**/*'
   ],
   ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.evoluaponto.frontend'
   },
   android: {
      adaptiveIcon: {
         foregroundImage: './assets/images/adaptive-icon.png',
         backgroundColor: '#ffffff'
      },
      package: 'com.evoluaponto.frontend'
   },
   web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
   },
   plugins: [
      'expo-router',
      [
         'expo-location',
         {
            locationAlwaysAndWhenInUsePermission: 'Permitir $(PRODUCT_NAME) a usar sua localização.'
         }
      ]
   ],
   extra: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
   },
};