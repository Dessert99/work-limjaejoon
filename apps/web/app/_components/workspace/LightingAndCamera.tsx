'use client';
/* eslint-disable react-hooks/immutability -- 카메라와 렌더러는 Three.js의 변경 가능한 장면 상태다. */
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import {
  AgXToneMapping,
  Color,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { PlaybackRange, SceneView } from '@/domains/workspace/model/scene';
import { cameraProgress } from '@/domains/workspace/lib/playback';

/** 폭발 순간 자산의 최종 구도로 후퇴하고 사용자 입력 없이 구도를 유지한다. */
export default function LightingAndCamera({
  timeline,
}: {
  timeline: RefObject<number>;
}) {
  const { camera, gl, scene, invalidate, size } = useThree();
  const gltf = useLoader(GLTFLoader, '/models/workspace/scene.glb', (loader) =>
    loader.setMeshoptDecoder(MeshoptDecoder)
  );
  const asset = gltf.scene.getObjectByName('Backpack_Motion')!.userData;
  const view = asset.workspace_view as SceneView;
  const range = asset.workspace_playback as PlaybackRange;
  const target = useMemo(() => new Vector3(...view.target), [view]);
  const position = useMemo(() => new Vector3(...view.position), [view]);
  const focus = useMemo(() => new Vector3(), []);
  const previous = useRef(-1);
  useEffect(() => {
    previous.current = -1;
    if (camera instanceof PerspectiveCamera) {
      const fit = Math.max(1, view.aspect / (size.width / size.height));
      camera.fov =
        (2 * Math.atan(Math.tan((view.fov * Math.PI) / 360) * fit) * 180) /
        Math.PI;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [camera, invalidate, size, view, target]);
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const world = new Scene();
    world.background = new Color().fromArray(view.worldColor);
    const environment = pmrem.fromScene(world);
    scene.environment = environment.texture;
    scene.environmentIntensity = view.worldStrength;
    scene.background = world.background;
    gl.toneMapping = AgXToneMapping;
    gl.toneMappingExposure = 2 ** view.exposure;
    invalidate();
    return () => {
      scene.environment = null;
      environment.dispose();
      pmrem.dispose();
    };
  }, [gl, invalidate, scene, view]);
  useFrame(() => {
    const progress = cameraProgress(
      timeline.current,
      range.fps,
      view.moveStart,
      view.moveEnd
    );
    if (previous.current === progress) return;
    previous.current = progress;
    camera.position.fromArray(view.introPosition).lerp(position, progress);
    focus.fromArray(view.introTarget).lerp(target, progress);
    camera.lookAt(focus);
  });
  return null;
}
