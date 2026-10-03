const { getDefaultConfig } = require('expo/metro-config');

// Expo's Metro config discovers pnpm workspaces and uses Expo autolinking.
// Preserve the Expo transformer when loading code-native SVG assets.
const config = getDefaultConfig(__dirname);
config.transformer.babelTransformerPath =
  require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg',
);
config.resolver.sourceExts = [
  ...new Set([...config.resolver.sourceExts, 'svg']),
];
module.exports = config;
