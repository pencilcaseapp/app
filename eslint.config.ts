import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  globalIgnores(['**/.react-router/']),
  stylistic.configs.customize({
    semi: true,
  }),
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
]);
