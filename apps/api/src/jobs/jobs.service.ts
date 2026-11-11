import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
import {
  processFiles,
  type InputFile,
  type Tool,
} from '../file-tools/processing';
import { validateFile } from './validate-file';

type Job = {
  id: string;
  tool: Tool;
  options: unknown;
  directory: string;
  files: InputFile[];
  state: 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';
  touched: number;
  receiving: boolean;
  reservation: number;
  downloading: boolean;
  deleted: boolean;
  expiry?: ReturnType<typeof setTimeout>;
  message?: string;
  result?: {
    path: string;
    name: string;
    size: number;
    originalReturned?: boolean;
  };
};
const tools: Tool[] = [
  'images-to-pdf',
  'pdf-merge',
  'pdf-split',
  'pdf-edit',
  'pdf-compress',
  'document-to-pdf',
];
const maxFile = 90_000_000;
const maxInput = 300_000_000;
const capacity = 900_000_000;

/** 임시 파일의 수명과 분리된 작업 큐를 한 프로세스 안에서 관리한다. */
@Injectable()
export class JobsService implements OnModuleDestroy {
  private readonly jobs = new Map<string, Job>();
  private readonly active = { light: 0, compress: 0, document: 0 };
  private readonly limits = { light: 3, compress: 2, document: 1 };
  private readonly requests = new Map<
    string,
    { count: number; until: number }
  >();
  private readonly timer: ReturnType<typeof setInterval>;
  private reservedUploads = 0;
  private readonly ttl: number;

  constructor() {
    const seconds = Number(process.env.RESULT_TTL_SECONDS ?? 600);
    if (!Number.isSafeInteger(seconds) || seconds < 1)
      throw new Error(
        'RESULT_TTL_SECONDS에 합의한 결과 보관 시간을 초 단위로 설정하세요.'
      );
    this.ttl = seconds * 1000;
    this.timer = setInterval(() => void this.expire(), 30_000);
    this.timer.unref();
  }

  private group(tool: Tool) {
    return tool === 'pdf-compress'
      ? 'compress'
      : tool === 'document-to-pdf'
        ? 'document'
        : 'light';
  }

  private get(id: string) {
    const job = this.jobs.get(id);
    if (!job || job.deleted)
      throw new NotFoundException('작업이 없거나 보관 시간이 지났습니다.');
    return job;
  }

  async create(body: unknown, ip: string) {
    if (
      !body ||
      typeof body !== 'object' ||
      !('tool' in body) ||
      !tools.includes(body.tool as Tool)
    )
      throw new BadRequestException('지원하지 않는 도구입니다.');
    const tool = body.tool as Tool;
    if (this.jobs.size >= 100)
      throw new ServiceUnavailableException(
        '작업이 많습니다. 잠시 뒤 다시 시도해 주세요.'
      );
    if (tool === 'pdf-compress' || tool === 'document-to-pdf') {
      const key = `${ip}:${tool}`;
      const now = Date.now();
      for (const [entry, value] of this.requests)
        if (value.until <= now) this.requests.delete(entry);
      const limit = Number(
        process.env[
          tool === 'pdf-compress' ? 'PDF_RATE_LIMIT' : 'DOCUMENT_RATE_LIMIT'
        ]
      );
      if (!Number.isInteger(limit) || limit < 1)
        throw new ServiceUnavailableException(
          '서버 요청 제한 설정이 필요합니다.'
        );
      const value = this.requests.get(key) ?? {
        count: 0,
        until: now + 3_600_000,
      };
      if (value.count >= limit)
        throw new HttpException(
          '요청이 많습니다. 한 시간 뒤 다시 시도해 주세요.',
          429
        );
      if (this.requests.size > 10_000)
        throw new ServiceUnavailableException('잠시 뒤 다시 시도해 주세요.');
      value.count++;
      this.requests.set(key, value);
    }
    // 작업 주소 자체가 비밀 토큰이므로 추측할 수 없는 난수만 사용한다.
    const id = randomBytes(24).toString('hex');
    const directory = await mkdtemp(join(tmpdir(), 'work-tools-'));
    const options = 'options' in body ? body.options : {};
    this.jobs.set(id, {
      id,
      tool,
      options,
      directory,
      files: [],
      state: 'uploading',
      touched: Date.now(),
      receiving: false,
      reservation: 0,
      downloading: false,
      deleted: false,
    });
    return { id, state: 'uploading' as const };
  }

  beginUpload(id: string) {
    const job = this.get(id);
    if (job.state !== 'uploading' || job.receiving)
      throw new BadRequestException('지금은 파일을 추가할 수 없습니다.');
    const count =
      job.tool === 'images-to-pdf'
        ? 50
        : job.tool === 'pdf-split'
          ? 1
          : ['pdf-compress', 'document-to-pdf'].includes(job.tool)
            ? 3
            : 20;
    if (job.files.length >= count)
      throw new BadRequestException(`파일은 최대 ${count}개까지 선택하세요.`);
    const remaining =
      maxInput - job.files.reduce((sum, file) => sum + file.size, 0);
    const allowed = Math.min(maxFile, remaining);
    if (allowed <= 0)
      throw new BadRequestException('파일 합계 상한을 초과했습니다.');
    const used = [...this.jobs.values()].reduce(
      (total, current) =>
        total +
        current.files.reduce((size, file) => size + file.size, 0) * 3 +
        (current.result?.size ?? 0),
      0
    );
    // 입력 외에 디코딩과 결과를 위한 여유를 남겨 tmpfs 고갈을 막는다.
    if (used + this.reservedUploads + allowed * 3 > capacity)
      throw new ServiceUnavailableException(
        '임시 공간이 사용 중입니다. 다른 작업을 마친 뒤 다시 시도해 주세요.'
      );
    job.receiving = true;
    job.touched = Date.now();
    job.reservation = allowed * 3;
    this.reservedUploads += job.reservation;
    return { directory: job.directory, maxFile: allowed };
  }

  async waitForUpload(id: string, signal: AbortSignal) {
    for (;;) {
      signal.throwIfAborted();
      try {
        return this.beginUpload(id);
      } catch (error) {
        if (!(error instanceof ServiceUnavailableException)) throw error;
        // 공간 확보 전에는 요청 본문을 읽지 않아 큰 파일이 메모리에 쌓이지 않게 한다.
        await pause(250, undefined, { signal });
      }
    }
  }

  async finishUpload(id: string, file?: Express.Multer.File) {
    const job = this.jobs.get(id);
    if (!job) throw new NotFoundException('작업이 없습니다.');
    try {
      if (job.deleted) throw new BadRequestException('취소한 작업입니다.');
      if (!file) throw new BadRequestException('파일 한 개를 선택하세요.');
      if (
        file.size + job.files.reduce((sum, entry) => sum + entry.size, 0) >
        maxInput
      )
        throw new BadRequestException('파일 합계는 300MB 이하여야 합니다.');
      const kind = validateFile(await readFile(file.path), job.tool);
      // 파일명은 표시용으로만 보관하고 실제 경로는 서버 난수로 만든다.
      const name =
        Array.from(
          Buffer.from(file.originalname, 'latin1').toString('utf8'),
          (character) =>
            character.charCodeAt(0) < 32 || '/\\'.includes(character)
              ? '_'
              : character
        )
          .join('')
          .slice(0, 180) || 'file';
      job.files.push({ path: file.path, name, size: file.size, kind });
      return { count: job.files.length };
    } catch (error) {
      if (file) await rm(file.path, { force: true });
      throw error;
    } finally {
      await this.endUpload(id);
    }
  }

  async endUpload(id: string) {
    const job = this.jobs.get(id);
    if (job?.receiving) {
      job.receiving = false;
      this.reservedUploads -= job.reservation;
      job.reservation = 0;
    }
    if (job?.deleted) {
      await rm(job.directory, { recursive: true, force: true });
      this.jobs.delete(id);
    }
  }

  start(id: string) {
    const job = this.get(id);
    if (job.state !== 'uploading' || job.receiving || !job.files.length)
      throw new BadRequestException('파일 업로드를 완료한 뒤 시작하세요.');
    job.state = 'queued';
    this.drain();
    return { id, state: job.state };
  }

  status(id: string) {
    const { state, message, result } = this.get(id);
    return {
      id,
      state,
      ...(message ? { message } : {}),
      ...(result
        ? {
            result: {
              name: result.name,
              size: result.size,
              originalReturned: result.originalReturned,
            },
          }
        : {}),
    };
  }

  download(id: string) {
    const job = this.get(id);
    if (job.state !== 'completed' || !job.result || job.downloading)
      throw new BadRequestException('완료된 결과가 없습니다.');
    job.downloading = true;
    return job.result;
  }

  async remove(id: string) {
    const job = this.get(id);
    clearTimeout(job.expiry);
    job.deleted = true;
    // 실행 중인 외부 프로그램이 정리된 경로에 파일을 다시 만들지 않게 완료 후 지운다.
    if (job.state === 'processing' || job.receiving) return;
    await rm(job.directory, { recursive: true, force: true });
    this.jobs.delete(id);
  }

  private drain() {
    for (const job of this.jobs.values()) {
      const group = this.group(job.tool);
      if (
        job.state !== 'queued' ||
        job.deleted ||
        this.active[group] >= this.limits[group]
      )
        continue;
      this.active[group]++;
      job.state = 'processing';
      void this.run(job).finally(() => {
        this.active[group]--;
        this.drain();
      });
    }
  }

  private async run(job: Job) {
    try {
      const result = await processFiles(
        job.tool,
        job.files,
        job.options,
        job.directory
      );
      if (!resolve(result.path).startsWith(resolve(job.directory) + sep))
        throw new Error('결과 파일 경로가 올바르지 않습니다.');
      const size = (await stat(result.path)).size;
      if (!size || size > 600_000_000)
        throw new Error('결과 파일이 비어 있거나 처리 상한을 넘었습니다.');
      job.result = { ...result, size };
      // 원본 반환 결과는 동일 경로일 수 있으므로 결과 파일만 남긴다.
      await this.keepResultOnly(job.directory, result.path);
      job.files = [];
      job.state = 'completed';
    } catch (error) {
      job.state = 'failed';
      job.message =
        error instanceof Error ? error.message : '파일 처리에 실패했습니다.';
      await rm(job.directory, { recursive: true, force: true });
      job.files = [];
    } finally {
      job.touched = Date.now();
      if (job.deleted) {
        await rm(job.directory, { recursive: true, force: true });
        this.jobs.delete(job.id);
      } else {
        // 완료 결과는 주기 정리를 기다리지 않고 합의한 보관 시간에 삭제한다.
        job.expiry = setTimeout(() => {
          if (!job.downloading) void this.remove(job.id).catch(() => undefined);
        }, this.ttl);
        job.expiry.unref();
      }
    }
  }

  private async keepResultOnly(directory: string, result: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (path === result) continue;
      if (entry.isDirectory() && result.startsWith(path + sep))
        await this.keepResultOnly(path, result);
      else await rm(path, { recursive: true, force: true });
    }
  }

  private async expire() {
    for (const job of this.jobs.values()) {
      if (
        !job.receiving &&
        !job.downloading &&
        job.state !== 'processing' &&
        Date.now() - job.touched > this.ttl
      )
        await this.remove(job.id).catch(() => undefined);
    }
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    await Promise.all(
      [...this.jobs.keys()].map((id) => this.remove(id).catch(() => undefined))
    );
  }
}
