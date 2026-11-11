import { describe, expect, it } from 'vitest';
import { parseJob } from './jobs';

const id = 'abcdefghijklmnopqrstuvwxyz012345';
describe('서버 작업 응답 검증', () => {
  it('완료 결과만 검증한 이름과 실제 바이트 크기로 전달한다', () => {
    const job = {
      id,
      state: 'completed',
      result: { name: 'result.pdf', size: 123, originalReturned: true },
    };
    expect(parseJob(job)).toEqual(job);
  });
  it('알 수 없는 상태와 경로 식별자, 잘못된 결과 크기를 거절한다', () => {
    for (const body of [
      null,
      { id: '../비밀', state: 'completed' },
      { id, state: 'unknown' },
      { id, state: 'completed' },
      { id, state: 'completed', result: { name: 'a.pdf', size: -1 } },
    ]) {
      expect(() => parseJob(body)).toThrow();
    }
  });
});
