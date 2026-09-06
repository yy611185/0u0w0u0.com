import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const typescriptFiles = ['src/**/*.{ts,tsx}', 'vite.config.ts']
const typedRecommended = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: typescriptFiles
}))

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'worker-configuration.d.ts',
      'public/static/assets/**',
      'public/static/fonts/**',
      'public/static/style.css',
      'UI原型及素材/**'
    ]
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      sourceType: 'module'
    }
  },
  ...typedRecommended,
  {
    files: typescriptFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
)
