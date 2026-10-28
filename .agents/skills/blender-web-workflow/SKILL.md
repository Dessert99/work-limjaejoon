---
name: blender-web-workflow
description: 이 프로젝트에서 Codex로 Blender 장면을 수정하고 GLB를 내보내 웹 미리보기에 반영한다. Blender 모델링, 재질 수정, 저장 동기화와 웹 3D 확인 작업에 사용한다.
---

# Blender 웹 작업

- 최초 설정과 복구가 필요하면 저장소의 `docs/blender-workflow.md`를 읽는다.
- 원본은 `assets/blender/workshop.blend`, 내보낼 컬렉션은 `Workshop`이다. 웹 산출물은 `apps/web/public/models/workshop/scene.glb`와 `revision.json`이다.
- 웹은 `pnpm dev`, 미리보기는 `http://localhost:3000/dev/scene/`, Blender는 `pnpm scene:open`으로 연다.
- 활성 세션에 `blender` MCP 도구가 있는지 확인한다. 등록 직후 도구가 보이지 않으면 Codex 재시작이 필요하다고 알린다. 연결했다고 추정하지 않는다.

## 수정과 확인

1. MCP로 현재 열린 파일과 장면을 확인한다. 다른 파일이 열려 있으면 저장하지 않은 작업을 덮어쓰지 말고 작업 원본으로 전환할 수 있는지 확인한다.
2. 요청 범위의 모델, 재질, 배치를 수정한다. `Workshop` 컬렉션 안에 배치하며 도구 연결에 쓰는 기존 사물 이름과 사용자 속성을 보존한다.
3. MCP의 Python 실행 도구로 아래 코드를 실행한다. 저장 시 애드온이 자동으로 GLB를 내보낸다.

```python
import bpy
import workshop_sync
workshop_sync.project_root()
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
```

4. 저장 로그에 내보내기 성공이 없으면 `workshop_sync.export_scene()`을 명시적으로 실행해 오류를 확인한다. MCP 수정이 진행 중일 때 `pnpm scene:export`를 사용하지 않는다. 이 명령은 디스크에 저장된 원본을 별도 Blender 프로세스로 읽는다.
5. 브라우저에서 새 해시의 `반영 완료` 표시와 실제 장면을 확인한다. 상태 메시지만으로 재질과 외관이 올바르다고 판단하지 않는다. 브라우저 도구가 없으면 그 제한을 보고한다.
6. 변경 내용, 저장 여부, 웹 확인 결과를 한국어로 보고한다. 실패한 작업을 완료했다고 보고하지 않는다.

## 실제 제약

- 갱신은 저장 또는 명시적 내보내기가 끝난 뒤 이루어진다. 매 프레임 편집 동기화가 아니다.
- 개발 서버에서만 1초 간격으로 변경 정보를 확인한다. 정적 빌드에서는 수동 갱신 버튼을 사용한다.
- 웹 미리보기의 카메라와 조명은 웹 코드가 관리한다. Blender 카메라와 조명은 내보내지 않는다. 시점은 모델 교체 후에도 유지하며 필요하면 전체 보기 버튼으로 맞춘다.
- 현재 내보내기는 일반 GLB와 glTF 호환 재질을 사용한다. Draco, KTX2와 전용 노드 효과는 별도 구현 없이 도입하지 않는다.
- 노드 기반 재질은 Principled BSDF의 Base Color 등을 수정한다. `material.diffuse_color`만 바꾸면 GLB 재질에 반영되지 않을 수 있다.
- 외부 에셋 다운로드, 유료 생성 서비스와 통계 전송은 이 작업의 필수 과정이 아니다. 필요할 때 사용자 요청과 라이선스를 확인한다.
