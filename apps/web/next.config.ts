import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 프로젝트의 한국어 AGENTS.md 지침을 유지한다.
  agentRules: false,
  output: "export",
  trailingSlash: true,
  compiler: { emotion: true },
};

export default nextConfig;
