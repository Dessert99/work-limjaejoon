'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import Model from './animation/Model';
import LightingAndCamera from './LightingAndCamera';
import Glow from './animation/Glow';

type Props = {
  enabled: boolean;
  onReady: () => void;
  host: HTMLDivElement | null;
  reduced: boolean;
  onStatus: (status: string) => void;
};

/** 필요한 동안만 프레임을 그리는 독립적인 3D 미리보기다. */
export default function ToolbaxScene(props: Props) {
  // Canvas의 fallback은 항상 마운트되므로 오류 처리는 상위 SceneBoundary에 맡긴다.
  return (
    <Canvas
      frameloop='demand'
      dpr={[1, 1.5]}
      camera={{ position: [-4.6, 4.1, 10], fov: 28 }}
      gl={{ antialias: true }}>
      <Suspense fallback={null}>
        <LightingAndCamera />
        <Model {...props} />
      </Suspense>
      <Glow />
    </Canvas>
  );
}
