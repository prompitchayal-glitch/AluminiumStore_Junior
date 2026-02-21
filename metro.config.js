// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// รองรับ .mjs (framer-motion ใช้ไฟล์ .mjs)
config.resolver.sourceExts = [...new Set([...(config.resolver.sourceExts || []), 'mjs'])];

// บังคับให้ใช้ UMD/CJS build ของ tslib
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  tslib: require.resolve('tslib/tslib.js'),
};

module.exports = config;
