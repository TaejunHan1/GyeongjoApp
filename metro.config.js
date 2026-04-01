const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web에서 assets 제대로 처리하도록 설정
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'webp');

// 웹에서 unstable_path 이슈 해결
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

module.exports = config;
