import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 프로젝트의 한국어 AGENTS.md 지침을 유지한다.
  agentRules: false,
  output: 'export',
  trailingSlash: true,
  // 정적 페이지를 만드는 작업자를 하나로 제한해 로컬과 배포 빌드의 메모리 사용을 줄인다.
  experimental: { cpus: 1 },
};

/** 정적 배포 설정을 개발 서버와 빌드에 동일하게 적용한다. */
export default createVanillaExtractPlugin()(nextConfig);
