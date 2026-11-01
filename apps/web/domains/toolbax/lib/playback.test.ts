import { describe, expect, it } from 'vitest';
import { sampleEffects } from './playback';

describe('발광 타이밍', () => {
  const frames = [{ light: 0 }, { light: 100 }, { light: 3 }];
  it('프레임 사이를 보간하고 마지막 잔광을 유지한다', () => {
    expect(sampleEffects(frames, 24, 0.5 / 24).light).toBe(50);
    expect(sampleEffects(frames, 24, 99).light).toBe(3);
    expect(sampleEffects(frames, 24, -1).light).toBe(0);
  });
});
