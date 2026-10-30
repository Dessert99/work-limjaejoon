import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/** API의 시작 구성과 상태 확인 경로를 연결한다. */
@Module({ controllers: [HealthController] })
export class AppModule {}
