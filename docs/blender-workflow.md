# Codex와 Blender 웹 작업

현재 프론트엔드 초기화로 `/dev/scene/`과 웹 테스트는 제거된 상태다. 아래 웹 미리보기와 웹 테스트 절차는 화면을 다시 구현한 뒤 사용할 수 있다. Blender 원본과 내보내기 스크립트는 유지한다.

## 시작

```sh
pnpm dev
```

브라우저에서 <http://localhost:3000/dev/scene/>를 연다. 다른 터미널에서 다음 명령으로 원본을 연다.

```sh
pnpm scene:open
```

Codex를 재시작해 `blender` MCP와 프로젝트 스킬을 읽게 한다. 다음처럼 요청한다.

```text
$blender-web-workflow로 previewCube의 재질을 주황색으로 바꾸고 저장한 뒤 웹에서 확인해줘.
```

Blender에서 직접 수정하고 저장해도 자동으로 반영된다. 개발 서버는 1초마다 새 해시를 확인한다. 실제 반영 시간에는 GLB 내보내기와 브라우저 로딩 시간이 더해진다. 매 프레임 동기화는 아니다.

## 파일과 명령

| 위치 또는 명령 | 역할 |
|---|---|
| `assets/blender/workshop.blend` | 수정 가능한 원본 |
| `Workshop` 컬렉션 | 내보낼 사물과 하위 컬렉션 |
| `apps/web/public/models/workshop/scene.glb` | 웹 모델 |
| `apps/web/public/models/workshop/revision.json` | 모델 내용의 SHA-256 해시 |
| `scripts/blender/workshop_sync.py` | 저장 후 자동 내보내기 애드온 |
| `pnpm scene:setup` | 애드온 설치와 검증용 큐브 준비, 기존 원본은 유지 |
| `pnpm scene:open` | 작업 원본 열기 |
| `pnpm scene:export` | 디스크에 저장된 원본에서 GLB 다시 생성 |

`scene:export`는 별도 Blender 프로세스로 실행하므로 GUI의 저장되지 않은 수정은 포함하지 않는다. Codex의 MCP 작업 중에는 열린 Blender에서 저장하거나 `import workshop_sync; workshop_sync.export_scene()`을 실행한다.

원본과 GLB를 함께 Git으로 관리한다. Blender 백업인 `.blend1`, `.blend2`는 제외한다. 모델이 커지면 실제 파일 크기를 확인하고 Git LFS 도입을 결정한다.

## 새 Mac에서 최초 설정

Homebrew가 설치되어 있다는 전제다. 다른 운영체제는 Blender와 uv를 각 운영체제의 설치 방법으로 준비한다.

```sh
brew install uv
brew install --cask blender
pnpm install
uv tool install mcp-for-blender==2.2.4
mcp-for-blender install-addon
pnpm scene:setup
codex mcp add blender -- "$(command -v mcp-for-blender)"
codex mcp list
```

Blender를 처음 설치한 직후에는 MCP 설치 도구가 사용자 애드온 경로를 찾지 못할 수 있다. 이 경우 `pnpm scene:setup`을 먼저 실행하고, Blender Python 콘솔에서 `bpy.utils.user_resource("SCRIPTS", path="addons", create=True)`로 확인한 경로를 지정한다. 이 환경은 Blender 5.2를 사용한다.

```sh
BLENDERMCP_ADDONS_DIR="$HOME/Library/Application Support/Blender/5.2/scripts/addons" mcp-for-blender install-addon
pnpm scene:setup
```

MCP 프로그램은 사용자 환경에 설치하며 Codex 등록도 사용자 설정에 추가한다. 등록에는 실행 파일의 절대 경로를 사용해 GUI 앱의 PATH 차이를 피한다. 기존 MCP 설정을 교체하지 않는다. 다른 버전으로 갱신할 때는 서버와 애드온을 함께 확인한다.

`scene:setup`은 저장 동기화 애드온을 사용자 Blender 애드온 폴더에 복사하고 활성화한다. MCP 애드온이 설치되어 있으면 함께 활성화하며 통계 전송은 끈다. 재실행 후 이미 켜진 Blender는 다시 열어야 수정된 애드온을 읽는다. Blender 버전을 올린 경우에도 설치를 다시 실행한다.

Blender 실행 파일 경로가 기본 경로와 다르면 `BLENDER_BIN`을 지정한다.

```sh
BLENDER_BIN=/사용할/Blender/실행파일 pnpm scene:setup
```

## 미리보기 기준

- 웹에서 카메라와 기본 조명을 설정한다. Blender 카메라와 조명은 현재 내보내지 않는다.
- GLB 호환 재질을 사용한다. Cycles 전용 노드 효과와 Blender 화면을 그대로 재현하지는 않는다.
- 노드 기반 재질의 실제 색은 Principled BSDF의 Base Color를 수정한다. `diffuse_color`만 바꾸면 뷰포트 표시색만 달라질 수 있다.
- 새 모델은 로딩에 성공한 뒤 교체한다. 실패하면 기존 모델과 카메라를 유지하고 오류를 표시한다.
- 큰 장면으로 바꾸면 `전체 보기` 버튼으로 카메라를 다시 맞춘다.
- 개발 모드에서만 자동 갱신한다. `pnpm build` 이후 정적 페이지는 `모델 다시 불러오기` 버튼으로 확인한다.
- `/dev/scene/`은 검색 제외 메타데이터를 가진 공개 정적 경로다. 접근 제한 페이지가 아니므로 비공개 에셋을 넣지 않는다.
- 메인 화면 변경, 실제 도구 연결과 최종 아트 디렉션은 이 준비 작업에 포함하지 않는다.

## 복구

- MCP가 없으면 `codex mcp list`로 확인하고 Codex를 재시작한다. 현재 대화에 도구가 추가되지 않으면 새 대화를 연다.
- 연결이 안 되면 Blender의 3D 뷰에서 `N`을 누르고 `MCP for Blender` 탭의 서버 상태를 확인한다. 로컬 포트 9876을 사용하며 Blender 서버를 여러 개 열지 않는다.
- 저장해도 갱신되지 않으면 작업 파일 이름과 컬렉션을 확인하고 Blender Python 콘솔에서 `import workshop_sync; workshop_sync.export_scene()`으로 오류를 확인한다.
- 애드온을 수정한 뒤에는 `pnpm scene:setup`을 다시 실행하고 Blender를 다시 연다.
- 자동 내보내기는 `assets/blender/workshop.blend`에서만 작동한다. 원본 위치를 옮기면 경로 규칙도 함께 수정한다.

## 검증

```sh
blender --background --factory-startup --python-exit-code 1 --python scripts/blender/test_workflow.py
pnpm typecheck
pnpm lint
pnpm build
pnpm test
```

Blender 검증은 임시 프로젝트에서 저장 후 자동 내보내기, 컬렉션 범위, 해시, 실패 시 이전 파일 보존을 검사한다. 웹 검증은 로딩, 갱신, 실패 후 복구를 검사한다. 실제 외관과 성능은 브라우저에서도 확인한다.

근거: [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [MCP for Blender](https://github.com/ahujasid/mcp-for-blender), [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html).
