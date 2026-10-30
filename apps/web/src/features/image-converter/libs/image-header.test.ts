import { expect, test } from 'vitest';
import { readImageHeader } from './image-header';

function buffer(bytes: number[]) {
  return Uint8Array.from(bytes).buffer;
}

test('확장자 대신 JPEG와 WebP 파일 구조에서 크기를 읽는다', () => {
  const jpeg = buffer([0xff, 0xd8, 0xff, 0xc0, 0, 8, 8, 0, 10, 0, 20, 0]);
  expect(readImageHeader(jpeg)).toEqual({
    format: 'image/jpeg',
    width: 20,
    height: 10,
    animated: false,
  });
  const webp = buffer([
    82, 73, 70, 70, 18, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 76, 5, 0, 0, 0,
    0x2f, 19, 64, 2, 0, 0,
  ]);
  expect(readImageHeader(webp)).toEqual({
    format: 'image/webp',
    width: 20,
    height: 10,
    animated: false,
  });
});

test('손상된 구조와 지원하지 않는 형식은 디코딩 전에 거부한다', () => {
  for (const bytes of [
    [],
    [0xff, 0xd8, 0xff, 0xc0, 0, 100],
    [71, 73, 70, 56, 57, 97],
  ]) {
    expect(() => readImageHeader(buffer(bytes))).toThrow(
      '손상되었거나 지원하지 않는'
    );
  }
});
