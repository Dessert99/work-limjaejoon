import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { JobsController } from './jobs/jobs.controller';
import { JobsService } from './jobs/jobs.service';

/** API의 시작 구성과 상태 확인 경로를 연결한다. */
@Module({
  controllers: [HealthController, JobsController],
  providers: [JobsService],
})
export class AppModule {}
