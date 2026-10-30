# 프로젝트 지침

## Git 작업

- Git 작업은 [git.md](git.md)의 지침을 따른다.

## 명세 확인

- 기능 구현 전 [PRD](https://app.notion.com/p/4033b4cce74080d380c6c98c2cd0ea99)의 공통 규칙, 해당 기능 명세와 관련 비기능 요구사항을 확인한다.
- 초안·미정·미확인을 확정 사항으로 취급하지 않는다. 명세에 없는 사용자 동작이나 미결 사항은 구현 전에 사용자에게 확인한다.

## 주석

주석은 모든 export에 단일 라인 JSDoc(/** ... */), 함수 본문 안 비자명 로직에 한 줄 //로 WHY(의도·함정)를 적는다. 본문은 한국어, 식별자는 영어. 멀티라인 블록·@param/@returns 태그·코드 받아쓰기(WHAT)는 금지한다. 한 줄에 안 들어가면 주석 문제가 아니라 코드 분리·네이밍 신호다. 기초 개념(fail-fast, barrel 등)도 풀어쓰지 말고 한 줄 안에 단어로 녹인다. 보안 위험·법적 구속처럼 길게 풀 정당한 이유가 있을 때만 멀티라인을 허용한다.

## 기술 스택

- pnpm workspace 기반 모노레포로 관리한다.
- 프론트엔드: Next.js(App Router) + React + TypeScript.
- 스타일링: vanilla-extract. 토큰 원본은 TS 파일 하나에서 관리하고 CSS 테마와 3D가 공유한다.
- 페이지와 메타데이터는 Server Component로 유지하고, 상호작용이나 브라우저 API가 필요한 부분만 Client Component로 분리한다.
- 백엔드: NestJS + TypeScript.
- 검색 유입을 위해 도구별 설명과 사용법을 정적 HTML로 생성하고, 페이지별 메타데이터를 제공한다.
- 프론트엔드는 `output: 'export'`로 정적 내보내기하고 `--webpack`으로 빌드한다. 런타임 SSR, Route Handler, Server Action에 의존하지 않는다.
- 이미지 변환·압축과 글자 수 세기는 브라우저에서만 처리하고 이미지와 입력한 글을 서버로 보내지 않는다. 나머지 파일 처리는 NestJS API가 담당한다.
- 이미지 도구는 Worker에서 한 장씩 처리하고, 선택한 이미지의 미리보기와 실제 결과 용량을 보여준다. 미리보기에 사용한 결과 파일을 그대로 다운로드하며, 여러 결과는 브라우저에서 ZIP으로 묶는다.
- 이미지 도구의 JPG·WebP 출력은 Canvas를 사용하고 PNG는 무손실 압축한다. 프론트엔드 UI는 추후 별도로 구현하고, 현재는 변환 로직과 테스트만 유지한다.

## 폴더 구조

```text
apps/
├── web/
│   └── src/
│       ├── app/       # 라우트, 레이아웃, 메타데이터
│       ├── features/  # 도구별 UI, API 연동, 브라우저 전용 로직
│       └── shared/    # 여러 도구가 실제로 공유하는 UI와 함수
└── api/
    └── src/
        ├── main.ts
        ├── app.module.ts
        └── 기능별/     # 서버 처리 기능별 NestJS 모듈을 src/ 바로 아래에 배치
```

- 각 앱은 자체 `package.json`을 두고 독립적으로 빌드하고 배포한다.
- 폴더와 공통 패키지는 실제로 필요한 시점에 만든다.
- 프론트엔드에서 백엔드 내부 코드를 직접 가져오지 않는다.
- 각 feature 내부는 역할에 따라 `libs/`(처리 함수), `hooks/`(React hook), `configs/`(설정), `workers/`(Worker 진입점), `types/`(타입)로 나눈다. 실제 코드가 있는 폴더만 만들고 기능 전용 코드는 해당 feature 안에 둔다.

## 테스트

- 테스트는 co-location 방식으로 대상 코드와 같은 폴더에 배치한다. 별도 최상위 `tests/` 폴더로 모으지 않는다.
- TypeScript 테스트 파일은 대상 파일 이름에 `.test.ts` 또는 `.test.tsx`를 붙인다. 예: `libs/image-header.ts` 옆에 `libs/image-header.test.ts`를 둔다.
- TypeScript 테스트 도구는 Vitest를 사용하고, 변환 로직은 Node 환경에서 검사한다.
- Canvas·Worker처럼 테스트 환경에서 실행할 수 없는 브라우저 API는 경계에서 mock으로 대체하고, 실제 브라우저 동작을 검증한 것으로 취급하지 않는다.

## Blender 작업

- Blender 조작은 Codex와 `blender` MCP를 사용한다.
- 작업 원본은 현재 작업 폴더의 `assets/blender/toolbax.blend`, 내보낼 컬렉션은 `Toolbax`이다.
- 작업 전 MCP 연결 상태와 열린 파일 경로를 확인한다. 다른 파일이 열려 있으면 저장되지 않은 작업을 덮어쓰지 말고 원본으로 전환해도 되는지 확인한다.
- 기존 사물 이름과 도구 연결용 사용자 속성을 임의로 바꾸지 않는다.
- 의미 있는 수정 후 `.blend` 원본을 저장한다. 저장만으로 GLB를 내보내지 않는다.
- 사용자가 GLB 내보내기나 웹 반영을 요청한 경우에만 Blender 기본 glTF 내보내기를 사용한다. 기본 경로는 `apps/web/public/models/toolbax/scene.glb`다.
- GLB는 `Toolbax` 컬렉션을 대상으로 모디파이어와 사용자 속성을 포함하고, 카메라와 조명은 제외한다. 재질은 glTF 호환 노드를 사용한다.
- 수정 결과는 Blender 화면에서 확인하고, 저장과 내보내기 여부를 구분해 보고한다. 웹 반영은 브라우저에서 실제 장면까지 확인한 경우에만 완료로 보고한다.
- 현재 웹 미리보기는 없다. 웹 확인이 불가능하면 그 제한을 알린다.
