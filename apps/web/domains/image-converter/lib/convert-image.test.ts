import { beforeEach, expect, test, vi } from 'vitest';
import { convertImage } from './convert-image';
import { optimisePng } from './optimise-png';
import type { ConvertOptions } from '../model/image-converter';

vi.mock('./optimise-png', () => ({ optimisePng: vi.fn() }));

const options: ConvertOptions = {
  format: 'image/jpeg',
  quality: 80,
  maxDimension: null,
};
const bitmap = { width: 320, height: 180, close: vi.fn() };
const context = {
  fillStyle: '',
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
};
const convertToBlob = vi.fn();

function jpeg(width = 320, height = 180) {
  const bytes = Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0,
    8,
    8,
    height >> 8,
    height & 255,
    width >> 8,
    width & 255,
    0,
  ]);
  return new File([bytes], '사진.jpeg', { type: 'image/jpeg' });
}

beforeEach(() => {
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      getContext() {
        return context;
      }
      convertToBlob = convertToBlob;
    }
  );
  convertToBlob.mockImplementation(
    async ({ type }: { type: string }) => new Blob(['결과'], { type })
  );
  vi.mocked(optimisePng).mockResolvedValue(
    new Blob(['PNG 결과'], { type: 'image/png' })
  );
  context.fillStyle = '';
});

test.each(['image/jpeg', 'image/webp', 'image/png'] as const)(
  '%s 인코더 선택과 출력 이름, 품질 전달을 확인한다',
  async (format) => {
    const file = jpeg();
    const result = await convertImage(file, { ...options, format });
    expect(result.blob.type).toBe(format);
    expect(result.name).toBe(
      format === 'image/jpeg' ? '사진.jpg' : `사진.${format.split('/')[1]}`
    );
    expect(result.originalSize).toBe(file.size);
    if (format === 'image/png') {
      expect(optimisePng).toHaveBeenCalledOnce();
      expect(convertToBlob).not.toHaveBeenCalled();
    } else {
      expect(convertToBlob).toHaveBeenCalledWith({
        type: format,
        quality: 0.8,
      });
    }
    expect(bitmap.close).toHaveBeenCalledOnce();
  }
);

test('JPG의 투명 영역을 흰색으로 채우고 긴 변 비율을 유지한다', async () => {
  const result = await convertImage(jpeg(), { ...options, maxDimension: 160 });
  expect([result.width, result.height]).toEqual([160, 90]);
  expect(context.fillStyle).toBe('#ffffff');
  expect(context.fillRect).toHaveBeenCalledWith(0, 0, 160, 90);
  expect(context.drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 160, 90);
});

test('긴 변 제한이 원본보다 크면 확대하지 않는다', async () => {
  const result = await convertImage(jpeg(), { ...options, maxDimension: 1000 });
  expect([result.width, result.height]).toEqual([320, 180]);
});

test.each([
  [{ quality: 0 }, '품질은 1부터 100'],
  [{ quality: 101 }, '품질은 1부터 100'],
  [{ quality: 1.5 }, '품질은 1부터 100'],
  [{ maxDimension: 0 }, '긴 변은 1 이상의 정수'],
  [{ maxDimension: 1.5 }, '긴 변은 1 이상의 정수'],
  [{ maxDimension: 16385 }, '긴 변 제한은 16,384px 이하'],
  [{ format: 'image/gif' }, '지원하지 않는 출력 형식'],
] as const)(
  '잘못된 옵션 %j는 디코딩 전에 거부한다',
  async (invalid, message) => {
    await expect(
      convertImage(jpeg(), { ...options, ...invalid } as ConvertOptions)
    ).rejects.toThrow(message);
    expect(createImageBitmap).not.toHaveBeenCalled();
  }
);

test.each([0, 90_000_001])(
  '%iB 파일은 내용조차 읽지 않고 거부한다',
  async (size) => {
    const file = jpeg();
    // 대용량 메모리를 할당하지 않고 File의 용량 경계만 재현한다.
    Object.defineProperty(file, 'size', { value: size });
    const read = vi.spyOn(file, 'arrayBuffer');
    await expect(convertImage(file, options)).rejects.toThrow('90MB 이하');
    expect(read).not.toHaveBeenCalled();
    expect(createImageBitmap).not.toHaveBeenCalled();
  }
);

test('정확히 90MB인 파일은 허용한다', async () => {
  const file = jpeg();
  Object.defineProperty(file, 'size', { value: 90_000_000 });
  const result = await convertImage(file, options);
  expect(result.originalSize).toBe(90_000_000);
  expect(createImageBitmap).toHaveBeenCalledOnce();
});

test.each([
  [6000, 4000],
  [16384, 1],
])('%i × %i 해상도 상한은 허용한다', async (width, height) => {
  vi.mocked(createImageBitmap).mockResolvedValue({
    ...bitmap,
    width,
    height,
  } as ImageBitmap);
  const result = await convertImage(jpeg(width, height), options);
  expect([result.width, result.height]).toEqual([width, height]);
});

test.each([
  [6000, 4001, '임시 안전 상한'],
  [16385, 1, '임시 안전 상한'],
  [0, 1, '이미지의 크기를 읽지 못했습니다'],
])('%i × %i 입력은 디코딩 전에 거부한다', async (width, height, message) => {
  await expect(convertImage(jpeg(width, height), options)).rejects.toThrow(
    message
  );
  expect(createImageBitmap).not.toHaveBeenCalled();
});

test('이미지가 아닌 파일은 확장자와 MIME을 믿지 않고 거부한다', async () => {
  const file = new File(['이미지가 아님'], 'fake.jpg', { type: 'image/jpeg' });
  await expect(convertImage(file, options)).rejects.toThrow(
    '손상되었거나 지원하지 않는'
  );
  expect(createImageBitmap).not.toHaveBeenCalled();
});

test.each([
  [
    'PNG',
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACGFjVEwAAAACAAAAAPONk3AAAAAaZmNUTAAAAAAAAAABAAAAAQAAAAAAAAAAAAEACgAAWn8w0AAAAA1JREFUeJxj+M/A8B8ABQAB/4mZPR0AAAAaZmNUTAAAAAEAAAABAAAAAQAAAAAAAAAAAAEACgAAwQzaBAAAABFmZEFUAAAAAnicY2D4z/AfAAQBAf9i5+mcAAAAAElFTkSuQmCC',
      'base64'
    ),
  ],
  // VP8X의 애니메이션 플래그만으로 본문을 디코딩하기 전에 차단해야 한다.
  [
    'WebP',
    Buffer.from(
      '524946461600000057454250565038580a00000002000000000000000000',
      'hex'
    ),
  ],
])('애니메이션으로 표시된 %s는 디코딩 전에 거부한다', async (_, bytes) => {
  await expect(
    convertImage(new File([bytes], 'animation'), options)
  ).rejects.toThrow('움직이는 PNG·WebP');
  expect(createImageBitmap).not.toHaveBeenCalled();
});

test.each([1, 100])('품질 경계값 %i를 인코더에 전달한다', async (quality) => {
  await convertImage(jpeg(), { ...options, quality });
  expect(convertToBlob).toHaveBeenCalledWith({
    type: 'image/jpeg',
    quality: quality / 100,
  });
});

test('긴 변을 1px로 줄여도 짧은 변이 0px가 되지 않는다', async () => {
  vi.mocked(createImageBitmap).mockResolvedValue({
    ...bitmap,
    width: 1,
    height: 320,
  } as ImageBitmap);
  const result = await convertImage(jpeg(1, 320), {
    ...options,
    maxDimension: 1,
  });
  expect([result.width, result.height]).toEqual([1, 1]);
});

test('긴 변 제한의 상한인 16,384px을 허용한다', async () => {
  const result = await convertImage(jpeg(), {
    ...options,
    maxDimension: 16384,
  });
  expect([result.width, result.height]).toEqual([320, 180]);
});

test('브라우저가 다른 형식을 반환해도 비트맵을 해제하고 오류를 알린다', async () => {
  convertToBlob.mockResolvedValue(new Blob(['PNG'], { type: 'image/png' }));
  await expect(convertImage(jpeg(), options)).rejects.toThrow(
    '출력 형식을 지원하지'
  );
  expect(bitmap.close).toHaveBeenCalledOnce();
});

test.each(['image/jpeg', 'image/png'] as const)(
  '%s 인코딩이 실패해도 비트맵을 해제한다',
  async (format) => {
    const error = new Error('인코딩 실패');
    convertToBlob.mockRejectedValue(error);
    vi.mocked(optimisePng).mockRejectedValue(error);
    await expect(convertImage(jpeg(), { ...options, format })).rejects.toBe(
      error
    );
    expect(bitmap.close).toHaveBeenCalledOnce();
  }
);

test('원본 형식 압축은 확장자와 MIME이 아닌 파일 내용으로 인코더를 고른다', async () => {
  const file = new File([await jpeg().arrayBuffer()], '위장.png', {
    type: 'image/png',
  });
  const result = await convertImage(file, { ...options, format: 'original' });
  expect(convertToBlob).toHaveBeenCalledWith({
    type: 'image/jpeg',
    quality: 0.8,
  });
  expect(result.name).toBe('위장.jpg');
  expect(result.blob.type).toBe('image/jpeg');
  expect(result.originalReturned).toBe(false);
});

test.each([12, 100])(
  '원본 형식 압축 결과가 %iB로 줄지 않으면 원본 바이트를 그대로 제공한다',
  async (size) => {
    const file = jpeg();
    convertToBlob.mockResolvedValue(
      new Blob([new Uint8Array(size)], { type: 'image/jpeg' })
    );
    const result = await convertImage(file, { ...options, format: 'original' });
    expect(result.originalReturned).toBe(true);
    expect(await result.blob.arrayBuffer()).toEqual(await file.arrayBuffer());
    expect(bitmap.close).toHaveBeenCalledOnce();
  }
);

test('형식 변환이나 해상도 축소 요청은 용량이 늘어도 변환 결과를 유지한다', async () => {
  const blob = new Blob([new Uint8Array(100)], { type: 'image/jpeg' });
  convertToBlob.mockResolvedValue(blob);
  for (const configuration of [
    options,
    { ...options, format: 'original' as const, maxDimension: 160 },
  ]) {
    const result = await convertImage(jpeg(), configuration);
    expect(result.blob).toBe(blob);
    expect(result.originalReturned).toBe(false);
  }
});

test('원본보다 큰 긴 변을 설정해 실제 크기가 그대로면 용량 증가 시 원본을 유지한다', async () => {
  const file = jpeg();
  convertToBlob.mockResolvedValue(
    new Blob([new Uint8Array(100)], { type: 'image/jpeg' })
  );
  const result = await convertImage(file, {
    ...options,
    format: 'original',
    maxDimension: 1920,
  });
  expect([result.width, result.height]).toEqual([320, 180]);
  expect(result.originalReturned).toBe(true);
  expect(await result.blob.arrayBuffer()).toEqual(await file.arrayBuffer());
});

test.each([-1, 100, 1.5, NaN])(
  '잘못된 용량 목표 %s는 원본을 디코딩하기 전에 거부한다',
  async (targetReduction) => {
    await expect(
      convertImage(jpeg(), { ...options, format: 'original', targetReduction })
    ).rejects.toThrow('0~99%');
    expect(createImageBitmap).not.toHaveBeenCalled();
  }
);

test('용량 70% 감소 목표는 품질 70으로 고정하지 않고 여러 품질의 실제 용량을 비교한다', async () => {
  convertToBlob.mockImplementation(
    async ({ type, quality }) =>
      new Blob([new Uint8Array(Math.ceil(quality * 10))], { type })
  );
  const file = jpeg();
  const result = await convertImage(file, {
    ...options,
    format: 'original',
    targetReduction: 70,
  });
  expect(result.blob.size).toBeLessThanOrEqual(Math.floor(file.size * 0.3));
  expect(convertToBlob.mock.calls.length).toBeGreaterThan(1);
  expect(convertToBlob.mock.calls.length).toBeLessThanOrEqual(9);
  expect(createImageBitmap).toHaveBeenCalledOnce();
  expect(bitmap.close).toHaveBeenCalledOnce();
  expect([result.width, result.height]).toEqual([320, 180]);
});

test('0% 감소 목표는 재인코딩 없이 원본 바이트를 제공한다', async () => {
  const file = jpeg();
  const result = await convertImage(file, {
    ...options,
    format: 'original',
    targetReduction: 0,
  });
  expect(await result.blob.arrayBuffer()).toEqual(await file.arrayBuffer());
  expect(result.originalReturned).toBe(true);
  expect(convertToBlob).not.toHaveBeenCalled();
});
