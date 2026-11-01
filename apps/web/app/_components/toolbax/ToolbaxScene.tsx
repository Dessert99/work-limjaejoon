'use client';
import { Canvas } from '@react-three/fiber';
import { Suspense, type ReactNode } from 'react';
import Model from './Model';
import LightingAndCamera from './LightingAndCamera';
import Glow from './Glow';

type Props = {
  run: number;
  reduced: boolean;
  onReplay: () => void;
  onStatus: (status: string) => void;
  fallback: ReactNode;
};

/** 필요한 동안만 프레임을 그리는 독립적인 3D 미리보기다. */
export default function ToolbaxScene({ fallback, ...props }: Props) {
  return (
    <Canvas
      frameloop='demand'
      dpr={[1, 1.5]}
      camera={{ position: [-4.6, 4.1, 10], fov: 28 }}
      fallback={fallback}
      gl={{ antialias: true }}>
      <LightingAndCamera />
      <Suspense fallback={null}>
        <Model {...props} />
      </Suspense>
      <Glow />
    </Canvas>
  );
}
