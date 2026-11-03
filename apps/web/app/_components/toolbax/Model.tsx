'use client';
/* eslint-disable react-hooks/immutability -- Three.js 객체는 프레임마다 직접 갱신하는 렌더링 상태다. */
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  Mesh,
  Object3D,
  MeshStandardMaterial,
  RectAreaLight,
  SpotLight,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { playbackTime, sampleEffects } from '@/domains/toolbax/lib/playback';

import ToolLabels from './ToolLabels';
import type { PlaybackRange } from '@/domains/toolbax/model/scene';

type Props = {
  enabled: boolean;
  onReady: () => void;
  host: HTMLDivElement | null;
  run: number;
  reduced: boolean;
  onReplay: () => void;
  onStatus: (status: string) => void;
};

/** 자산의 애니메이션과 효과 데이터를 함께 재생한다. */
export default function Model({
  enabled,
  onReady,
  host,
  run,
  reduced,
  onReplay,
  onStatus,
}: Props) {
  const gltf = useLoader(GLTFLoader, '/models/toolbax/scene.glb', (loader) =>
    loader.setMeshoptDecoder(MeshoptDecoder)
  );
  const effects = useMemo(() => {
    const data = gltf.scene.getObjectByName('Backpack_Motion')!.userData
      .toolbax_effects as { fps: number; tracks: Record<string, number[]> };
    return {
      fps: data.fps,
      frames: Array.from({ length: data.tracks.light.length }, (_, index) =>
        Object.fromEntries(
          Object.entries(data.tracks).map(([name, values]) => [
            name,
            values[index],
          ])
        )
      ),
    };
  }, [gltf]);
  const range = gltf.scene.getObjectByName('Backpack_Motion')!.userData
    .toolbax_playback as PlaybackRange;
  const { invalidate } = useThree();

  const reportedReady = useRef(false);
  const playback = useRef({ elapsed: 0, playing: false });
  const animation = useMemo(() => {
    RectAreaLightUniformsLib.init();
    const sources: SpotLight[] = [];
    gltf.scene.traverse((object) => {
      if (object instanceof SpotLight && object.userData.toolbax_area_light)
        sources.push(object);
    });
    for (const source of sources) {
      const { width, height, power } = source.userData.toolbax_area_light;
      // GLB에 기록된 면적과 출력을 사용하며 원형 광원은 같은 면적의 사각형으로 근사한다.
      const area = new RectAreaLight(
        source.color,
        power / (Math.PI * width * height),
        width,
        height
      );
      area.name = source.name;
      area.position.copy(source.position);
      area.quaternion.copy(source.quaternion);
      area.scale.copy(source.scale);
      area.userData = { ...source.userData };
      source.parent?.add(area);
      source.removeFromParent();
    }
    const glow = gltf.scene.getObjectByName('Pocket_Glow_1');
    const mixer = new AnimationMixer(gltf.scene);
    const tracks = gltf.animations.flatMap((clip) =>
      clip.tracks.map((track) => track.clone())
    );
    const clip = new AnimationClip('Toolbax_Burst', -1, tracks);
    const action = mixer.clipAction(clip);
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    const arc = gltf.scene.getObjectByName('Energy_Arc_0') as Mesh;
    const arcMaterial = (arc.material as MeshStandardMaterial).clone();
    arc.material = arcMaterial;
    const arcStart = { value: 0 };
    const arcEnd = { value: 0 };
    // 전체 나선 메시의 UV를 원본 경로 진행률로 사용해 Blender의 그리기 효과를 복원한다.
    arcMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.arcStart = arcStart;
      shader.uniforms.arcEnd = arcEnd;
      shader.vertexShader =
        'varying float vArcProgress;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvArcProgress = uv.x;'
        );
      shader.fragmentShader =
        'varying float vArcProgress; uniform float arcStart; uniform float arcEnd;\n' +
        shader.fragmentShader.replace(
          '#include <clipping_planes_fragment>',
          '#include <clipping_planes_fragment>\nif (arcEnd <= arcStart || vArcProgress < arcStart || vArcProgress > arcEnd) discard;'
        );
    };
    const toolRoots: Object3D[] = [];
    gltf.scene.traverse((object) => {
      if (object.userData.source_asset) toolRoots.push(object);
    });
    toolRoots.sort((a, b) => a.userData.layout_slot - b.userData.layout_slot);
    const materials = new Set<MeshStandardMaterial>();
    gltf.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        if (material instanceof MeshStandardMaterial) materials.add(material);
      }
    });
    return { mixer, action, materials, glow, arcStart, arcEnd, toolRoots };
  }, [gltf]);

  const updateEffects = useMemo(
    () => (time: number) => {
      const values = sampleEffects(effects.frames, effects.fps, time);
      for (const material of animation.materials) {
        if (values[material.name] === undefined) continue;
        if (material.emissiveMap) material.emissive.setRGB(1, 1, 1);
        material.emissiveIntensity = values[material.name];
      }
      animation.arcStart.value = values.arcStart;
      animation.arcEnd.value = values.arcEnd;
      if (animation.glow instanceof RectAreaLight)
        animation.glow.intensity =
          // 원본 출력은 유지하되 면광원의 근거리 반사 차이는 비교 렌더 기준으로 보정한다.
          (values.light * 0.25) /
          (Math.PI * animation.glow.width * animation.glow.height);
    },
    [animation, effects]
  );

  useEffect(() => {
    animation.action.reset().play();
    const time = playbackTime(0, range, reduced);
    animation.mixer.setTime(time);
    playback.current = { elapsed: 0, playing: enabled && !reduced };
    updateEffects(time);
    if (enabled)
      onStatus(
        reduced ? '동작 줄이기 설정으로 마지막 장면을 표시합니다.' : '재생 중'
      );
    invalidate();
    return () => {
      animation.mixer.stopAllAction();
    };
  }, [
    animation,
    invalidate,
    onStatus,
    reduced,
    run,
    updateEffects,
    range,
    enabled,
  ]);

  useFrame((_, delta) => {
    if (!reportedReady.current) {
      reportedReady.current = true;
      onReady();
    }
    if (!playback.current.playing) return;
    // 탭을 다시 열 때 큰 시간 차이로 폭발 구간을 건너뛰지 않게 한다.
    const step = Math.min(delta, 0.1);
    const idleStart = (range.idleStart - 1) / range.fps;
    const previous = playback.current.elapsed;
    playback.current.elapsed += step;
    const time = playbackTime(playback.current.elapsed, range);
    animation.mixer.setTime(time);
    updateEffects(time);
    if (playback.current.elapsed >= idleStart) {
      if (previous < idleStart) onStatus('재생 중 · 대기 동작 반복');
    }
    invalidate();
  });

  return (
    <>
      <primitive
        object={gltf.scene}
        onClick={(event: { delta: number; object: Object3D }) => {
          let object: Object3D | null = event.object;
          while (object && object.name !== 'Backpack_Motion')
            object = object.parent;
          if (object && event.delta < 3 && !reduced && enabled) onReplay();
        }}
      />
      {host && (
        <ToolLabels
          host={host}
          tools={animation.toolRoots}
        />
      )}
    </>
  );
}
