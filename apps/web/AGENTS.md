# 프론트엔드 구조 지침

[나의 아키텍처](https://app.notion.com/p/4093b4cce74080189a7ac387b6225dc7)를 이 프로젝트의 Next.js App Router와 정적 내보내기에 적용한다. 경로 기준은 `apps/web/`이며 예시 문서의 `src/`에 해당한다. 별도 `src/`를 두지 않고 `@/*`는 `apps/web/*`를 가리킨다. 루트 지침의 제품 동작, 보안, Blender 규칙은 그대로 따른다.

## 층과 의존 방향

| 층 | 경로 | 역할과 허용 의존성 |
| --- | --- | --- |
| pages | `app/`의 라우트 파일 | 진입점, 메타데이터, 공통 틀. 화면 부품과 아래층 사용 |
| widgets | `app/**/_components/` | 화면 조립, 상태, 브라우저 상호작용. domains와 shared 사용 |
| entities | `domains/<domain>/` | 도구별 처리 규칙과 데이터. 다른 domain과 shared 사용, 순환 금지 |
| shared | `components/ui/`, `lib/` | 업무를 모르는 UI와 함수. shared만 사용 |

- 아래층에서 위층을 가져오지 않는다. 타입 import와 재내보내기에도 동일하다.
- `_components/`는 소유한 라우트 폴더와 그 하위에서만 사용한다. 형제 라우트에서 필요하면 가장 가까운 공통 상위로 옮긴다.
- `app/` 내부 참조는 상대 경로, 아래층 참조는 `@/` 별칭을 쓴다.
- domain 사이에 순환이 생기면 조합 책임을 화면으로 올린다.
- 필요한 파일이 생길 때만 폴더를 만든다. 현재 공용 UI가 없으므로 `components/ui/`는 만들지 않는다.

## 파일 자리 정하기

실제 import 사용처를 검색하고 아래 순서에서 처음 해당하는 자리에 둔다.

1. 한 파일만 쓰는 타입, 상수, 일반 함수는 그 파일 안에 두고 export하지 않는다.
2. 컴포넌트와 hook이 아니면서 도메인의 타입이나 값을 쓰면 해당 `domains/<domain>/` 세그먼트에 둔다.
3. 나머지 일반 함수는 `lib/`에 둔다.
4. 한 도메인 화면 안에서만 쓰는 컴포넌트와 hook은 사용 라우트의 가장 가까운 공통 상위 `_components/`에 둔다.
5. 여러 도메인 화면이 쓰고 domain에 의존하는 표시 컴포넌트는 `domains/<domain>/ui/`에 둔다. 데이터 로딩과 라우팅을 하는 hook은 화면에서 조합한다.
6. 여러 도메인 화면이 쓰고 domain에 의존하지 않는 컴포넌트는 `components/ui/`, hook은 `lib/hooks/`에 둔다.

- 한 파일 한 컴포넌트 규칙이 우선한다. 한 곳에서만 쓰더라도 컴포넌트는 별도 파일로 둔다.
- 사용처가 늘거나 줄면 위 순서로 위치를 다시 정하고 모든 import를 함께 고친다. 복사하거나 미래의 재사용을 예상해 공용으로 올리지 않는다.
- hook은 컴포넌트와 같은 위치 결정 규칙을 따른다. domain별 `hooks/`는 만들지 않는다.
- 테스트와 Worker 진입점, vanilla-extract 스타일은 실행 경계나 도구의 파일 요구 때문에 분리하고 관련 코드 곁에 둔다.

## domain의 다섯 세그먼트

| 세그먼트  | 책임                                                   |
| --------- | ------------------------------------------------------ |
| `api/`    | NestJS 엔드포인트와 1:1 요청 함수, 도입 시 쿼리 팩토리 |
| `model/`  | 데이터 계약과 타입, 도입 시 검증 스키마                |
| `lib/`    | 변환, 계산, 검증 등 처리 규칙                          |
| `config/` | 상수, 도구별 화면 주소, 주소 쿼리 파서                 |
| `ui/`     | props만 받아 그리는 업무 표시 컴포넌트                 |

- domain은 Next.js를 모른다. `next/*`, 라우팅, 화면 컴포넌트를 가져오지 않는다. `ui/`는 쿼리 실행이나 주소 읽기를 하지 않는다.
- `image-converter/lib/`에 브라우저 처리와 Worker 진입점 및 실행 함수를 둔다. 브라우저 API 의존은 허용하며 Next.js와 분리한다. 입력 이미지와 글은 서버로 보내지 않는다.
- `image-converter/model/`은 변환 옵션, 결과, Worker 메시지 계약을 가진다. 서버 통신용 스키마 라이브러리는 아직 없다.
- `toolbax/lib/`는 자산에서 가져온 재생 데이터 계산을 담당한다. Canvas, 카메라, 로딩, 재생 버튼은 화면 부품이다.
- 서버 요청 함수는 응답을 경계에서 검증한다. 쿼리 도구를 도입하면 domain마다 팩토리 하나를 두고 데이터 조건은 팩토리, 화면 오류 정책은 사용처에서 정한다.

## 화면과 파일 모양

- `page.tsx`는 설명과 페이지 내용을 조립하는 Server Component다. 메타데이터와 검색용 정적 HTML을 유지한다.
- `layout.tsx`는 하위 화면의 공통 틀을 담당한다. Client Component는 상호작용과 브라우저 API 경계에만 둔다.
- 오류와 없음 화면을 구현할 때 layout 경계에 `error.tsx`, `not-found.tsx`를 두고 같은 모양은 상위 경계에서 재사용한다. 현재 구조 변경만으로 미정인 오류 UI를 추가하지 않는다.
- `output: 'export'`와 webpack 빌드를 유지한다. 런타임 SSR, Route Handler, Server Action을 추가하지 않는다.
- 화면 부품은 `_components/` 아래에 두고 딸린 파일이 있는 영역만 한 단계 하위 폴더로 묶는다. 현재는 `app/_components/toolbax/`다.
- 한 파일에 컴포넌트 하나만 둔다. 이름과 파일명은 일치시킨다. App Router 예약 파일명은 예외다.
- JSX를 반환하는 함수는 컴포넌트다. `renderRow()` 같은 일반 함수에 JSX를 숨기지 않는다. `map`과 라이브러리 콜백 안의 인라인 JSX는 허용한다.
- 파일 전용 타입과 상수는 export하지 않는다. 테스트는 소스 옆에 둔다.
- 공용 UI가 생기면 `primitives/`, `composites/`, `layouts/` 중 실제 역할에 맞는 폴더를 만든다.
- 디자인 토큰의 유일한 원본은 `lib/styles/tokens.ts`다. CSS와 3D가 함께 읽는다.

## 검사와 적용 범위

- `pnpm --filter @work/web check`로 구조 검사, ESLint, 타입 검사, Vitest를 실행한다. 기존 `lint` 명령에도 구조 검사가 연결되어 있다.
- ESLint는 별칭 import의 층 방향, domain의 Next.js 의존, 이름 붙인 소문자 JSX 함수를 검사한다.
- `scripts/check-architecture.mjs`는 상대 경로와 별칭의 층 방향, `_components/` 소유 경계, domain 순환을 검사한다. 정적 import, export, 문자열 동적 import, Worker의 `new URL`을 확인한다. 변수로 계산하는 모듈 경로는 사용하지 않는다.
- 실제 사용처에 맞는 위치, 세그먼트의 의미, 한 파일 한 컴포넌트는 리뷰에서도 확인한다.
- 참고 문서의 선택적 상태 처리 규칙과 TanStack Query, zod, React Hook Form, nuqs, Base UI, cva는 이번 변경으로 채택하지 않는다. 사용자 동작을 새로 정할 때 PRD와 사용자 확인을 따른다.
