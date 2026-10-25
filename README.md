# 웹 도구 작업 공간

pnpm workspace의 `apps/web`에 Next.js App Router, TypeScript, Emotion을 구성한다. Node.js 22 이상과 pnpm 10.33.0을 사용한다.

```sh
pnpm install
pnpm dev
```

개발 서버는 `http://localhost:3000`에서 열린다. `/`와 `/style-check/`는 스타일 검증용 페이지다.

```sh
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
```

정적 결과는 `apps/web/out`에 생성된다. 미리보기 주소는 `http://127.0.0.1:4173`이다. 서버 런타임 없이 정적 파일을 제공하며 `next start`는 사용하지 않는다.

## Emotion 사용 규칙

- 페이지, 레이아웃, 메타데이터는 Server Component로 유지한다.
- Emotion UI는 `"use client"`로 분리하고 파일 맨 위에 `/** @jsxImportSource @emotion/react */`를 선언한다. 전역 `jsxImportSource` 설정으로 Server Component가 Emotion 런타임을 호출하지 않도록 한다.
- `@emotion/react`의 `css({ ... })` 객체 문법으로 정적 스타일을 컴포넌트 밖에 선언한다.
- 루트의 `EmotionRegistry`가 렌더링별 캐시를 만들고 `useServerInsertedHTML`로 수집한 스타일을 초기 HTML에 삽입한다. 클라이언트에서는 같은 캐시를 유지한다.
- Tailwind와 별도 Babel 설정은 사용하지 않는다.

## 검증

최초 한 번 Chromium을 설치한 뒤 빌드 결과를 검사한다.

```sh
pnpm --filter @work/web exec playwright install chromium
pnpm build
pnpm test
```

테스트는 정적 HTML의 본문, 제목, 설명과 Emotion 스타일을 검사한다. Chromium에서 JavaScript를 끈 초기 스타일, 상태 변경, 클라이언트 페이지 이동, 새로고침, 콘솔 오류와 hydration 오류를 확인한다. 검증용 정적 서버는 테스트가 실행하고 종료한다.

Next.js의 [CSS-in-JS 안내](https://nextjs.org/docs/app/guides/css-in-js)에서 Emotion의 App Router 지원은 진행 중으로 분류된다. 현재 구성은 위의 정적 페이지 범위를 검증한다. 향후 스트리밍, Suspense, Emotion Global 등 사용 범위를 넓히면 해당 동작도 추가 검증한다.

이미지 변환 기능, NestJS 앱, 배포는 이번 구성에 포함하지 않는다.
