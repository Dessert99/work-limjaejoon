'use client';
/* eslint-disable react-hooks/immutability -- 카메라와 렌더러는 Three.js의 변경 가능한 장면 상태다. */
import { useLoader, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
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
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { SceneView } from '@/domains/toolbax/model/scene';

/** 자산의 비교용 구도를 사용하고 좁은 화면에서는 장면 전체가 들어오도록 맞춘다. */
export default function LightingAndCamera() {
  const { camera, gl, scene, invalidate, size } = useThree();
  const gltf = useLoader(GLTFLoader, '/models/toolbax/scene.glb', (loader) =>
    loader.setMeshoptDecoder(MeshoptDecoder)
  );
  const view = gltf.scene.getObjectByName('Backpack_Motion')!.userData
    .toolbax_view as SceneView;
  const target = useMemo(() => {
    const point = new Vector3(...view.target);
    if (size.width < 600) {
      point.x += 0.5;
      point.y -= 0.65;
    }
    return point;
  }, [view, size.width]);
  useEffect(() => {
    camera.position.fromArray(view.position);
    camera.lookAt(target);
    if (camera instanceof PerspectiveCamera) {
      const fit = Math.max(1, view.aspect / (size.width / size.height));
      camera.fov =
        (2 * Math.atan(Math.tan((view.fov * Math.PI) / 360) * fit) * 180) /
        Math.PI;
      if (size.width < 600) camera.fov = Math.min(camera.fov, 66);
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [camera, invalidate, size, view, target]);
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.copy(target);
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI * 0.55;
    controls.update();
    const changed = () => invalidate();
    controls.addEventListener('change', changed);
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
      controls.dispose();
      scene.environment = null;
      environment.dispose();
      pmrem.dispose();
    };
  }, [camera, gl, invalidate, scene, view, target]);
  return null;
}
