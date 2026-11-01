'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Vector2 } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** 재생 프레임에 맞춰 발광 후처리를 적용한다. */
export default function Glow() {
  const { gl, scene, camera, size } = useThree();
  const pipeline = useMemo(() => {
    const composer = new EffectComposer(gl);
    const render = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.22, 0.45, 3.0);
    const output = new OutputPass();
    composer.addPass(render);
    composer.addPass(bloom);
    composer.addPass(output);
    return { composer, bloom, output };
  }, [gl, scene, camera]);
  useEffect(() => {
    pipeline.composer.setSize(size.width, size.height);
  }, [pipeline, size]);
  useEffect(
    () => () => {
      pipeline.bloom.dispose();
      pipeline.output.dispose();
      pipeline.composer.dispose();
    },
    [pipeline]
  );
  // demand 모드이므로 재생이나 카메라 조작이 멈추면 후처리도 멈춘다.
  useFrame(() => pipeline.composer.render(), 1);
  return null;
}
