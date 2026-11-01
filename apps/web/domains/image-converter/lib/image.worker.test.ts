import { beforeEach, expect, test, vi } from 'vitest';
import { unzipSync } from 'fflate';
import { convertImage } from './convert-image';
import type {
  ImageRequest,
  ImageResponse,
  ImageResult,
} from '../model/image-converter';

vi.mock('./convert-image', () => ({ convertImage: vi.fn() }));

const postMessage = vi.fn<(message: ImageResponse) => void>();
let worker: {
  onmessage: (event: { data: ImageRequest }) => Promise<void>;
  postMessage: typeof postMessage;
};

function result(file: File): ImageResult {
  return {
    blob: new Blob([file.name]),
    name: '사진.jpg',
    originalSize: file.size,
    width: 320,
    height: 180,
    originalReturned: false,
  };
}

beforeEach(async () => {
  vi.resetModules();
  worker = { onmessage: async () => {}, postMessage };
  vi.stubGlobal('self', worker);
  vi.mocked(convertImage).mockImplementation(async (file) => result(file));
  await import('./image.worker');
});

test('파일을 순차 처리하고 중복 이름을 구분한 ZIP에 중간 파일의 미리보기 결과를 재사용한다', async () => {
  const files = Array.from({ length: 3 }, () => new File(['원본'], '사진.png'));
  const cached = {
    ...result(files[1]),
    blob: new Blob(['미리보기 전용 결과']),
  };
  let active = 0;
  let peak = 0;
  vi.mocked(convertImage).mockImplementation(async (file) => {
    active++;
    peak = Math.max(peak, active);
    await Promise.resolve();
    active--;
    return result(file);
  });
  await worker.onmessage({
    data: {
      files,
      options: { format: 'image/jpeg', quality: 80, maxDimension: null },
      cached: { index: 1, result: cached },
    },
  });
  expect(peak).toBe(1);
  expect(convertImage).toHaveBeenCalledTimes(2);
  expect(postMessage).toHaveBeenCalledWith({
    type: 'progress',
    completed: 3,
    total: 3,
  });
  const message = postMessage.mock.calls.at(-1)![0];
  expect(message.type).toBe('result');
  if (message.type !== 'result') throw new Error('ZIP 결과가 없습니다.');
  const entries = unzipSync(
    new Uint8Array(await message.download.arrayBuffer())
  );
  expect(Object.keys(entries)).toEqual([
    '1-사진.jpg',
    '2-사진.jpg',
    '3-사진.jpg',
  ]);
  expect(entries['2-사진.jpg']).toEqual(
    new Uint8Array(await cached.blob.arrayBuffer())
  );
  expect(message.name).toBe('images.zip');
});

test('한 장이면 ZIP 없이 변환 결과 Blob을 그대로 전달한다', async () => {
  const file = new File(['원본'], '사진.png');
  const converted = result(file);
  vi.mocked(convertImage).mockResolvedValue(converted);
  await worker.onmessage({
    data: {
      files: [file],
      options: { format: 'image/jpeg', quality: 80, maxDimension: null },
    },
  });
  expect(postMessage).toHaveBeenLastCalledWith({
    type: 'result',
    results: [converted],
    download: converted.blob,
    name: converted.name,
  });
});

test('중간 파일 변환에 실패하면 이후 처리를 멈추고 부분 ZIP을 반환하지 않는다', async () => {
  const first = new File(['정상'], 'first.png');
  vi.mocked(convertImage)
    .mockResolvedValueOnce(result(first))
    .mockRejectedValueOnce(new Error('손상된 이미지'));
  await worker.onmessage({
    data: {
      files: [
        first,
        new File(['오류'], 'bad.png'),
        new File(['정상'], 'last.png'),
      ],
      options: { format: 'image/jpeg', quality: 80, maxDimension: null },
    },
  });
  expect(convertImage).toHaveBeenCalledTimes(2);
  expect(
    postMessage.mock.calls.some(([message]) => message.type === 'result')
  ).toBe(false);
  expect(postMessage).toHaveBeenLastCalledWith({
    type: 'error',
    message: '손상된 이미지',
  });
});
