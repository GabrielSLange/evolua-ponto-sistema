// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona 'ttf' na lista de arquivos que o Metro deve processar
config.resolver.assetExts.push('ttf');

module.exports = config;