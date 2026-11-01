'use client';
/* eslint-disable react-hooks/immutability -- Three.js 객체는 프레임마다 직접 갱신하는 렌더링 상태다. */
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AnimationClip,
  AnimationMixer,
  LoopOnce,
  Mesh,
  MeshStandardMaterial,
  RectAreaLight,
  SpotLight,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { sampleEffects } from '@/domains/toolbax/lib/playback';

type Props = {
  run: number;
  reduced: boolean;
  onReplay: () => void;
  onStatus: (status: string) => void;
};

/** 자산의 애니메이션과 효과 데이터를 함께 재생한다. */
export default function Model({ run, reduced, onReplay, onStatus }: Props) {
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
  const { invalidate } = useThree();

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
    const materials = new Set<MeshStandardMaterial>();
    gltf.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material]) {
        if (material instanceof MeshStandardMaterial) materials.add(material);
      }
    });
    return { mixer, action, duration: clip.duration, materials, glow };
  }, [gltf]);

  const updateEffects = useMemo(
    () => (time: number) => {
      const values = sampleEffects(effects.frames, effects.fps, time);
      for (const material of animation.materials) {
        if (values[material.name] === undefined) continue;
        if (material.emissiveMap) material.emissive.setRGB(1, 1, 1);
        material.emissiveIntensity = values[material.name];
      }
      if (animation.glow instanceof RectAreaLight)
        animation.glow.intensity =
          // Blender와 웹 면광원의 근거리 반사 차이를 보정한다.
          (values.light * 0.25) /
          (Math.PI * animation.glow.width * animation.glow.height);
    },
    [animation, effects]
  );

  useEffect(() => {
    animation.action.reset().play();
    animation.mixer.setTime(reduced ? animation.duration : 0);
    playback.current = {
      elapsed: reduced ? animation.duration : 0,
      playing: !reduced,
    };
    updateEffects(playback.current.elapsed);
    onStatus(
      reduced ? '동작 줄이기 설정으로 마지막 장면을 표시합니다.' : '재생 중'
    );
    invalidate();
    return () => {
      animation.mixer.stopAllAction();
    };
  }, [animation, invalidate, onStatus, reduced, run, updateEffects]);

  useFrame((_, delta) => {
    if (!playback.current.playing) return;
    // 탭을 다시 열 때 큰 시간 차이로 폭발 구간을 건너뛰지 않게 한다.
    const step = Math.min(delta, 0.1);
    playback.current.elapsed = Math.min(
      playback.current.elapsed + step,
      animation.duration
    );
    animation.mixer.update(step);
    updateEffects(playback.current.elapsed);
    if (playback.current.elapsed >= animation.duration) {
      playback.current.playing = false;
      onStatus('재생 완료 · 마지막 자세를 유지하고 있습니다.');
    } else {
      invalidate();
    }
  });

  return (
    <>
      <primitive
        object={gltf.scene}
        onClick={(event: { delta: number }) => {
          if (event.delta < 3 && !reduced) onReplay();
        }}
      />
    </>
  );
}
