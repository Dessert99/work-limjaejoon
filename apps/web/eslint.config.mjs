import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/** App Router 규칙을 유지하면서 생성 파일은 린트 대상에서 제외한다. */
export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "out/**", "next-env.d.ts", "test-results/**", "playwright-report/**"]),
]);
