import { optimisePng } from './optimise-png';
import { readImageHeader } from './image-header';
import type { ConvertOptions, ImageResult } from '../types/image-converter';

/** 미리보기와 다운로드에 같은 브라우저 변환 결과를 제공한다. */
export async function convertImage(
  file: File,
  options: ConvertOptions
): Promise<ImageResult> {
  if (
    !Number.isInteger(options.quality) ||
    options.quality < 1 ||
    options.quality > 100
  ) {
    throw new Error('품질은 1부터 100 사이의 정수로 지정해 주세요.');
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(options.format)) {
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
    if (options.format === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0, width, height);
    const blob =
      options.format === 'image/png'
        ? await optimisePng(context.getImageData(0, 0, width, height))
        : await canvas.convertToBlob({
            type: options.format,
            quality: options.quality / 100,
          });
    // 지원하지 않는 형식을 PNG로 조용히 바꾸는 브라우저의 대체 동작을 차단한다.
    if (blob.type !== options.format)
      throw new Error('이 브라우저는 선택한 출력 형식을 지원하지 않습니다.');
    const extension =
      options.format === 'image/jpeg' ? 'jpg' : options.format.split('/')[1];
    const name = `${file.name.replace(/\.[^.]*$/, '').replace(/[\\/]/g, '_') || 'image'}.${extension}`;
    return {
      blob,
      name,
      width,
      height,
      originalSize: file.size,
      originalReturned: false,
    };
  } finally {
    bitmap.close();
  }
}
