import { expect, test, vi } from 'vitest';
import { encodeToTarget } from './encode-to-target';

test('목표 용량 안에서 높은 품질을 찾고 최대 9회만 인코딩한다', async () => {
  const encode = vi.fn(
    async (quality: number) => new Blob([new Uint8Array(quality * 10)])
  );
  const result = await encodeToTarget(encode, 345);
  expect(result.size).toBe(340);
  expect(encode.mock.calls.length).toBeLessThanOrEqual(9);
});

test('최고 품질도 목표 안에 들어오면 추가 인코딩을 하지 않는다', async () => {
  const blob = new Blob(['작은 결과']);
  const encode = vi.fn(async () => blob);
  expect(await encodeToTarget(encode, 100)).toBe(blob);
  expect(encode).toHaveBeenCalledExactlyOnceWith(100);
});

test.each([0, 5])(
  '최저 품질도 %iB 목표를 넘으면 검증한 작은 결과를 반환한다',
  async (target) => {
    const encode = vi.fn(
      async (quality: number) => new Blob([new Uint8Array(quality + 10)])
    );
    expect((await encodeToTarget(encode, target)).size).toBe(11);
    expect(encode).toHaveBeenCalledTimes(2);
  }
);

test('불연속적인 파일 크기도 목표를 넘는 결과로 달성 처리하지 않는다', async () => {
  const encode = vi.fn(
    async (quality: number) =>
      new Blob([new Uint8Array(quality < 50 ? 10 : 1000)])
  );
  expect((await encodeToTarget(encode, 100)).size).toBe(10);
});

test('중간 인코딩 실패는 성공 결과로 덮지 않는다', async () => {
  const encode = vi.fn(async () => new Blob([new Uint8Array(1000)]));
  encode.mockRejectedValueOnce(new Error('인코더 오류'));
  await expect(encodeToTarget(encode, 100)).rejects.toThrow('인코더 오류');
});
