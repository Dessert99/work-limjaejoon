import bpy
import json
import os
import math
import struct
import numpy as np
from mathutils import Vector

# 원본은 보존하고 임시 내보내기 상태만 베이크한 뒤 원본으로 복귀한다.
source = bpy.data.filepath
root = os.path.dirname(os.path.dirname(os.path.dirname(source)))
output = os.path.join(root, 'apps/web/public/models/workspace')
scene = bpy.data.scenes['Workspace_Moonlit_Room']
bpy.context.window.scene = scene
if bpy.context.screen.is_animation_playing:
    bpy.ops.screen.animation_cancel(restore_frame=False)
bpy.ops.wm.save_as_mainfile(filepath=source)
objects = [o for o in scene.objects if o.type != 'CAMERA' and not o.hide_render and not o.hide_viewport]
frames = range(scene.frame_start, scene.frame_end + 1)
samples = {o.name: [] for o in objects}
effects = []
asset = bpy.data.objects['Backpack_Motion']
arc = bpy.data.objects['Energy_Arc_0']
raw_path = os.path.join(os.path.dirname(source), 'scene.raw.glb')

def web_vector(vector):
    return [vector.x, vector.z, -vector.y]


def curves(action):
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                yield from bag.fcurves


try:
    materials = {m for o in objects if hasattr(o.data, 'materials') for m in o.data.materials if m}
    animated_materials = [m for m in materials if m.use_nodes and m.node_tree.animation_data]
    for frame in frames:
        scene.frame_set(frame)
        for o in objects:
            keys = o.data.shape_keys if o.type == 'MESH' else None
            samples[o.name].append({
                'location': list(o.location), 'rotation_euler': list(o.rotation_euler), 'scale': list(o.scale),
                'keys': {k.name: k.value for k in list(keys.key_blocks)[1:]} if keys else {},
            })
        values = {}
        for material in animated_materials:
            shader = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
            values[material.name] = shader.inputs['Emission Strength'].default_value
        values['light'] = bpy.data.objects['Pocket_Glow_1'].data.energy
        values['arcStart'] = arc.data.bevel_factor_start
        values['arcEnd'] = arc.data.bevel_factor_end
        effects.append(values)
    scene.frame_set(int(asset['idle_start_frame']))
    camera = scene.camera
    direction = camera.rotation_euler.to_matrix() @ Vector((0, 0, -1))
    target = camera.location + direction * ((2.25 - camera.location.z) / direction.z)
    background = next(n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND')
    asset['workspace_view'] = {
        'position': web_vector(camera.location), 'target': web_vector(target),
        'aspect': asset['camera_aspect'],
        'fov': math.degrees(2 * math.atan(camera.data.sensor_width / (2 * camera.data.lens * scene.render.resolution_x / scene.render.resolution_y))),
        'worldColor': list(background.inputs['Color'].default_value)[:3],
        'worldStrength': background.inputs['Strength'].default_value,
        'exposure': scene.view_settings.exposure,
        'introPosition': list(asset['camera_start_position']),
        'introTarget': list(asset['camera_start_target']),
        'moveStart': asset['camera_move_start_frame'],
        'moveEnd': asset['camera_move_end_frame'],
    }
    asset['workspace_view']['position'] = list(asset['camera_end_position'])
    asset['workspace_view']['target'] = list(asset['camera_end_target'])
    asset['workspace_view']['fov'] = asset['camera_fov']
    asset['workspace_playback'] = {'fps': scene.render.fps, 'idleStart': asset['idle_start_frame'], 'idleEnd': asset['idle_end_frame']}
    asset['workspace_effects'] = {'fps': scene.render.fps, 'tracks': {name: [f[name] for f in effects] for name in effects[0]}}
    # 면광원은 위치와 출력까지 자산에 기록해 웹에서 복원한다.
    for light in [o for o in objects if o.type == 'LIGHT']:
        data = light.data
        if data.type != 'AREA':
            continue
        width = data.size * math.sqrt(math.pi) / 2 if data.shape == 'DISK' else data.size
        height = width if data.shape in {'DISK', 'SQUARE'} else data.size_y
        light['workspace_area_light'] = {'width': width, 'height': height, 'power': data.energy, 'shape': data.shape, 'color': list(data.color)}
        proxy = bpy.data.lights.new(light.name + '_GLTF', 'SPOT')
        proxy.color = data.color
        proxy.energy = data.energy / math.pi
        proxy.spot_size = math.radians(100)
        light.data = proxy
    # 전체 나선의 UV에 경로 진행률을 기록해 길이가 변하는 Curve 기능을 웹에서 재현한다.
    arc.data.animation_data_clear()
    arc.data.bevel_factor_start = 0
    arc.data.bevel_factor_end = 1
    points = [Vector(p.co[:3]) for p in arc.data.splines[0].points]
    lengths = [0]
    for a, b in zip(points, points[1:]):
        lengths.append(lengths[-1] + (b - a).length)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(arc.evaluated_get(dg), depsgraph=dg)
    # 곡선의 자동 UV 대신 경로 진행률을 첫 UV로 내보낸다.
    while mesh.uv_layers:
        mesh.uv_layers.remove(mesh.uv_layers[0])
    uv = mesh.uv_layers.new(name='ArcProgress')
    progress = []
    for v in mesh.vertices:
        index = min(range(len(points)), key=lambda i: (v.co - points[i]).length_squared)
        progress.append(lengths[index] / lengths[-1])
    for loop in mesh.loops:
        uv.data[loop.index].uv = (progress[loop.vertex_index], 0.5)
    replacement = bpy.data.objects.new(arc.name + '_Export', mesh)
    replacement.parent = arc.parent
    replacement.matrix_local = arc.matrix_local.copy()
    replacement['workspace_arc'] = True
    for collection in arc.users_collection:
        collection.objects.link(replacement)
    name = arc.name
    bpy.data.objects.remove(arc, do_unlink=True)
    replacement.name = name
    objects = [o for o in scene.objects if o.type != 'CAMERA' and not o.hide_render and not o.hide_viewport]
    for o in objects:
        o.animation_data_clear()
        if o.type != 'MESH':
            continue
        keys = o.data.shape_keys
        names = [k.name for k in keys.key_blocks] if keys else []
        if keys:
            keys.animation_data_clear()
            for k in list(keys.key_blocks)[1:]:
                k.value = 0
        if not o.modifiers:
            continue
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        base = bpy.data.meshes.new_from_object(o.evaluated_get(dg), depsgraph=dg)
        coordinates = {}
        for key_name in names[1:]:
            keys.key_blocks[key_name].value = 1
            bpy.context.view_layer.update()
            evaluated = o.evaluated_get(dg)
            temp = evaluated.to_mesh()
            assert len(temp.vertices) == len(base.vertices), o.name
            coordinates[key_name] = [v.co.copy() for v in temp.vertices]
            evaluated.to_mesh_clear()
            keys.key_blocks[key_name].value = 0
        o.modifiers.clear()
        o.data = base
        if names:
            o.shape_key_add(name='Basis')
            for key_name in names[1:]:
                key = o.shape_key_add(name=key_name)
                for vertex, coordinate in zip(key.data, coordinates[key_name]):
                    vertex.co = coordinate
    for o in objects:
        track = samples[o.name]
        for prop in ['location', 'rotation_euler', 'scale']:
            # 정적인 속성에는 불필요한 애니메이션 키를 만들지 않는다.
            if all(sample[prop] == track[0][prop] for sample in track):
                setattr(o, prop, track[0][prop])
                continue
            for frame, sample in enumerate(track, 1):
                setattr(o, prop, sample[prop])
                o.keyframe_insert(data_path=prop, frame=frame)
        if o.type == 'MESH' and o.data.shape_keys:
            for frame, sample in enumerate(track, 1):
                for key_name, value in sample['keys'].items():
                    key = o.data.shape_keys.key_blocks[key_name]
                    key.value = value
                    key.keyframe_insert(data_path='value', frame=frame)
            for curve in curves(o.data.shape_keys.animation_data.action):
                for key in curve.keyframe_points:
                    key.interpolation = 'CONSTANT' if o.name.startswith('Eye_') else 'LINEAR'
    for name in ['가방 기본색', '로고 자수 실']:
        shader = next(n for n in bpy.data.materials[name].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        weight = shader.inputs['Sheen Weight'].default_value
        tint = shader.inputs['Sheen Tint'].default_value
        shader.inputs['Sheen Tint'].default_value = (*[c * weight for c in tint[:3]], 1)
        shader.inputs['Sheen Weight'].default_value = 1
    # 주머니의 절차적 발광 분포를 표준 glTF 텍스처로 변환한다.
    material = bpy.data.materials['입구 금빛']
    ramps = [n for n in material.node_tree.nodes if n.type == 'VALTORGB']
    horizontal = next(n for n in ramps if n.label == '크림 중심에서 황금빛 가장자리로')
    vertical = next(n for n in ramps if n.label == '깊이 방향 금빛 안감')
    pixels = np.ones((64, 512, 4), dtype=np.float32)
    for y in range(64):
        for x in range(512):
            pixels[y, x, :3] = np.array(horizontal.color_ramp.evaluate(x / 511)[:3]) * np.array(vertical.color_ramp.evaluate(y / 63)[:3])
    rgb = np.clip(pixels[:, :, :3], 0, 1)
    pixels[:, :, :3] = np.where(rgb <= .0031308, rgb * 12.92, 1.055 * rgb ** (1 / 2.4) - .055)
    image = bpy.data.images.new('pocket_emission_baked', width=512, height=64, alpha=True)
    image.colorspace_settings.name = 'Non-Color'
    image.pixels.foreach_set(pixels.ravel())
    image.filepath_raw = os.path.join(os.path.dirname(source), 'textures/pocket_emission_baked.png')
    image.file_format = 'PNG'
    image.save()
    image.pack()
    image.colorspace_settings.name = 'sRGB'
    node = material.node_tree.nodes.new('ShaderNodeTexImage')
    node.image = image
    shader = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    material.node_tree.links.new(node.outputs['Color'], shader.inputs['Emission Color'])
    for material in animated_materials:
        material.node_tree.animation_data_clear()
        shader = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        shader.inputs['Emission Strength'].default_value = effects[int(asset['camera_move_start_frame']) - 1][material.name]
    export_collection = bpy.data.collections['Workspace']
    for o in objects:
        if o.name not in export_collection.all_objects:
            export_collection.objects.link(o)
    scene.frame_start = 1
    scene.frame_end = frames.stop - 1
    scene.frame_set(int(asset['idle_start_frame']))
    bpy.ops.export_scene.gltf(
        filepath=raw_path, export_format='GLB', collection='Workspace', use_active_collection_with_nested=True,
        export_extras=True, export_cameras=False, export_lights=True, export_import_convert_lighting_mode='RAW',
        export_apply=False, export_animations=True, export_animation_mode='SCENE',
        export_frame_range=True, export_frame_step=1, export_force_sampling=True,
        export_morph=True, export_morph_animation=True, export_sampling_interpolation_fallback='LINEAR',
    )
    with open(raw_path, 'rb') as stream:
        raw = stream.read()
    length = struct.unpack_from('<I', raw, 12)[0]
    document = json.loads(raw[20:20 + length])
    for animation in document.get('animations', []):
        for channel in animation['channels']:
            target = channel['target']
            if target.get('path') == 'weights' and document['nodes'][target['node']].get('name', '').startswith('Eye_'):
                animation['samplers'][channel['sampler']]['interpolation'] = 'STEP'
    encoded = json.dumps(document, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    encoded += b' ' * ((-len(encoded)) % 4)
    tail = raw[20 + length:]
    with open(raw_path, 'wb') as stream:
        stream.write(struct.pack('<4sII', b'glTF', 2, 20 + len(encoded) + len(tail)))
        stream.write(struct.pack('<II', len(encoded), 0x4E4F534A))
        stream.write(encoded)
        stream.write(tail)
    print(f'방, 도구 6개, {len(frames)}프레임, 나선 경로 및 조명 메타데이터 내보내기 완료')
finally:
    bpy.ops.wm.open_mainfile(filepath=source)
