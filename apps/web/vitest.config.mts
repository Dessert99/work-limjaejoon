import { defineConfig } from 'vitest/config';

/** 테스트 사이에 mock 호출 기록과 전역 대체 상태가 남지 않게 한다. */
export default defineConfig({
  test: {
    clearMocks: true,
    unstubGlobals: true,
  },
});
