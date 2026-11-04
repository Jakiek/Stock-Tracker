import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'server/dist', '.vercel'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Aturan lapisan (CLAUDE.md § Aturan lapisan) — dipaksakan oleh linter,
  // bukan cuma disepakati. domain/ hanya boleh mengimpor config/.
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'react/*'],
              message: 'domain/ tidak boleh mengimpor React.',
            },
            { group: ['**/data/**', '**/data'], message: 'domain/ tidak boleh mengimpor data/.' },
            {
              group: ['**/hooks/**', '**/components/**', '**/pages/**'],
              message: 'domain/ tidak boleh mengimpor lapisan presentasi.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'domain/ tanpa I/O.' },
        { name: 'sessionStorage', message: 'domain/ tanpa I/O.' },
        { name: 'fetch', message: 'domain/ tanpa I/O.' },
        { name: 'window', message: 'domain/ tanpa I/O.' },
      ],
    },
  },
  {
    files: ['src/config/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['**/*', '*'], message: 'config/ tidak mengimpor apa pun.' }] },
      ],
    },
  },
  {
    files: ['src/data/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/hooks/**', '**/components/**', '**/pages/**'],
              message: 'data/ tidak boleh mengimpor lapisan presentasi.',
            },
          ],
        },
      ],
    },
  },

  // Server berjalan di Node: hanya boleh memakai domain/ dan config/ dari src/ —
  // logika yang sama dengan klien, tanpa React/localStorage.
  {
    files: ['server/**/*.ts', 'api/**/*.js'],
    ignores: ['server/__tests__/**'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/src/data/**',
                '**/src/hooks/**',
                '**/src/components/**',
                '**/src/pages/**',
                'react',
                'react-*',
              ],
              message: 'server/ hanya boleh mengimpor src/domain dan src/config.',
            },
          ],
        },
      ],
    },
  },
  { files: ['server/__tests__/**/*.ts'], languageOptions: { globals: globals.node } },
)
