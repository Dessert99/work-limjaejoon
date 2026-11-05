/** 원본 폭발 구간에 맞춰 카메라를 빠르게 후퇴시키고 마지막 구도를 유지한다. */
export function cameraProgress(
  time: number,
  fps: number,
  start: number,
  end: number
) {
  const progress = Math.max(
    0,
    Math.min(1, (time * fps + 1 - start) / (end - start))
  );
  return 1 - (1 - progress) ** 3;
}

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

/** 도입부는 한 번 재생하고 Blender가 지정한 대기 구간만 반복한다. */
export function playbackTime(
  elapsed: number,
  range: { fps: number; idleStart: number; idleEnd: number },
  reduced = false
) {
  const start = (range.idleStart - 1) / range.fps;
  const duration = (range.idleEnd - range.idleStart) / range.fps;
  if (reduced) return start;
  const time = Math.max(0, elapsed);
  return time < start ? time : start + ((time - start) % duration);
}
