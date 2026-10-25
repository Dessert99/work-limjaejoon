# 웹 도구 작업 공간

pnpm workspace의 `apps/web`에 Next.js App Router, TypeScript, Emotion을 구성한다. Node.js 22 이상과 pnpm 10.33.0을 사용한다.

```sh
pnpm install
pnpm dev
```

개발 서버는 `http://localhost:3000`에서 열린다. `/`에서 이미지 변환 도구로 이동할 수 있다.

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

테스트는 서비스가 정한 입력 제한과 오류 복구, JPEG 흰 배경 처리, 출력 형식 불일치 거절, 이전 작업 결과 무시, 단일 파일 정책, 인코딩 실패 처리를 검증한다. 정적 렌더링·스타일·hydration과 브라우저 기본 인코딩·다운로드 동작은 테스트하지 않는다. 검증용 정적 서버는 테스트가 실행하고 종료한다.

## 이미지 변환

`/tools/image-converter/`에서 PNG, JPEG, WebP 이미지 한 장을 선택해 변환하고 다운로드한다. 서버 업로드와 추가 라이브러리 없이 브라우저의 Canvas API를 사용한다.

- 품질 조절: JPEG와 WebP, 기본 85%. PNG는 품질 옵션을 제공하지 않는다.
- 투명도: PNG와 WebP는 유지하며 JPEG는 흰 배경으로 변환한다.
- 입력 제한: 20 MiB, 2,400만 화소, 한 변 8,192px 이하. 해상도 검사는 디코딩 이후이므로 이미지 디코딩 자체의 메모리 사용까지 제한하지는 않는다.
- 브라우저가 요청한 출력 형식 대신 PNG를 반환하면 오류를 표시한다.
- 애니메이션은 첫 프레임만 처리하며 원본 메타데이터는 보존하지 않는다.

`features/image-converter`에서 화면 컴포넌트, 작업 흐름을 관리하는 훅, React에 의존하지 않는 변환 함수를 분리했다. 훅이 오래된 작업 결과를 무시하고 Blob URL을 해제하며, 변환 함수는 ImageBitmap과 Canvas 자원을 해제한다. 파일이나 옵션을 변경하면 기존 결과가 초기화된다.

변환 API의 근거는 [Canvas toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)과 [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap) 문서에서 확인할 수 있다.

일괄 변환, 리사이즈, Worker, NestJS 앱과 배포는 포함하지 않는다.
