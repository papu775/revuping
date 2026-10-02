import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import baseConfig, { browserSourceRules } from '../../eslint.config.mjs';

export default [
  { plugins: { '@next/next': nextEslintPluginNext } },
  ...nx.configs['flat/react-typescript'],
  ...baseConfig,
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    ignores: ['src/server/**', 'src/app/api/**'],
    rules: browserSourceRules,
  },
  {
    ignores: ['.next/**/*', '**/out-tsc'],
  },
];
