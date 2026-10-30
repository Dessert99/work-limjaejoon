# 웹 도구 작업 공간

pnpm workspace의 `apps/web`에 Next.js App Router, React, TypeScript를 구성한다. Node.js 22.13 이상과 pnpm 10.33.0을 사용한다.

현재 `/`는 빈 페이지다. 이미지 변환용 임시 UI와 관련 UI 테스트는 제거했으며, `apps/web/src/features/image-converter`에 브라우저 변환 로직과 Worker, ZIP 생성 및 Vitest 테스트를 유지한다. 화면에서 파일을 선택하거나 다운로드하는 기능은 현재 제공하지 않는다.

변환 로직은 JPG와 WebP에 Canvas, PNG에 OxiPNG 무손실 인코딩을 사용한다. 현재는 메타데이터를 제거하고, 용량이 증가해도 요청한 출력 형식을 유지한다. JPG의 투명 영역은 흰색으로 채우고, 움직이는 PNG와 WebP는 거부한다. 이 예외 정책은 최종 제품 동작을 확정한 것이 아니다.

변환 로직의 메모리 보호를 위한 임시 상한은 파일당 90MB, 이미지당 2,400만 픽셀, 긴 변 16,384px이다. 기존 UI에서 적용하던 30장·입력 합계 300MB 제한은 UI 제거와 함께 사라졌으며, 새 UI를 구현할 때 일괄 처리 상한을 정해야 한다. 최종 상한과 PC 및 모바일 성능은 실제 기기에서 추가 검증한다. 기존 Blender 웹 미리보기와 웹 모델은 제거된 상태다.

```sh
pnpm install
pnpm dev
```

개발 서버는 `http://localhost:3100`에서 열린다.

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm test
pnpm preview
```

`pnpm lint`는 웹의 Next.js·TypeScript, API의 TypeScript, 루트 JavaScript 설정 파일를 검사한다. `pnpm lint:fix`로 자동 수정 가능한 린트 오류를 고친다. `pnpm format`은 루트 `prettier.config.mjs` 설정으로 파일을 정리하고, `pnpm format:check`는 변경 없이 포맷을 검사한다. 생성 파일, 잠금 파일과 Blender 자산은 포맷 대상에서 제외한다.

`pnpm test`는 Vitest로 코드 옆의 `.test.ts` 파일을 실행한다. 웹 테스트만 실행하려면 `pnpm --filter @work/web test`, 변경 감지는 `pnpm --filter @work/web test:watch`를 사용한다. Node 환경에서 헤더 검사, 변환 옵션과 자원 해제, Worker 순차 처리, ZIP 내용을 검증하며 Canvas·Worker 경계는 mock으로 대체한다. 실제 브라우저의 코덱·다운로드·서버 미전송 검증은 포함하지 않는다. 테스트에 정적 빌드나 미리보기 서버는 필요하지 않다.

정적 결과는 `apps/web/out`에 생성된다. 미리보기 주소는 `http://127.0.0.1:4173`이다. 서버 런타임 없이 정적 파일을 제공하며 `next start`는 사용하지 않는다.

## 로컬 API 실행

Docker를 실행한 뒤 프로젝트 루트에서 API를 빌드하고 실행한다. 프론트는 별도 터미널에서 기존처럼 `pnpm dev`로 실행한다.

```sh
docker compose up --build -d
curl http://localhost:3101/health
```

상태 확인 응답은 `{"status":"ok"}`이다. API 소스를 수정한 뒤에는 같은 실행 명령으로 다시 빌드한다. 프론트의 API 요청은 `http://localhost:3101`로 보낸다.

3100, 3101 포트는 같은 컴퓨터에서 쓰는 pageerp 개발 환경(3001, 5433, 8000, 9000, 9001)과 겹치지 않도록 정했다. 3101 포트를 다른 프로그램이 사용 중이면 `API_PORT=3102 docker compose up --build -d`로 실행한다. 이 경우 상태 확인과 프론트 API 요청 주소도 `http://localhost:3102`로 바꾼다.

```sh
docker compose logs -f api
docker compose down
```

`apps/api/Dockerfile`은 API 이미지 빌드를, `compose.yaml`은 로컬 포트와 환경변수, `/tmp`의 1GiB tmpfs를 설정한다. 각 설정의 역할은 파일 안에 주석으로 적었다. macOS에서는 tmpfs가 Docker의 Linux VM 안에 생성된다. tmpfs만으로 스왑까지 금지되는 것은 아니므로, 운영 환경에서 SSD 기록을 막으려면 VM의 스왑 설정도 별도로 확인해야 한다. 파일 변환 프로그램과 업로드·삭제 로직은 해당 기능을 구현할 때 추가한다.

Blender는 Codex와 Blender MCP로 조작하고, GLB는 요청할 때만 내보낸다. 작업 원칙은 `AGENTS.md`를 따른다. 연습용 모델과 프로젝트 전용 스크립트는 제거된 상태이며 현재 웹 미리보기는 없다.
