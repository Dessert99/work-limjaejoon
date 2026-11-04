import { optimisePng } from './optimise-png';
import { readImageHeader } from './image-header';
import { encodeToTarget } from './encode-to-target';
import type { ConvertOptions, ImageResult } from '../model/image-converter';

/** 미리보기와 다운로드에 같은 브라우저 변환 결과를 제공한다. */
export async function convertImage(
  file: File,
  options: ConvertOptions
): Promise<ImageResult> {
  if (
    options.targetReduction !== undefined &&
    (!Number.isInteger(options.targetReduction) ||
      options.targetReduction < 0 ||
      options.targetReduction > 99 ||
      options.format !== 'original' ||
      options.maxDimension !== null)
  )
    throw new Error(
      '용량 감소 목표는 원본 형식·해상도 유지 상태에서 0~99%로 지정해 주세요.'
    );
  if (
    !Number.isInteger(options.quality) ||
    options.quality < 1 ||
    options.quality > 100
  ) {
    throw new Error('품질은 1부터 100 사이의 정수로 지정해 주세요.');
  }
  if (
    !['image/jpeg', 'image/png', 'image/webp', 'original'].includes(
      options.format
    )
  ) {
    throw new Error('지원하지 않는 출력 형식입니다.');
  }
  if (
    options.maxDimension !== null &&
    (!Number.isInteger(options.maxDimension) || options.maxDimension < 1)
  ) {
    throw new Error('긴 변은 1 이상의 정수로 지정해 주세요.');
  }
  if (!file.size || file.size > 90_000_000)
    throw new Error('파일은 0B보다 크고 90MB 이하여야 합니다.');
  const bytes = await file.arrayBuffer();
  const header = readImageHeader(bytes);
  const format = options.format === 'original' ? header.format : options.format;
  if (!header.width || !header.height)
    throw new Error('이미지의 크기를 읽지 못했습니다.');
  // 디코딩 전에 거대한 비트맵 할당을 차단한다.
  if (
    header.width * header.height > 24_000_000 ||
    Math.max(header.width, header.height) > 16_384
  ) {
    throw new Error(
      '임시 안전 상한은 이미지당 2,400만 픽셀, 긴 변 16,384px입니다.'
    );
  }
  if (header.animated)
    throw new Error('움직이는 PNG·WebP는 임시 변환기에서 지원하지 않습니다.');
  if (options.maxDimension !== null && options.maxDimension > 16_384)
    throw new Error('긴 변 제한은 16,384px 이하여야 합니다.');
  const bitmap = await createImageBitmap(
    new Blob([bytes], { type: header.format })
  );
  try {
    const ratio =
      options.maxDimension === null
        ? 1
        : Math.min(
            1,
            options.maxDimension / Math.max(bitmap.width, bitmap.height)
          );
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error('브라우저에서 이미지 편집 기능을 사용할 수 없습니다.');
    if (format === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0, width, height);
    const encode = async (quality: number) => {
      const encoded = await canvas.convertToBlob({
        type: format,
        quality: quality / 100,
      });
      // 품질을 탐색하는 각 단계에서 브라우저의 형식 대체를 차단한다.
      if (encoded.type !== format)
        throw new Error('이 브라우저는 선택한 출력 형식을 지원하지 않습니다.');
      return encoded;
    };
    const blob =
      format === 'image/png'
        ? await optimisePng(context.getImageData(0, 0, width, height))
        : options.targetReduction === 0
          ? new Blob([bytes], { type: header.format })
          : options.targetReduction !== undefined
            ? await encodeToTarget(
                encode,
                Math.floor((file.size * (100 - options.targetReduction)) / 100)
              )
            : await encode(options.quality);
    // 지원하지 않는 형식을 PNG로 조용히 바꾸는 브라우저의 대체 동작을 차단한다.
    if (blob.type !== format)
      throw new Error('이 브라우저는 선택한 출력 형식을 지원하지 않습니다.');
    const extension = format === 'image/jpeg' ? 'jpg' : format.split('/')[1];
    const name = `${file.name.replace(/\.[^.]*$/, '').replace(/[\\/]/g, '_') || 'image'}.${extension}`;
    // 형식과 해상도를 유지하는 압축에서만 크기가 줄지 않은 결과를 원본으로 대체한다.
    const originalReturned =
      options.format === 'original' &&
      width === bitmap.width &&
      height === bitmap.height &&
      blob.size >= file.size;
    return {
      blob: originalReturned
        ? new Blob([bytes], { type: header.format })
        : blob,
      name,
      width,
      height,
      originalSize: file.size,
      originalReturned,
    };
  } finally {
    bitmap.close();
  }
}
