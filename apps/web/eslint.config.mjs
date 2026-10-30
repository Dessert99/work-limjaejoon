import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

/** Next.js 권장 규칙을 적용하고 포맷은 Prettier에 맡긴다. */
export default defineConfig([...nextVitals, ...nextTypeScript, prettier]);
