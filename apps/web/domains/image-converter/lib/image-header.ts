import type { ImageFormat } from '../model/image-converter';

/** 이미지 디코딩 전에 형식·해상도·애니메이션을 확인한다. */
export type ImageHeader = {
  format: ImageFormat;
  width: number;
  height: number;
  animated: boolean;
};

const invalid = () =>
  new Error(
    '손상되었거나 지원하지 않는 이미지입니다. JPG, PNG, WebP 파일을 선택해 주세요.'
  );

/** 확장자나 MIME 대신 파일 구조를 검사해 디코딩 전 메모리 사용을 제한한다. */
export function readImageHeader(buffer: ArrayBuffer): ImageHeader {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const text = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));

  if (
    bytes.length >= 33 &&
    text(0, 8) === '\x89PNG\r\n\x1a\n' &&
    text(12, 4) === 'IHDR'
  ) {
    let animated = false;
    let ended = false;
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const size = view.getUint32(offset);
      if (offset + size + 12 > bytes.length) throw invalid();
      const type = text(offset + 4, 4);
      if (type === 'acTL') animated = true;
      if (type === 'IEND') {
        ended = true;
        break;
      }
      offset += size + 12;
    }
    if (!ended) throw invalid();
    return {
      format: 'image/png',
      width: view.getUint32(16),
      height: view.getUint32(20),
      animated,
    };
  }

  if (bytes.length >= 12 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
    if (view.getUint32(4, true) + 8 !== bytes.length) throw invalid();
    let width = 0;
    let height = 0;
    let animated = false;
    const uint24 = (offset: number) =>
      bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const size = view.getUint32(offset + 4, true);
      const start = offset + 8;
      if (start + size > bytes.length) throw invalid();
      const type = text(offset, 4);
      if (type === 'VP8X' && size >= 10) {
        animated ||= Boolean(bytes[start] & 2);
        width = uint24(start + 4) + 1;
        height = uint24(start + 7) + 1;
      } else if (type === 'VP8 ' && size >= 10 && !width) {
        if (text(start + 3, 3) !== '\x9d\x01\x2a') throw invalid();
        width = view.getUint16(start + 6, true) & 0x3fff;
        height = view.getUint16(start + 8, true) & 0x3fff;
      } else if (type === 'VP8L' && size >= 5 && !width) {
        if (bytes[start] !== 0x2f) throw invalid();
        const bits = view.getUint32(start + 1, true);
        width = (bits & 0x3fff) + 1;
        height = ((bits >>> 14) & 0x3fff) + 1;
      }
      animated ||= type === 'ANIM' || type === 'ANMF';
      offset = start + size + (size % 2);
    }
    if (!width || !height) throw invalid();
    return { format: 'image/webp', width, height, animated };
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let offset = 2; offset + 3 < bytes.length;) {
      if (bytes[offset++] !== 0xff) throw invalid();
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) throw invalid();
      const size = view.getUint16(offset);
      if (size < 2 || offset + size > bytes.length) throw invalid();
      // SOF의 크기를 먼저 읽어 작은 압축 파일이 거대한 비트맵을 할당하지 못하게 한다.
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      ) {
        if (size < 8) throw invalid();
        return {
          format: 'image/jpeg',
          height: view.getUint16(offset + 3),
          width: view.getUint16(offset + 5),
          animated: false,
        };
      }
      offset += size;
    }
  }
  throw invalid();
}
