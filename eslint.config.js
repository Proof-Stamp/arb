import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/App.tsx'],
    rules: {
      // Receipt filename sanitization intentionally matches C0 control characters.
      'no-control-regex': 'off',
    },
  },
  {
    files: ['*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
