import bpy
import json
import os
import math
import struct
import numpy as np

# 원본을 저장한 뒤 내보내기용 베이크를 수행하고 저장된 원본으로 복귀한다.
source = bpy.data.filepath
root = os.path.dirname(os.path.dirname(os.path.dirname(source)))
output = os.path.join(root, 'apps/web/public/models/toolbax')
os.makedirs(output, exist_ok=True)
scene = bpy.context.scene
if bpy.context.screen.is_animation_playing:
    bpy.ops.screen.animation_cancel(restore_frame=False)
bpy.ops.wm.save_as_mainfile(filepath=source)
objects = list(bpy.data.collections['Toolbax'].all_objects)
samples = {o.name: [] for o in objects}
effects = []
try:
    # 사용자가 조명 포함을 요청했으므로 미리보기 조명도 내보내기 컬렉션에 연결한다.
    for name in ['Preview_Key', 'Preview_Rim', 'Pocket_Glow_1']:
        light = bpy.data.objects[name]
        if light.name not in bpy.data.collections['Toolbax'].objects:
            bpy.data.collections['Toolbax'].objects.link(light)
    for frame in range(1, 97):
        scene.frame_set(frame)
        for o in objects:
            keys = o.data.shape_keys if o.type == 'MESH' else None
            samples[o.name].append({
                'location': list(o.location), 'rotation': list(o.rotation_euler),
                'scale': list(o.scale),
                'keys': {k.name: k.value for k in list(keys.key_blocks)[1:]} if keys else {},
            })
        values = {}
        for name in ['입구 금빛', '부드러운 금빛 광선', '금빛 반짝임']:
            material = bpy.data.materials[name]
            shader = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
            values[name] = shader.inputs['Emission Strength'].default_value
        values['light'] = bpy.data.objects['Pocket_Glow_1'].data.energy
        effects.append(values)
    scene.frame_set(1)
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
        for name in names[1:]:
            keys.key_blocks[name].value = 1
            bpy.context.view_layer.update()
            evaluated = o.evaluated_get(dg)
            mesh = evaluated.to_mesh()
            assert len(mesh.vertices) == len(base.vertices), o.name
            coordinates[name] = [v.co.copy() for v in mesh.vertices]
            evaluated.to_mesh_clear()
            keys.key_blocks[name].value = 0
        o.modifiers.clear()
        o.data = base
        if names:
            o.shape_key_add(name='Basis')
            for name in names[1:]:
                key = o.shape_key_add(name=name)
                for vertex, coordinate in zip(key.data, coordinates[name]):
                    vertex.co = coordinate
    for o in objects:
        for frame, sample in enumerate(samples[o.name], 1):
            for prop in ['location', 'rotation_euler', 'scale']:
                okey = 'rotation' if prop == 'rotation_euler' else prop
                setattr(o, prop, sample[okey])
                o.keyframe_insert(data_path=prop, frame=frame)
            if o.type == 'MESH' and o.data.shape_keys:
                for name, value in sample['keys'].items():
                    key = o.data.shape_keys.key_blocks[name]
                    key.value = value
                    key.keyframe_insert(data_path='value', frame=frame)
        # 표정 전환은 보간 중 찌그러지지 않도록 프레임 경계에서 바꾼다.
        if o.type == 'MESH' and o.data.shape_keys:
            action = o.data.shape_keys.animation_data.action
            for layer in action.layers:
                for strip in layer.strips:
                    for bag in strip.channelbags:
                        for curve in bag.fcurves:
                            for key in curve.keyframe_points:
                                key.interpolation = 'CONSTANT' if o.name.startswith('Eye_') else 'LINEAR'
    # glTF의 sheen은 별도 가중치가 없어 색상에 Blender 강도를 반영한다.
    for name in ['가방 기본색', '로고 자수 실']:
        shader = next(n for n in bpy.data.materials[name].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        weight = shader.inputs['Sheen Weight'].default_value
        tint = shader.inputs['Sheen Tint'].default_value
        shader.inputs['Sheen Tint'].default_value = (*[c * weight for c in tint[:3]], 1)
        shader.inputs['Sheen Weight'].default_value = 1
    # 비호환 절차 재질만 텍스처로 베이크해 GLB에서도 같은 분포를 사용한다.
    def emission_image(material, name, pixels):
        height, width, _ = pixels.shape
        image = bpy.data.images.new(name, width=width, height=height, alpha=True)
        image.colorspace_settings.name = 'Non-Color'
        # glTF 발광 텍스처는 sRGB로 해석되므로 저장할 때 선형 값을 변환한다.
        rgb = np.clip(pixels[:, :, :3], 0, 1)
        pixels[:, :, :3] = np.where(rgb <= .0031308, rgb * 12.92, 1.055 * rgb ** (1 / 2.4) - .055)
        image.pixels.foreach_set(pixels.astype(np.float32).ravel())
        image.filepath_raw = os.path.join(os.path.dirname(source), 'textures', name + '.png')
        image.file_format = 'PNG'
        image.save()
        image.pack()
        image.colorspace_settings.name = 'sRGB'
        node = material.node_tree.nodes.new('ShaderNodeTexImage')
        node.image = image
        shader = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        material.node_tree.links.new(node.outputs['Color'], shader.inputs['Emission Color'])

    material = bpy.data.materials['입구 금빛']
    ramps = [n for n in material.node_tree.nodes if n.type == 'VALTORGB']
    horizontal = next(n for n in ramps if n.label == '크림 중심에서 황금빛 가장자리로')
    vertical = next(n for n in ramps if n.label == '깊이 방향 금빛 안감')
    pixels = np.ones((64, 512, 4), dtype=np.float32)
    for y in range(64):
        for x in range(512):
            pixels[y, x, :3] = np.array(horizontal.color_ramp.evaluate(x / 511)[:3]) * np.array(vertical.color_ramp.evaluate(y / 63)[:3])
    emission_image(material, 'pocket_emission_baked', pixels)
    material = bpy.data.materials['부드러운 금빛 광선']
    source_image = next(n.image for n in material.node_tree.nodes if n.type == 'TEX_IMAGE')
    width, height = source_image.size
    pixels = np.array(source_image.pixels[:], dtype=np.float32).reshape(height, width, 4)
    pixels[:, :, :3] *= pixels[:, :, 3:4] ** 2.5
    emission_image(material, 'beam_emission_baked', pixels)
    scene.frame_set(78)
    for name in ['입구 금빛', '부드러운 금빛 광선', '금빛 반짝임']:
        material = bpy.data.materials[name]
        material.node_tree.animation_data_clear()
        shader = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        shader.inputs['Emission Strength'].default_value = effects[77][name]
    # 면광원의 정보를 GLB에 기록하고 표준 spot 조명으로도 사용할 수 있게 전달한다.
    for name in ['Preview_Key', 'Preview_Rim', 'Pocket_Glow_1']:
        light = bpy.data.objects[name]
        data = light.data
        if data.type == 'AREA':
            width = data.size * math.sqrt(math.pi) / 2 if data.shape == 'DISK' else data.size
            height = width if data.shape in {'DISK', 'SQUARE'} else data.size_y
            light['toolbax_area_light'] = {'width': width, 'height': height, 'power': data.energy, 'shape': data.shape, 'color': list(data.color)}
            proxy = bpy.data.lights.new(name + '_GLTF', 'SPOT')
            proxy.color = data.color
            proxy.energy = data.energy / math.pi
            proxy.spot_size = math.radians(100)
            proxy.spot_blend = .75
            light.data = proxy
    asset = bpy.data.objects['Backpack_Motion']
    asset['toolbax_effects'] = {'fps': scene.render.fps, 'tracks': {name: [frame[name] for frame in effects] for name in effects[0]}}
    asset['toolbax_postprocessing'] = {'type': 'Fog Glow', 'threshold': 1.5, 'strength': 1.1, 'size': .75, 'view_transform': scene.view_settings.view_transform, 'exposure': scene.view_settings.exposure}
    scene.frame_start = 1
    scene.frame_end = 96
    scene.frame_set(78)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(os.path.dirname(source), 'scene.raw.glb'), export_format='GLB',
        collection='Toolbax', use_active_collection_with_nested=True,
        export_extras=True, export_cameras=False, export_lights=True, export_import_convert_lighting_mode='RAW',
        export_apply=False, export_animations=True, export_animation_mode='SCENE',
        export_frame_range=True, export_frame_step=1, export_force_sampling=True,
        export_morph=True, export_morph_animation=True,
        export_sampling_interpolation_fallback='LINEAR',
    )
    # 내보내기 샘플러의 순간 표정 전환을 자산 자체에 명시한다.
    raw_path = os.path.join(os.path.dirname(source), 'scene.raw.glb')
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
    print('GLB 및 발광 타이밍 내보내기 완료')
finally:
    bpy.ops.wm.open_mainfile(filepath=source)
