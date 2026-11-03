/** Blender 자산에서 가져오는 카메라·환경 기준이다. */
export type SceneView = {
  position: [number, number, number];
  target: [number, number, number];
  aspect: number;
  fov: number;
  worldColor: [number, number, number];
  worldStrength: number;
  exposure: number;
};

/** 폭발 이후 반복할 원본 프레임 구간이다. */
export type PlaybackRange = { fps: number; idleStart: number; idleEnd: number };

/** GLB에서 직접 재생할 수 없는 Blender 효과의 프레임별 샘플이다. */
export type EffectSamples = { fps: number; tracks: Record<string, number[]> };
