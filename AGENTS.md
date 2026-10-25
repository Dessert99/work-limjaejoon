# 프로젝트 지침

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
