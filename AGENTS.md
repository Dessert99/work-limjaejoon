# 프로젝트 지침


## 주석

주석은 모든 export에 단일 라인 JSDoc(/** ... */), 함수 본문 안 비자명 로직에 한 줄 //로 WHY(의도·함정)를 적는다. 본문은 한국어, 식별자는 영어. 멀티라인 블록·@param/@returns 태그·코드 받아쓰기(WHAT)는 금지 — 한 줄에 안 들어가면 주석 문제가 아니라 코드 분리·네이밍 신호다. 기초 개념(fail-fast, barrel 등)도 풀어쓰지 말고 한 줄 안에 단어로 녹인다. 보안 위험·법적 구속처럼 길게 풀 정당한 이유가 있을 때만 멀티라인을 허용한다.

## 기술 스택

- pnpm workspace 기반 모노레포로 관리한다.
- 프론트엔드: Next.js(App Router) + React + TypeScript.
- 스타일링: Emotion + css prop. `@emotion/react`의 객체 문법을 사용하고 정적 스타일은 컴포넌트 밖에 선언한다.
- 페이지와 메타데이터는 Server Component로 유지하고, Emotion UI는 Client Component로 분리한다.
- Emotion UI 파일에만 `/** @jsxImportSource @emotion/react */`를 선언한다.
- 백엔드: NestJS + TypeScript.
- 검색 유입을 위해 도구별 설명과 사용법을 정적 HTML로 생성하고, 페이지별 메타데이터를 제공한다.
- 프론트엔드는 정적 내보내기를 기본으로 하며, 서버 처리는 NestJS API가 담당한다.

## 폴더 구조

```text
apps/
├── web/
│   └── src/
│       ├── app/       # 라우트, 레이아웃, 메타데이터
│       ├── features/  # 도구별 UI, 처리 함수, Worker
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

## Blender 웹 작업

- Blender 조작은 Codex와 `blender` MCP를 사용한다. 반복 절차는 `.agents/skills/blender-web-workflow/SKILL.md`, 설정과 복구는 `docs/blender-workflow.md`를 따른다.
- 작업 원본은 `assets/blender/workshop.blend`, 내보낼 컬렉션은 `Workshop`이다. 원본과 웹 GLB를 함께 보관한다.
- 기존 사물 이름과 도구 연결용 사용자 속성을 임의로 바꾸지 않는다.
- 웹 반영은 저장 후 GLB 내보내기로 처리한다. 내보내기와 브라우저 확인이 성공했을 때만 완료로 보고한다.
- 작업용 미리보기는 `/dev/scene/`에 두며 페이지와 메타데이터는 Server Component를 유지한다.
