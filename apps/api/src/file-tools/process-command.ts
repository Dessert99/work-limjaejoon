import {
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { spawn } from 'node:child_process';

/** 셸 해석 없이 제한 시간 안에 외부 변환 프로그램을 실행한다. */
export function runCommand(
  command: string,
  args: string[],
  directory: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: directory,
      stdio: 'ignore',
      detached: process.platform !== 'win32',
      env: {
        ...process.env,
        HOME: directory,
        TMPDIR: directory,
        XDG_CACHE_HOME: `${directory}/cache`,
        XDG_CONFIG_HOME: `${directory}/config`,
      },
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // LibreOffice가 띄운 자식도 함께 종료해야 큐의 동시 실행 제한이 유지된다.
      try {
        if (child.pid && process.platform !== 'win32')
          process.kill(-child.pid, 'SIGKILL');
        else child.kill('SIGKILL');
      } catch {
        // 종료 직전에 이미 끝난 프로세스는 다시 종료하지 않는다.
      }
    }, 60_000);
    child.once('error', () => {
      clearTimeout(timer);
      reject(
        new ServiceUnavailableException(
          '서버의 변환 프로그램을 실행할 수 없습니다.'
        )
      );
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (timedOut)
        reject(
          new UnprocessableEntityException('변환 시간이 60초를 초과했습니다.')
        );
      else if (code !== 0)
        reject(
          new UnprocessableEntityException(
            '파일을 변환하지 못했습니다. 파일 형식과 손상 여부를 확인해 주세요.'
          )
        );
      else resolve();
    });
  });
}
