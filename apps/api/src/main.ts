import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3100',
  });
  app.enableShutdownHooks();
  // 컨테이너 외부에서 포트 매핑으로 접근할 수 있도록 모든 인터페이스에서 수신한다.
  await app.listen(process.env.PORT ?? 3101, '0.0.0.0');
}

void bootstrap();
