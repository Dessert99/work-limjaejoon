"""Blender에서 실행해 프로젝트 동기화 애드온과 검증용 원본을 준비한다."""

from pathlib import Path
import shutil
import sys

import addon_utils
import bpy

root = Path(__file__).resolve().parents[2]
addon_directory = Path(bpy.utils.user_resource("SCRIPTS", path="addons", create=True))
shutil.copy2(root / "scripts/blender/workshop_sync.py", addon_directory / "workshop_sync.py")
sys.path.insert(0, str(addon_directory))
addon_utils.modules_refresh()
addon_utils.enable("workshop_sync", default_set=True, persistent=True)
bpy.ops.wm.save_userpref()

source = root / "assets/blender/workshop.blend"
if source.exists():
    # 재설정으로 기존 작업물을 초기화하지 않는다.
    bpy.ops.wm.open_mainfile(filepath=str(source))
else:
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    collection = bpy.data.collections.new("Workshop")
    bpy.context.scene.collection.children.link(collection)
    bpy.ops.mesh.primitive_cube_add()
    cube = bpy.context.object
    cube.name = "previewCube"
    for current in list(cube.users_collection):
        current.objects.unlink(cube)
    collection.objects.link(cube)
    material = bpy.data.materials.new("previewMaterial")
    material.diffuse_color = (0.12, 0.45, 0.65, 1)
    material.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value = material.diffuse_color
    cube.data.materials.append(material)
    source.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(source))

import workshop_sync

workshop_sync.register()
workshop_sync.export_scene()
if (addon_directory / "blender_mcp.py").exists():
    addon_utils.enable("blender_mcp", default_set=True, persistent=True)
    # 명시적으로 요청하지 않은 외부 서비스와 통계 전송은 켜지 않는다.
    bpy.context.preferences.addons["blender_mcp"].preferences.telemetry_consent = False
    bpy.ops.wm.save_userpref()
print(f"작업 원본 준비 완료: {source}")
