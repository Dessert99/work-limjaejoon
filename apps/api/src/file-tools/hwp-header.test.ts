import { describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { validateFile } from '../jobs/validate-file';

function hwp() {
  const bytes = Buffer.alloc(2560);
  Buffer.from([208, 207, 17, 224, 161, 177, 26, 225]).copy(bytes);
  bytes.writeUInt16LE(3, 26);
  bytes.writeUInt16LE(0xfffe, 28);
  bytes.writeUInt16LE(9, 30);
  bytes.writeUInt16LE(6, 32);
  bytes.writeUInt32LE(1, 44);
  bytes.writeUInt32LE(1, 48);
  bytes.writeUInt32LE(4096, 56);
  bytes.writeUInt32LE(2, 60);
  bytes.writeUInt32LE(1, 64);
  bytes.writeUInt32LE(0xfffffffe, 68);
  bytes.fill(0xff, 76, 512);
  bytes.writeUInt32LE(0, 76);
  bytes.fill(0xff, 512, 1024);
  bytes.writeUInt32LE(0xfffffffd, 512);
  for (const id of [1, 2, 3]) bytes.writeUInt32LE(0xfffffffe, 512 + id * 4);
  const root = 1024;
  bytes.write('Root Entry\0', root, 'utf16le');
  bytes.writeUInt16LE(22, root + 64);
  bytes[root + 66] = 5;
  bytes.writeUInt32LE(3, root + 116);
  bytes.writeBigUInt64LE(256n, root + 120);
  const stream = root + 128;
  bytes.write('FileHeader\0', stream, 'utf16le');
  bytes.writeUInt16LE(22, stream + 64);
  bytes[stream + 66] = 2;
  bytes.writeUInt32LE(0, stream + 116);
  bytes.writeBigUInt64LE(256n, stream + 120);
  bytes.fill(0xff, 1536, 2048);
  for (let id = 0; id < 3; id++) bytes.writeUInt32LE(id + 1, 1536 + id * 4);
  bytes.writeUInt32LE(0xfffffffe, 1548);
  bytes.write('HWP Document File', 2048);
  bytes.writeUInt32LE(0x05000000, 2080);
  return bytes;
}

describe('한글 문서 구조 검증', () => {
  it('OLE의 실제 FileHeader를 읽고 일반 OLE, 암호 문서와 순환 참조를 거부한다', () => {
    expect(validateFile(hwp(), 'document-to-pdf')).toBe('application/x-hwp');
    const other = hwp();
    other.fill(0, 1152, 1216);
    other.write('WordDocument\0', 1152, 'utf16le');
    expect(() => validateFile(other, 'document-to-pdf')).toThrow('HWP');
    const encrypted = hwp();
    encrypted.writeUInt32LE(2, 2084);
    expect(() => validateFile(encrypted, 'document-to-pdf')).toThrow('암호');
    const cycle = hwp();
    cycle.writeUInt32LE(0, 1536);
    expect(() => validateFile(cycle, 'document-to-pdf')).toThrow('손상');
  });

  it('HWPX는 실제 ZIP 내용과 mimetype을 확인하고 이름만 흉내 낸 파일을 거부한다', () => {
    const entries = {
      mimetype: strToU8('application/hwp+zip'),
      'Contents/header.xml': strToU8('<head/>'),
      'Contents/section0.xml': strToU8('<section/>'),
      'Contents/content.hpf': strToU8('<package/>'),
    };
    expect(validateFile(Buffer.from(zipSync(entries)), 'document-to-pdf')).toBe(
      'application/hwp+zip'
    );
    expect(() =>
      validateFile(
        Buffer.from(
          zipSync({ ...entries, mimetype: strToU8('application/zip') })
        ),
        'document-to-pdf'
      )
    ).toThrow('형식');
    expect(() =>
      validateFile(
        Buffer.from(zipSync({ mimetype: entries.mimetype })),
        'document-to-pdf'
      )
    ).toThrow('지원하지 않');
  });
});
