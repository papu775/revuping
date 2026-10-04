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
    // This explicit server entry point imports server-only session authorization.
    files: [
      'src/app/workspace/page.tsx',
      'src/app/workspace/layout.tsx',
      'src/app/workspace/dashboard/page.tsx',
      'src/app/workspace/qr-studio/page.tsx',
      'src/app/workspace/feedback/page.tsx',
      'src/app/workspace/settings/page.tsx',
      'src/app/(account)/login/page.tsx',
      'src/app/(account)/signup/page.tsx',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    ignores: ['.next/**/*', '**/out-tsc'],
  },
];
