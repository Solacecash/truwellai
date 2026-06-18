/** @type {import('@babel/core').ConfigFunction} */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated must be the last plugin or Android release builds can crash / misbehave.
    plugins: ['react-native-reanimated/plugin'],
  };
};
