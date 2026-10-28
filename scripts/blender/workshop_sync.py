bl_info = {
    "name": "작업실 웹 동기화",
    "author": "work-limjaejoon",
    "version": (1, 0, 0),
    "blender": (5, 0, 0),
    "category": "Import-Export",
}

import hashlib
import json
from pathlib import Path
import tempfile
import traceback

import bpy
from bpy.app.handlers import persistent


def project_root():
    """다른 Blender 파일을 저장할 때 프로젝트 산출물을 덮어쓰지 않는다."""
    source = Path(bpy.data.filepath)
    if source.name != "workshop.blend" or source.parent.parts[-2:] != ("assets", "blender"):
        raise RuntimeError("assets/blender/workshop.blend를 먼저 열어주세요.")
    root = source.parents[2]
    if not (root / "apps/web/package.json").is_file():
        raise RuntimeError("웹 프로젝트 경로를 찾을 수 없습니다.")
    return root


def export_scene():
    """완성된 GLB만 공개하고 내용 해시로 브라우저 캐시를 구분한다."""
    root = project_root()
    collection = bpy.data.collections.get("Workshop")
    if collection is None or not any(obj.type == "MESH" for obj in collection.all_objects):
        raise RuntimeError("Workshop 컬렉션에 내보낼 메시가 없습니다.")
    output = root / "apps/web/public/models/workshop"
    output.mkdir(parents=True, exist_ok=True)
    # 내보내는 중인 파일을 웹이 읽지 않도록 같은 파일시스템에서 교체한다.
    with tempfile.TemporaryDirectory(dir=output) as temporary:
        model = Path(temporary) / "scene.glb"
        result = bpy.ops.export_scene.gltf(
            filepath=str(model), export_format="GLB", collection="Workshop",
            export_apply=True, export_extras=True, export_animations=True,
            export_cameras=False, export_lights=False,
            export_draco_mesh_compression_enable=False,
        )
        if "FINISHED" not in result:
            raise RuntimeError("GLB 내보내기가 완료되지 않았습니다.")
        revision = hashlib.sha256(model.read_bytes()).hexdigest()
        manifest = Path(temporary) / "revision.json"
        manifest.write_text(json.dumps({"revision": revision}) + "\n", encoding="utf-8")
        model.replace(output / "scene.glb")
        manifest.replace(output / "revision.json")
    print(f"웹 반영 완료: {revision[:12]}")
    return revision


@persistent
def export_after_save(_):
    """대상 원본을 저장한 경우에만 웹 미리보기를 갱신한다."""
    try:
        project_root()
    except RuntimeError:
        return
    try:
        export_scene()
    except Exception:
        traceback.print_exc()


def register():
    """Blender 재시작 뒤에도 저장 시 자동 반영을 유지한다."""
    if export_after_save not in bpy.app.handlers.save_post:
        bpy.app.handlers.save_post.append(export_after_save)


def unregister():
    """애드온 해제 후에는 자동 내보내기를 중단한다."""
    if export_after_save in bpy.app.handlers.save_post:
        bpy.app.handlers.save_post.remove(export_after_save)
