# 웹 도구 작업 공간

pnpm workspace의 `apps/web`에 Next.js App Router, React, TypeScript를 구성한다. Node.js 22.13 이상과 pnpm 10.33.0을 사용한다.

현재 `/`는 3D 작업방이며 이미지 도구와 라벨을 누르면 `/image-compressor/`로 이동한다. 이미지 용량 줄이기 화면은 확정한 인화지 디자인과 단일 파일 선택·압축·다운로드를 제공한다. `+`를 누르면 이전 이미지와 정보를 지운 뒤 새 파일을 고른다. 선택을 취소하면 빈 상태로 남는다. 파일을 선택하면 Worker가 자동으로 압축하며 원본·결과와 실제 용량을 나란히 보여준다. Download는 완료 후 활성화되고 미리보기에 사용한 결과 파일을 그대로 저장한다. 좌측 홈 링크를 누르면 작업방으로 돌아간다.

제목과 메타데이터, 홈의 도구 링크는 정적 HTML로 생성한다. 검색 유입은 도구 상세 페이지를 대상으로 하며 `/image-compressor/`는 색인을 허용하고 canonical을 `https://work.limjaejoon.com/image-compressor/`로 지정한다. 작업대 아래의 설명과 사용법도 정적 HTML에 포함한다. `apps/web/public/sitemap.xml`에는 구현한 도구 상세 페이지만 등록하고, `robots.txt`에서 이 sitemap을 알린다. 다른 7개 도구 화면은 아직 구현하지 않았으며 FAQ와 관련 도구 목록은 추가하지 않는다.

이미지 도구는 최신 디자인 결정에 따라 JPG·PNG·WebP 한 장만 다루며 파일을 서버로 보내지 않는다. 원본 형식과 해상도를 유지한다. JPG·WebP는 이미지 업로드 후 하단 중앙에 용량 감소 목표 슬라이더(0~99%, 기본 70%)를 표시하며 Download는 오른쪽에 둔다. 빈 상태와 파일 선택 취소 후에는 슬라이더를 숨긴다. 예를 들어 70%는 원본 용량의 30% 이하를 목표로 하며, Worker에서 한 번 디코딩한 뒤 최대 9회 실제 인코딩으로 품질을 탐색한다. 목표에 도달하지 못하면 검사한 작은 결과와 미달 안내를 제공하며 목표율과 실제 감소율을 혼동하지 않는다. 0%는 원본 바이트를 그대로 제공한다. PNG는 기존 무손실 압축을 유지하고 목표 슬라이더를 제공하지 않는다. 이 화면은 해상도 조절 입력이 없다. 설정 변경 즉시 이전 Worker와 결과를 무효화하고 200ms 뒤 최신 목표만 처리한다. 원본 미리보기와 해상도는 유지하고 결과 용량·실제 절감률을 갱신한다. 새 파일을 고르면 목표는 기본값으로 돌아간다. 해상도가 그대로이고 용량도 줄지 않으면 원본 바이트를 유지한다. SVG·HEIC 등은 기존 변환기의 지원 범위 밖이며 안내를 표시한다. `+`를 누르면 이전 Worker를 종료하고 원본·결과 Object URL을 해제한다. 도메인의 ZIP 생성 기능은 유지하지만 이 화면에서는 사용하지 않는다.

제목은 Noto Serif KR의 현재 제목용 부분 글꼴을 사용한다. 다른 도구 제목에 확장할 때 해당 글리프를 추가해야 한다. 폰트와 FColombati 버튼의 배포 허가문은 `apps/web/public/licenses/`에 보관한다. 돌아가기 가방은 원본 GLB를 별도로 읽어 효과와 방을 제외한 아이콘으로 표시하며, 이 아이콘용 조명은 Blender 장면 조명 재현을 뜻하지 않는다.

`pnpm --filter @work/web build` 후 `pnpm --filter @work/web preview`를 켠 상태에서 `node apps/web/app/image-compressor/_components/ImageWorkspace.browser-check.mjs`로 실제 브라우저의 JPG·WebP·PNG 압축, PNG 픽셀 보존, 미리보기·다운로드 바이트 일치, 목표율 변경·0% 원본 유지·목표 미달 안내와 최신 결과 반영, 취소·URL 해제, 손상 파일 처리와 서버 미전송을 검사한다. Playwright Chromium이 설치되어 있어야 하며, 개발 서버를 사용할 때는 `WORKSPACE_PREVIEW_URL=http://localhost:3100`을 지정한다.

변환 로직은 JPG와 WebP에 Canvas, PNG에 OxiPNG 무손실 인코딩을 사용한다. 새로 인코딩한 결과는 메타데이터를 제거한다. 원본 형식·해상도 유지 압축에서 결과가 줄지 않아 원본을 반환할 때는 메타데이터도 원본 그대로 남는다. 별도 형식 변환이나 해상도 축소 요청은 용량이 증가해도 요청한 변환 결과를 유지한다. JPG의 투명 영역은 흰색으로 채우고, 움직이는 PNG와 WebP는 거부한다. 이 예외 정책은 최종 제품 동작을 확정한 것이 아니다.

변환 로직의 메모리 보호를 위한 임시 상한은 파일당 90MB, 이미지당 2,400만 픽셀, 긴 변 16,384px이다. 현재 화면은 한 장만 처리하므로 일괄 처리 상한은 적용하지 않는다. 최종 상한과 PC 및 모바일 성능은 실제 기기에서 추가 검증한다.

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

## 프론트 배포와 검색 노출

프론트는 Cloudflare Pages에 정적 파일로 배포한다. 현재 도구는 API 없이 동작하므로 백엔드를 함께 배포할 필요가 없다. GitHub 자동 배포를 사용하려면 Cloudflare 대시보드의 Workers & Pages에서 Pages 프로젝트를 만들고 `Dessert99/work-limjaejoon` 저장소를 연결한다. Direct Upload로 만든 프로젝트는 나중에 Git 연동 방식으로 전환할 수 없으므로 처음부터 Git 연동을 선택한다.

| 항목               | 값                              |
| ------------------ | ------------------------------- |
| 프로덕션 브랜치    | `main`                          |
| 프레임워크 프리셋  | `Next.js (Static HTML Export)`  |
| 루트 디렉터리      | 저장소 루트                     |
| 빌드 명령          | `pnpm --filter @work/web build` |
| 빌드 출력 디렉터리 | `apps/web/out`                  |
| Node.js            | 루트 `.node-version`의 22 버전  |
| 환경변수           | `PNPM_VERSION=10.33.0`          |
| 사용자 지정 도메인 | `work.limjaejoon.com`           |

첫 배포 후 Pages 프로젝트의 Custom domains에서 도메인을 연결하고 안내되는 DNS 설정을 적용한다. 이후 `main`에 push하면 자동으로 빌드하고 배포한다. 로컬 변경은 커밋과 push 전까지 원격 배포에 반영되지 않는다.

배포 전 `pnpm --filter @work/web check`와 `pnpm --filter @work/web build`를 실행한다. 배포 후 `/image-compressor/` 직접 접속과 새로고침, 이미지 압축·다운로드, `/robots.txt`, `/sitemap.xml`을 확인한다. 상세 페이지의 canonical이 운영 주소인지, HTML과 응답 헤더에 `noindex`가 없는지 확인한다. Cloudflare의 미리보기 배포는 기본 `X-Robots-Tag: noindex`를 유지한다. 운영용 `pages.dev` 주소는 사용자 지정 도메인이 정상 연결된 뒤 Cloudflare Bulk Redirects로 운영 도메인에 연결한다.

Google Search Console에서 운영 도메인 소유권을 확인하고 `https://work.limjaejoon.com/sitemap.xml`을 제출한다. sitemap 제출은 검색 색인이나 순위를 보장하지 않는다. 새 도구를 공개할 때는 그 도구의 정적 설명·메타데이터·canonical을 작성하고 `apps/web/public/sitemap.xml`에 URL을 추가한다. 메인 페이지는 sitemap에 포함하지 않으며 기존 3D 작업방을 유지한다.

공식 안내: [Next.js 정적 배포](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/), [빌드 버전 설정](https://developers.cloudflare.com/pages/configuration/build-image/), [미리보기 검색 차단](https://developers.cloudflare.com/pages/configuration/preview-deployments/).

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

## 작업방 모델 작업 재개

편집 원본은 `assets/blender/workspace.blend`이며 내보낼 컬렉션은 `Workspace`다. 메시, 재질, Shape Key, 드라이버와 1~96프레임 애니메이션은 원본에서 이어서 편집한다. 기존 작업 환경은 Blender 5.2.3 LTS다. 원단 텍스처 3장, 광선과 자수 텍스처 각 1장을 함께 보관한다. `references/logo.png`는 로고 원본이다.

다른 사람이나 워크트리에서는 해당 커밋을 받은 뒤 `pnpm install --frozen-lockfile`로 의존성을 설치한다. Blender에서 그 체크아웃의 `.blend`를 열고, Blender MCP 연결과 열린 파일 경로를 확인한다. 기존 이름과 사용자 속성은 유지한다. 모델 수정은 저장만 하며, GLB 내보내기는 요청받았을 때만 수행한다.

내보내기는 Blender MCP에서 열린 원본을 기준으로 아래 Python을 실행한다. 스크립트는 원본을 먼저 저장하고, 임시 베이크와 Blender 기본 glTF 내보내기를 수행한 뒤 저장된 원본으로 복귀한다.

```python
from pathlib import Path
import bpy
script = Path(bpy.data.filepath).parent / 'scripts' / 'export_workspace.py'
exec(compile(script.read_text(), str(script), 'exec'))
```

이후 저장소 루트에서 다음을 실행한다.

```sh
pnpm --filter @work/web model:compress
pnpm --filter @work/web check
pnpm build
pnpm preview
```

웹은 `apps/web/public/models/workspace/scene.glb`를 사용한다. 로딩 화면은 최소 3초와 장면 준비 완료를 기다린 뒤 닫힌다. WebGL 오류는 이미지 없이 안내한다. `scene.raw.glb`와 발광 베이크 이미지 2장은 내보내기 중간 산출물이며 Git에서 제외한다. 삭제했더라도 다시 내보내면 생성된다. 압축만 먼저 실행하면 원시 GLB가 없어 실패한다.

표정과 주머니 변형은 GLB 애니메이션으로, 발광·조명 출력 타이밍은 GLB 사용자 데이터로 전달한다. 웹은 한 번 재생한 뒤 마지막 자세와 빛 효과를 유지한다. 면광원은 메타데이터로 복원하며 원형 광원은 사각형으로 근사한다. 카메라, 환경광과 bloom은 웹에서 처리하므로 Blender 화면과 완전히 동일하지 않다. 기본·충전·폭발·마지막 자세를 실제 브라우저에서 확인한다. 실제 모바일 기기의 FPS는 아직 측정하지 않았다.

작업 원칙은 `AGENTS.md`를 따른다.
