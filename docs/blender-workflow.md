# Blender MCP 작업 안내

작업 원칙과 파일 경로는 루트 `AGENTS.md`를 따른다. Blender에서 `assets/blender/workshop.blend`를 직접 열고 Codex의 `blender` MCP로 조작한다. 원본 저장과 GLB 내보내기는 별도 작업이다.

## 설치와 연결

Blender와 uv를 설치한 뒤 MCP 서버와 애드온을 설치한다. 기존 사용자 MCP 설정은 유지한다.

```sh
uv tool install mcp-for-blender==2.2.4
mcp-for-blender install-addon
codex mcp add blender -- "$(command -v mcp-for-blender)"
codex mcp list
```

애드온 설치 도구가 경로를 찾지 못하면 Blender Python 콘솔에서 `bpy.utils.user_resource("SCRIPTS", path="addons", create=True)`로 경로를 확인하고 `BLENDERMCP_ADDONS_DIR` 환경 변수로 지정한다.

Blender 환경 설정에서 Blender MCP 애드온을 활성화한다. 통계 전송은 끄고, 요청하지 않은 외부 에셋 서비스나 유료 생성 서비스는 활성화하지 않는다.

## 연결 복구

- Codex에 MCP 도구가 없으면 `codex mcp list`로 등록을 확인하고 Codex를 재시작한다. 필요하면 새 대화를 연다.
- Blender의 3D 뷰에서 `N`을 누르고 `MCP for Blender` 탭의 서버 상태를 확인한다. 연결이 끊겨 있으면 연결 버튼을 누른다.
- 기본 로컬 포트는 9876이다. 같은 포트에서 Blender 서버를 여러 개 실행하지 않는다.
- MCP 서버나 애드온 버전을 바꾸면 양쪽 호환성을 확인한다.

현재 웹 미리보기와 프로젝트 전용 내보내기 애드온은 사용하지 않는다. GLB는 MCP 또는 Blender 기본 내보내기로 필요할 때 생성한다.
