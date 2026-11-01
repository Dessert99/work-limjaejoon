'use client';
/* eslint-disable react-hooks/immutability -- Three.js 장면과 카메라는 직접 갱신하는 렌더링 상태다. */
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { PMREMGenerator } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { colors } from '@/lib/styles/tokens';

/** 화면 크기에 맞춘 카메라와 미리보기 환경을 유지한다. */
export default function LightingAndCamera() {
  const { camera, gl, scene, invalidate, size } = useThree();
  useEffect(() => {
    const distance = size.width < 600 ? 14 : 10;
    camera.position.set(-distance * 0.46, 4.1, distance);
    camera.lookAt(0, 1.9, 0);
    invalidate();
  }, [camera, invalidate, size.width]);
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.set(0, 1.9, 0);
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 15;
    controls.update();
    controls.addEventListener('change', () => invalidate());
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.15;
    invalidate();
    return () => {
      controls.dispose();
      scene.environment = null;
      environment.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [camera, gl, invalidate, scene]);
  return (
    <>
      <color
        attach='background'
        args={[colors.background]}
      />
    </>
  );
}
