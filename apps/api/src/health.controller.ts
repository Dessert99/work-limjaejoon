import { Controller, Get } from '@nestjs/common';

/** 컨테이너에서 API가 응답하는지 확인할 경로를 제공한다. */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
