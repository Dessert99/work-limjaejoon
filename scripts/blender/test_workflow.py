"""임시 프로젝트에서 저장 동기화와 실패 시 기존 파일 보존을 검증한다."""

import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import tempfile

import bpy

spec = importlib.util.spec_from_file_location("tested_workshop_sync", Path(__file__).with_name("workshop_sync.py"))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

with tempfile.TemporaryDirectory() as temporary:
    root = Path(temporary)
    (root / "apps/web").mkdir(parents=True)
    (root / "apps/web/package.json").write_text("{}")
    (root / "assets/blender").mkdir(parents=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    collection = bpy.data.collections.new("Workshop")
    bpy.context.scene.collection.children.link(collection)
    bpy.ops.mesh.primitive_cube_add()
    cube = bpy.context.object
    cube.name = "includedCube"
    for current in list(cube.users_collection):
        current.objects.unlink(cube)
    collection.objects.link(cube)
    bpy.ops.mesh.primitive_cube_add(location=(10, 0, 0))
    bpy.context.object.name = "excludedCube"
    sync.register()
    sync.register()
    assert bpy.app.handlers.save_post.count(sync.export_after_save) == 1
    bpy.ops.wm.save_as_mainfile(filepath=str(root / "assets/blender/workshop.blend"))
    output = root / "apps/web/public/models/workshop"
    original = (output / "scene.glb").read_bytes()
    manifest = json.loads((output / "revision.json").read_text())
    assert manifest["revision"] == hashlib.sha256(original).hexdigest()
    magic, version, length = struct.unpack_from("<III", original)
    assert magic == 0x46546C67 and version == 2 and length == len(original)
    json_length = struct.unpack_from("<I", original, 12)[0]
    content = json.loads(original[20:20 + json_length])
    names = [node.get("name") for node in content["nodes"]]
    assert "includedCube" in names and "excludedCube" not in names
    cube.location.x = 2
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
    changed = (output / "scene.glb").read_bytes()
    assert original != changed
    collection.name = "Missing"
    try:
        sync.export_scene()
        raise AssertionError("빈 내보내기를 거절하지 않았습니다.")
    except RuntimeError:
        pass
    assert (output / "scene.glb").read_bytes() == changed
    sync.unregister()
    assert sync.export_after_save not in bpy.app.handlers.save_post

print("저장 자동 반영, 컬렉션 제한, 해시, 실패 시 파일 보존 검증 통과")
