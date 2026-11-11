import { BadRequestException } from '@nestjs/common';

const end = 0xfffffffe;
const free = 0xffffffff;

/** OLE 디렉터리의 실제 FileHeader 스트림으로 HWP 5 문서를 확인한다. */
export function validateHwpHeader(bytes: Buffer) {
  try {
    if (
      !bytes
        .subarray(0, 8)
        .equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225])) ||
      bytes.readUInt32LE(56) !== 4096
    )
      throw new Error();
    const major = bytes.readUInt16LE(26);
    const shift = bytes.readUInt16LE(30);
    if (
      bytes.length < 512 ||
      bytes.readUInt16LE(28) !== 0xfffe ||
      !((major === 3 && shift === 9) || (major === 4 && shift === 12)) ||
      bytes.readUInt16LE(32) !== 6
    )
      throw new Error();
    const sectorSize = 2 ** shift;
    const sectors = Math.floor(bytes.length / sectorSize) - 1;
    const sector = (id: number) => {
      if (!Number.isInteger(id) || id < 0 || id >= sectors) throw new Error();
      return bytes.subarray((id + 1) * sectorSize, (id + 2) * sectorSize);
    };
    const fatIds: number[] = [];
    const collectFat = (buffer: Buffer, count: number) => {
      for (let index = 0; index < count; index++) {
        const id = buffer.readUInt32LE(index * 4);
        if (id !== free) fatIds.push(id);
      }
    };
    collectFat(bytes.subarray(76, 512), 109);
    let nextDifat = bytes.readUInt32LE(68);
    const difatCount = bytes.readUInt32LE(72);
    if (difatCount > sectors) throw new Error();
    const visitedDifat = new Set<number>();
    for (let index = 0; index < difatCount; index++) {
      if (visitedDifat.has(nextDifat)) throw new Error();
      visitedDifat.add(nextDifat);
      const entry = sector(nextDifat);
      collectFat(entry, sectorSize / 4 - 1);
      nextDifat = entry.readUInt32LE(sectorSize - 4);
    }
    if (
      fatIds.length !== bytes.readUInt32LE(44) ||
      fatIds.length > sectors ||
      new Set(fatIds).size !== fatIds.length
    )
      throw new Error();
    const fat = Buffer.concat(fatIds.map(sector));
    const chain = (
      first: number,
      table: Buffer,
      readSector: (id: number) => Buffer,
      limit: number
    ) => {
      const chunks: Buffer[] = [];
      const visited = new Set<number>();
      let id = first;
      while (id !== end) {
        if (
          visited.has(id) ||
          visited.size >= limit ||
          id * 4 + 4 > table.length
        )
          throw new Error();
        visited.add(id);
        chunks.push(readSector(id));
        id = table.readUInt32LE(id * 4);
      }
      return Buffer.concat(chunks);
    };
    const directory = chain(
      bytes.readUInt32LE(48),
      fat,
      sector,
      Math.min(sectors, 2500)
    );
    let root: Buffer | undefined;
    let header: Buffer | undefined;
    for (let offset = 0; offset + 128 <= directory.length; offset += 128) {
      const entry = directory.subarray(offset, offset + 128);
      if (entry[66] === 5) root = entry;
      const nameSize = entry.readUInt16LE(64);
      if (nameSize > 64 || nameSize % 2) throw new Error();
      if (
        entry[66] === 2 &&
        nameSize >= 2 &&
        entry.subarray(0, nameSize - 2).toString('utf16le') === 'FileHeader'
      ) {
        if (header) throw new Error();
        header = entry;
      }
    }
    if (!root || !header) throw new Error();
    const size = header.readBigUInt64LE(120);
    if (size < 40n || size > 4096n) throw new Error();
    let content: Buffer;
    if (size < BigInt(bytes.readUInt32LE(56))) {
      const miniFat = chain(bytes.readUInt32LE(60), fat, sector, sectors);
      const miniStream = chain(root.readUInt32LE(116), fat, sector, sectors);
      const miniSector = (id: number) => {
        if (id * 64 + 64 > miniStream.length) throw new Error();
        return miniStream.subarray(id * 64, id * 64 + 64);
      };
      content = chain(header.readUInt32LE(116), miniFat, miniSector, 64);
    } else content = chain(header.readUInt32LE(116), fat, sector, 8);
    if (
      content.length < Number(size) ||
      content.subarray(0, 17).toString('ascii') !== 'HWP Document File'
    )
      throw new Error();
    if (content.readUInt32LE(32) >>> 24 !== 5) throw new Error();
    if (content.readUInt32LE(36) & 2)
      throw new BadRequestException('암호가 있는 HWP는 처리할 수 없습니다.');
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException('지원하지 않거나 손상된 HWP 문서입니다.');
  }
}
