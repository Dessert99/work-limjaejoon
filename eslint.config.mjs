import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** API와 실행 스크립트를 검사하고 웹은 Next.js 전용 설정에 맡긴다. */
export default defineConfig([
  globalIgnores(['apps/web/**', '**/dist/**']),
  js.configs.recommended,
  {
    files: ['apps/api/**/*.ts'],
    extends: [tseslint.configs.recommended],
  },
  { languageOptions: { globals: globals.node } },
  prettier,
]);
