import { defineConfig } from "@playwright/test";

/** 실제 화면을 통해 서비스의 입력 정책과 변환 작업 흐름만 검증한다. */
export default defineConfig({
  testDir: "./src/features",
  testMatch: "**/tests/*.spec.ts",
  use: { baseURL: "http://127.0.0.1:4173", browserName: "chromium" },
  webServer: {
    command: "pnpm preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
