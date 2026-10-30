# 프로젝트의 Node.js 22 환경에 맞추고 외부 처리 프로그램을 설치하기 쉬운 Debian 이미지를 사용한다.
FROM node:22-bookworm-slim AS base
# 모노레포의 상대 경로와 pnpm 의존성 연결을 유지한다.
WORKDIR /workspace
# 루트 packageManager에 고정된 pnpm 버전을 사용할 수 있게 한다.
RUN corepack enable
# 소스 변경 때 의존성 설치 캐시를 재사용하도록 설치 정보부터 복사한다.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

# TypeScript 컴파일 도구는 빌드 단계에서만 설치한다.
FROM base AS build
# 프론트 의존성을 제외하고 잠금 파일에 기록된 API 의존성만 설치한다.
RUN pnpm --filter @work/api... install --frozen-lockfile
# 실제 서버 소스와 컴파일 설정을 빌드 단계에 추가한다.
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/src ./apps/api/src
# 실행할 JavaScript를 apps/api/dist에 생성한다.
RUN pnpm --filter @work/api build

# 실행 이미지에는 컴파일 도구와 원본 소스를 포함하지 않는다.
FROM base AS runtime
# 의존성과 NestJS를 운영 모드로 실행한다.
ENV NODE_ENV=production
# API 실행에 필요한 의존성만 잠금 파일 기준으로 설치한다.
RUN pnpm --filter @work/api... install --prod --frozen-lockfile
# 빌드된 서버만 실행 이미지로 가져온다.
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
# 관리자 권한 없이 서버를 실행한다.
USER node
# 서버가 사용하는 포트를 문서화하며 실제 호스트 연결은 Compose에서 설정한다.
EXPOSE 3101
# 중간 셸 없이 Node.js를 실행해 종료 신호가 서버에 전달되게 한다.
CMD ["node", "apps/api/dist/main.js"]
