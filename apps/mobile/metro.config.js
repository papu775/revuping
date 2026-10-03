const { withNxMetro } = require('@nx/expo');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@expo/metro/metro-config');
const path = require('path');

const appRoot = __dirname;
const defaultConfig = getDefaultConfig(appRoot);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  cacheVersion: 'mobile',
  projectRoot: appRoot,
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    unstable_allowRequireContext: true,
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
  },
};

const nxConfig = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  debug: true,
  extensions: [],
  watchFolders: [],
});

// Force projectRoot to be the app directory
nxConfig.projectRoot = appRoot;

// Wrap the Nx resolver to debug what it's trying to resolve
const originalResolveRequest = nxConfig.resolver.resolveRequest;
nxConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  console.log('[DEBUG] Resolving:', moduleName, 'from', context.originModulePath);
  return originalResolveRequest(context, moduleName, platform);
};

module.exports = nxConfig;
