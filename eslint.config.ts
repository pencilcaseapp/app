import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import eslintReact from '@eslint-react/eslint-plugin';

export default defineConfig([
  globalIgnores(['**/.react-router/']),
  stylistic.configs.customize({
    semi: true,
  }),

  tseslint.configs.recommended,
  eslintReact.configs['recommended-typescript'],
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/max-len': ['error', {
        code: 80,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreUrls: true,
        ignoreRegExpLiterals: true,
      }],
    },
  },
]);
