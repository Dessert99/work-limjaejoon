# 웹 도구 작업 공간

pnpm workspace의 `apps/web`에 Next.js App Router, React, TypeScript를 구성한다. Node.js 22.13 이상과 pnpm 10.33.0을 사용한다.

현재 `/`는 Toolbax 3D 미리보기 페이지다. 이미지 변환용 임시 UI와 관련 UI 테스트는 제거했으며, `apps/web/domains/image-converter`에 브라우저 변환 로직과 Worker, ZIP 생성 및 Vitest 테스트를 유지한다. 화면에서 파일을 선택하거나 다운로드하는 기능은 현재 제공하지 않는다.

변환 로직은 JPG와 WebP에 Canvas, PNG에 OxiPNG 무손실 인코딩을 사용한다. 현재는 메타데이터를 제거하고, 용량이 증가해도 요청한 출력 형식을 유지한다. JPG의 투명 영역은 흰색으로 채우고, 움직이는 PNG와 WebP는 거부한다. 이 예외 정책은 최종 제품 동작을 확정한 것이 아니다.

변환 로직의 메모리 보호를 위한 임시 상한은 파일당 90MB, 이미지당 2,400만 픽셀, 긴 변 16,384px이다. 기존 UI에서 적용하던 30장·입력 합계 300MB 제한은 UI 제거와 함께 사라졌으며, 새 UI를 구현할 때 일괄 처리 상한을 정해야 한다. 최종 상한과 PC 및 모바일 성능은 실제 기기에서 추가 검증한다.

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

## Toolbax 모델 작업 재개

편집 원본은 `assets/blender/toolbax.blend`이며 내보낼 컬렉션은 `Toolbax`다. 메시, 재질, Shape Key, 드라이버와 1~96프레임 애니메이션은 원본에서 이어서 편집한다. 기존 작업 환경은 Blender 5.2.3 LTS다. 원단 텍스처 3장, 광선과 자수 텍스처 각 1장을 함께 보관한다. `references/logo.png`는 로고 원본이다.

다른 사람이나 워크트리에서는 해당 커밋을 받은 뒤 `pnpm install --frozen-lockfile`로 의존성을 설치한다. Blender에서 그 체크아웃의 `.blend`를 열고, Blender MCP 연결과 열린 파일 경로를 확인한다. 기존 이름과 사용자 속성은 유지한다. 모델 수정은 저장만 하며, GLB 내보내기는 요청받았을 때만 수행한다.

내보내기는 Blender MCP에서 열린 원본을 기준으로 아래 Python을 실행한다. 스크립트는 원본을 먼저 저장하고, 임시 베이크와 Blender 기본 glTF 내보내기를 수행한 뒤 저장된 원본으로 복귀한다.

```python
from pathlib import Path
import bpy
script = Path(bpy.data.filepath).parent / 'scripts' / 'export_toolbax.py'
exec(compile(script.read_text(), str(script), 'exec'))
```

이후 저장소 루트에서 다음을 실행한다.

```sh
pnpm --filter @work/web model:compress
pnpm --filter @work/web check
pnpm build
pnpm preview
```

웹은 `apps/web/public/models/toolbax/scene.glb`를 사용한다. `poster.png`는 로딩 및 WebGL 오류 시 대체 이미지다. `scene.raw.glb`와 발광 베이크 이미지 2장은 내보내기 중간 산출물이며 Git에서 제외한다. 삭제했더라도 다시 내보내면 생성된다. 압축만 먼저 실행하면 원시 GLB가 없어 실패한다.

표정과 주머니 변형은 GLB 애니메이션으로, 발광·조명 출력 타이밍은 GLB 사용자 데이터로 전달한다. 웹은 한 번 재생한 뒤 마지막 자세와 빛 효과를 유지한다. 면광원은 메타데이터로 복원하며 원형 광원은 사각형으로 근사한다. 카메라, 환경광과 bloom은 웹에서 처리하므로 Blender 화면과 완전히 동일하지 않다. 기본·충전·폭발·마지막 자세를 실제 브라우저에서 확인한다. 미리보기 실행 중 `PREVIEW_URL=http://127.0.0.1:4173 pnpm --filter @work/web test:3d`로 재생 동작을 검사할 수 있다. 실제 모바일 기기의 FPS는 아직 측정하지 않았다.

작업 원칙은 `AGENTS.md`를 따른다.
