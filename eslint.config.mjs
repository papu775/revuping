import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/test-output'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              notDependOnLibsWithTags: ['type:app', 'type:e2e'],
            },
            {
              sourceTag: 'platform:browser',
              onlyDependOnLibsWithTags: [
                'platform:browser',
                'platform:neutral',
              ],
              bannedExternalImports: [
                '@nestjs/*',
                '@prisma/*',
                'prisma',
                'pg',
                'mysql2',
                'node:*',
              ],
            },
            {
              sourceTag: 'platform:neutral',
              onlyDependOnLibsWithTags: ['platform:neutral'],
              bannedExternalImports: [
                '@nestjs/*',
                '@prisma/*',
                'next',
                'react',
                'node:*',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:contracts',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:contracts',
              onlyDependOnLibsWithTags: ['type:contracts'],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:contracts',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: [
                'type:data-access',
                'type:contracts',
                'type:util',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];

// Browser source may only access server modules inside an explicit server directory.
// Future Next server modules must also import 'server-only'.
export const browserSourceRules = {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: [
            '@nestjs/*',
            '@prisma/*',
            'prisma',
            'pg',
            'mysql2',
            'node:*',
            'fs',
            'fs/*',
            'path',
            'crypto',
            'child_process',
            'net',
            'tls',
            'http',
            'https',
            'os',
            'stream',
            'buffer',
            'worker_threads',
          ],
          message:
            'Server packages belong in API or explicitly isolated Next server modules.',
        },
        {
          group: [
            '@/server',
            '@/server/**',
            '@/app/api/**',
            '**/app/api/**',
            '**/server',
            '**/server/**',
          ],
          message: 'Browser code must not import server modules.',
        },
      ],
    },
  ],
};
