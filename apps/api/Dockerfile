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
# 실험 지원을 끄면 설치된 확장이 있어도 HWP 변환을 실행하지 않는다.
ENV HWP_EXPERIMENTAL_ENABLED=1
# PDF 압축과 문서 변환 및 한국어 글꼴을 실행 이미지에만 설치한다.
RUN apt-get update && apt-get install -y --no-install-recommends ghostscript libreoffice-writer libreoffice-impress libreoffice-java-common default-jre-headless fonts-noto-cjk curl ca-certificates && rm -rf /var/lib/apt/lists/*
# 공식 배포 v0.8.0의 GitHub 자산 SHA-256으로 확장 공급원을 고정한다.
# 출처: https://github.com/ebandal/H2Orestart/releases/tag/v0.8.0
RUN curl --fail --location --retry 3 https://github.com/ebandal/H2Orestart/releases/download/v0.8.0/H2Orestart.oxt -o /tmp/H2Orestart.oxt \
    && echo 'f36c19fa6b7dff1cf34114d926bdc088e6bcfa7fdc93d67eaafd3f572be1d62c  /tmp/H2Orestart.oxt' | sha256sum --check - \
    && unopkg add --shared --force --suppress-license /tmp/H2Orestart.oxt \
    && mkdir -p /usr/local/share/h2orestart \
    && touch /usr/local/share/h2orestart/installed \
    && rm /tmp/H2Orestart.oxt
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
