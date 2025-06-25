module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated/plugin 제거 (현재 설치되지 않음)
    ],
  };
};