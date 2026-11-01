/** Blender의 프레임별 발광 샘플을 연속 재생 시간에 맞춰 읽는다. */
export function sampleEffects(
  frames: Record<string, number>[],
  fps: number,
  time: number
) {
  const cursor = Math.max(0, Math.min(time * fps, frames.length - 1));
  const index = Math.floor(cursor);
  const next = frames[Math.min(index + 1, frames.length - 1)];
  return Object.fromEntries(
    Object.entries(frames[index]).map(([name, value]) => [
      name,
      value + (next[name] - value) * (cursor - index),
    ])
  );
}
