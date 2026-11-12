import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JobsService } from './jobs.service';
import { processFiles, type Tool } from '../file-tools/processing';

vi.mock('../file-tools/processing', () => ({ processFiles: vi.fn() }));
let service: JobsService;

beforeEach(() => {
  vi.stubEnv('PDF_RATE_LIMIT', '20');
  vi.stubEnv('DOCUMENT_RATE_LIMIT', '10');
  vi.stubEnv('RESULT_TTL_SECONDS', '600');
  service = new JobsService();
});
afterEach(async () => {
  await service.onModuleDestroy();
  vi.useRealTimers();
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

async function uploaded(tool: Tool = 'pdf-edit') {
  const { id } = await service.create({ tool, options: {} }, '127.0.0.1');
  const { directory } = service.beginUpload(id);
  const path = join(directory, 'upload');
  const bytes = Buffer.from('%PDF-1.7\n');
  await writeFile(path, bytes);
  await service.finishUpload(id, {
    path,
    size: bytes.length,
    originalname: 'input.pdf',
  } as Express.Multer.File);
  return { id, directory, path };
}

describe('작업 큐와 임시 파일 수명', () => {
  it.each(['images-to-pdf', 'pdf-split', 'pdf-merge'])(
    '삭제한 기능 %s의 작업 생성을 거부한다',
    async (tool) => {
      await expect(service.create({ tool }, '127.0.0.1')).rejects.toThrow(
        '지원하지 않는 도구'
      );
    }
  );

  it('공간이 확보되면 업로드를 예약하고 대기 중 취소하면 재시도를 멈춘다', async () => {
    const { id } = await service.create({ tool: 'pdf-edit' }, '127.0.0.1');
    const begin = vi.spyOn(service, 'beginUpload');
    try {
      begin.mockImplementationOnce(() => {
        throw new ServiceUnavailableException();
      });
      const result = await service.waitForUpload(
        id,
        new AbortController().signal
      );
      expect(result.maxFile).toBe(90_000_000);
      expect(begin).toHaveBeenCalledTimes(2);
      await service.endUpload(id);
      begin.mockClear();
      begin.mockImplementation(() => {
        throw new ServiceUnavailableException();
      });
      const controller = new AbortController();
      const waiting = service.waitForUpload(id, controller.signal);
      controller.abort();
      await expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
      expect(begin).toHaveBeenCalledTimes(1);
    } finally {
      begin.mockRestore();
    }
  });

  it('잘못된 파일은 지우고 업로드 예약을 해제한다', async () => {
    const { id } = await service.create({ tool: 'pdf-edit' }, '127.0.0.1');
    const { directory } = service.beginUpload(id);
    const path = join(directory, 'invalid');
    await writeFile(path, 'plain text');
    await expect(
      service.finishUpload(id, {
        path,
        size: 10,
        originalname: 'fake.pdf',
      } as Express.Multer.File)
    ).rejects.toThrow('지원하지 않');
    await expect(access(path)).rejects.toThrow();
    expect(() => service.beginUpload(id)).not.toThrow();
    await service.endUpload(id);
    expect(() => service.start(id)).toThrow('업로드');
  });

  it('업로드 중 취소한 작업은 업로드 오류 정리 경로에서도 폴더를 지운다', async () => {
    const { id } = await service.create({ tool: 'pdf-edit' }, '127.0.0.1');
    const { directory } = service.beginUpload(id);
    await writeFile(join(directory, 'partial'), 'partial upload');
    await service.remove(id);
    await expect(access(directory)).resolves.toBeUndefined();
    // Multer 오류로 finishUpload에 도달하지 않아도 finally 경로에서 정리되어야 한다.
    await service.endUpload(id);
    await expect(access(directory)).rejects.toThrow();
    expect(() => service.status(id)).toThrow('작업이 없');
    await expect(service.remove(id)).rejects.toThrow('작업이 없');
  });

  it('다운로드하지 않은 작업은 보관 시간이 지나면 결과와 함께 만료된다', async () => {
    await service.onModuleDestroy();
    vi.useFakeTimers({
      toFake: [
        'Date',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    });
    service = new JobsService();
    const { id, directory } = await uploaded();
    vi.mocked(processFiles).mockImplementation(async () => {
      const path = join(directory, 'result.pdf');
      await writeFile(path, 'result');
      return { path, name: 'result.pdf' };
    });
    service.start(id);
    await vi.waitFor(() => expect(service.status(id).state).toBe('completed'));
    await vi.advanceTimersByTimeAsync(600_000);
    await vi.waitFor(async () => {
      expect(() => service.status(id)).toThrow('작업이 없');
      await expect(access(directory)).rejects.toThrow();
    });
  });

  it('완료하면 중간 파일을 지우고 다운로드 뒤에는 결과까지 지운다', async () => {
    const { id, directory, path: input } = await uploaded();
    const nested = join(directory, 'document');
    const result = join(nested, 'result.pdf');
    vi.mocked(processFiles).mockImplementation(async () => {
      await mkdir(nested);
      await writeFile(join(nested, 'profile'), 'temporary');
      await writeFile(join(directory, 'other.pdf'), 'temporary');
      await writeFile(result, 'result');
      return { path: result, name: 'result.pdf' };
    });
    service.start(id);
    await vi.waitFor(() => expect(service.status(id).state).toBe('completed'));
    await vi.waitFor(async () => {
      await expect(access(input)).rejects.toThrow();
      await expect(access(join(nested, 'profile'))).rejects.toThrow();
      await expect(access(join(directory, 'other.pdf'))).rejects.toThrow();
    });
    expect(await readFile(service.download(id).path, 'utf8')).toBe('result');
    expect(() => service.download(id)).toThrow('결과');
    await service.remove(id);
    await expect(access(directory)).rejects.toThrow();
    expect(() => service.status(id)).toThrow('작업이 없');
  });

  it('무거운 큐의 실행 상한을 지키면서 가벼운 PDF 작업을 처리한다', async () => {
    const releases: Array<() => Promise<void>> = [];
    vi.mocked(processFiles).mockImplementation(
      (_tool, _files, _options, directory) =>
        new Promise((resolve) => {
          releases.push(async () => {
            const path = join(directory, 'result.pdf');
            await writeFile(path, 'result');
            resolve({ path, name: 'result.pdf' });
          });
        })
    );
    const first = await uploaded('pdf-compress');
    const second = await uploaded('pdf-compress');
    const third = await uploaded('pdf-compress');
    const light = await uploaded('pdf-edit');
    service.start(first.id);
    service.start(second.id);
    service.start(third.id);
    service.start(light.id);
    expect(service.status(third.id).state).toBe('queued');
    expect(service.status(light.id).state).toBe('processing');
    expect(releases).toHaveLength(3);
    await releases[0]();
    await vi.waitFor(() =>
      expect(service.status(third.id).state).toBe('processing')
    );
    expect(releases).toHaveLength(4);
    await Promise.all(releases.slice(1).map((release) => release()));
    await vi.waitFor(() =>
      [first, second, third, light].forEach(({ id }) =>
        expect(service.status(id).state).toBe('completed')
      )
    );
  });

  it('처리 중 취소하면 처리 종료까지 폴더를 유지한 뒤 모두 지운다', async () => {
    const { id, directory } = await uploaded();
    let finish!: () => Promise<void>;
    vi.mocked(processFiles).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = async () => {
            const path = join(directory, 'result.pdf');
            await writeFile(path, 'result');
            resolve({ path, name: 'result.pdf' });
          };
        })
    );
    service.start(id);
    await service.remove(id);
    await expect(access(directory)).resolves.toBeUndefined();
    expect(() => service.status(id)).toThrow('작업이 없');
    await finish();
    await vi.waitFor(
      async () => await expect(access(directory)).rejects.toThrow()
    );
  });
});
