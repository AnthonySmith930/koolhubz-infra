import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,
  
  // Prettier config to disable conflicting rules
  prettierConfig,
  
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**'
    ]
  },

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'prettier': prettierPlugin,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',
      
      // TypeScript specific rules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      //'@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        }
      ],
      '@typescript-eslint/no-empty-function': 'warn',
      'no-unused-vars': 'off', // Use TypeScript's version instead
      
      // General rules
      'no-debugger': 'error',
      'no-alert': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'no-duplicate-imports': 'error',
      
      // Disabled because Prettier handles these
      'indent': 'off',
      'quotes': 'off',
      'semi': 'off',
      'comma-dangle': 'off',
      'max-len': 'off',
    },
  },
  
  // Test files specific overrides
  {
    files: ['test/**/*.ts', '**/*.test.*', '**/*.spec.*'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];