# 웹 도구 작업 공간

pnpm workspace의 `apps/web`에 Next.js App Router, React, TypeScript를 구성한다. Node.js 22 이상과 pnpm 10.33.0을 사용한다.

현재 프론트엔드는 `/`의 빈 페이지와 루트 레이아웃만 제공한다. 기존 이미지 변환기와 Blender 웹 미리보기, 관련 테스트 및 웹 모델은 제거했다.

```sh
pnpm install
pnpm dev
```

개발 서버는 `http://localhost:3000`에서 열린다.

```sh
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

정적 결과는 `apps/web/out`에 생성된다. 미리보기 주소는 `http://127.0.0.1:4173`이다. 서버 런타임 없이 정적 파일을 제공하며 `next start`는 사용하지 않는다.

Blender 원본인 `assets/blender/workshop.blend`와 `scripts/blender` 작업 스크립트는 유지한다. [Blender 작업 안내](docs/blender-workflow.md)의 웹 미리보기와 웹 검증 절차는 현재 프론트엔드에서 사용할 수 없다. 내보내기 스크립트를 실행하면 웹 모델 파일이 다시 생성될 수 있다.
