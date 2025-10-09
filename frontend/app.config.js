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
      supportsTablet: true
   },
   android: {
      adaptiveIcon: {
         foregroundImage: './assets/images/adaptive-icon.png',
         backgroundColor: '#ffffff'
      },
      permissions: [
         'ACCESS_FINE_LOCATION',
         'ACCESS_COARSE_LOCATION'
      ]
   },
   web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
   },
   extra: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
   },
};