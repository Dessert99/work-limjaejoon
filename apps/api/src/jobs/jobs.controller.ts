import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  PayloadTooLargeException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import multer, { diskStorage, MulterError } from 'multer';
import { JobsService } from './jobs.service';

/** 파일 내용과 이름을 로그에 남기지 않고 작업 단위의 API를 제공한다. */
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post()
  create(@Body() body: unknown, @Req() request: Request) {
    return this.jobs.create(
      body,
      request.ip ?? request.socket.remoteAddress ?? 'unknown'
    );
  }

  @Post(':id/files')
  async upload(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response
  ) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    request.once('aborted', abort);
    const timeout = setTimeout(() => {
      controller.abort();
      request.destroy();
    }, 120_000);
    try {
      const { directory, maxFile } = await this.jobs.waitForUpload(
        id,
        controller.signal
      );
      const upload = multer({
        storage: diskStorage({
          destination: directory,
          filename: (_request, _file, callback) =>
            callback(null, randomBytes(16).toString('hex')),
        }),
        limits: {
          fileSize: maxFile,
          files: 1,
          fields: 0,
          parts: 1,
          fieldNameSize: 30,
        },
      }).single('file');
      await new Promise<void>((resolve, reject) =>
        upload(request, response, (error) =>
          error ? reject(error) : resolve()
        )
      );
      response.status(201).json(await this.jobs.finishUpload(id, request.file));
    } catch (error) {
      if (controller.signal.aborted) {
        await this.jobs.remove(id).catch(() => undefined);
        if (!response.headersSent && !response.destroyed)
          response.status(408).json({
            message: '업로드 대기 시간이 초과되었거나 요청을 취소했습니다.',
          });
        return;
      }
      if (error instanceof MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE')
          throw new PayloadTooLargeException(
            '파일 크기 또는 합계 상한을 초과했습니다.'
          );
        throw new BadRequestException('요청 하나에 파일 하나만 올려 주세요.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      request.off('aborted', abort);
      await this.jobs.endUpload(id);
    }
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.jobs.start(id);
  }

  @Get(':id')
  status(@Param('id') id: string) {
    return this.jobs.status(id);
  }

  @Get(':id/download')
  download(@Param('id') id: string, @Res() response: Response) {
    const result = this.jobs.download(id);
    response.setHeader('Cache-Control', 'no-store');
    response.download(
      result.path,
      result.name,
      () => void this.jobs.remove(id).catch(() => undefined)
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.jobs.remove(id);
    return { deleted: true };
  }
}
