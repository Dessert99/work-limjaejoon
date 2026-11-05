import { describe, expect, it } from 'vitest';
import { cameraProgress, playbackTime, sampleEffects } from './playback';

it('카메라는 폭발까지 기다리고 빠르게 후퇴한 뒤 대기 반복 중에도 최종 구도를 유지한다', () => {
  const start = 39;
  const end = 44;
  expect(cameraProgress(0, 24, start, end)).toBe(0);
  expect(cameraProgress((start - 1) / 24, 24, start, end)).toBe(0);
  expect(
    cameraProgress(((start + end) / 2 - 1) / 24, 24, start, end)
  ).toBeCloseTo(0.875);
  expect(cameraProgress((end - 1) / 24, 24, start, end)).toBe(1);
  expect(
    cameraProgress(
      playbackTime(100, { fps: 24, idleStart: 49, idleEnd: 241 }),
      24,
      start,
      end
    )
  ).toBe(1);
});

describe('발광 타이밍', () => {
  const frames = [{ light: 0 }, { light: 100 }, { light: 3 }];
  it('프레임 사이를 보간하고 마지막 잔광을 유지한다', () => {
    expect(sampleEffects(frames, 24, 0.5 / 24).light).toBe(50);
    expect(sampleEffects(frames, 24, 99).light).toBe(3);
    expect(sampleEffects(frames, 24, -1).light).toBe(0);
  });
});

it('도입부 다음에는 대기 구간만 반복하고 동작 줄이기는 정지한다', () => {
  const range = { fps: 24, idleStart: 96, idleEnd: 288 };
  const start = 95 / 24;
  expect(playbackTime(1, range)).toBe(1);
  expect(playbackTime(start + 8.5, range)).toBeCloseTo(start + 0.5);
  expect(playbackTime(100, range, true)).toBe(start);
});

it('반복 경계와 여러 주기 뒤에도 도구 등장 구간으로 돌아가지 않는다', () => {
  const range = { fps: 24, idleStart: 96, idleEnd: 288 };
  const start = 95 / 24;
  const duration = 8;
  for (const cycle of [0, 1, 2, 100]) {
    const boundary = start + cycle * duration;
    expect(playbackTime(boundary, range)).toBeGreaterThanOrEqual(start);
    expect(playbackTime(boundary, range)).toBeLessThanOrEqual(start + duration);
    expect(playbackTime(boundary + 0.000001, range)).toBeCloseTo(start);
    expect(playbackTime(boundary + 0.5, range)).toBeCloseTo(start + 0.5);
    expect(playbackTime(boundary + duration - 0.01, range)).toBeCloseTo(
      start + duration - 0.01
    );
  }
});
