import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 내부망의 Nginx가 전달 헤더를 덮어쓰는 구성에서만 바로 앞 중계 한 단계를 신뢰한다.
  app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3100',
  });
  app.enableShutdownHooks();
  // 컨테이너 외부에서 포트 매핑으로 접근할 수 있도록 모든 인터페이스에서 수신한다.
  await app.listen(process.env.PORT ?? 3101, '0.0.0.0');
}

void bootstrap();
