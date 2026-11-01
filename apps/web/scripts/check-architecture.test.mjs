import { expect, test } from 'vitest';
import { checkArchitecture } from './check-architecture.mjs';

test('자기 화면과 하위 화면은 부품을 쓰고 아래층으로 의존한다', () => {
  expect(
    checkArchitecture({
      'app/images/page.tsx':
        "import UI from './_components/UI'; import { convert } from '@/domains/images/lib/convert';",
      'app/images/edit/page.tsx': "import UI from '../_components/UI';",
      'domains/images/lib/convert.ts': "import { value } from '@/lib/value';",
    })
  ).toEqual([]);
});

test('상대 경로 재내보내기와 동적 import도 경계를 우회할 수 없다', () => {
  expect(
    checkArchitecture({
      'lib/leak.ts': "export { value } from '../domains/images/model/value';",
      'app/other/page.tsx': "const UI = import('../images/_components/UI');",
      'domains/images/lib/next.ts': "import type { Metadata } from 'next';",
    })
  ).toHaveLength(3);
});

test('도메인 순환과 Worker URL의 역방향 참조를 찾는다', () => {
  expect(
    checkArchitecture({
      'domains/a/lib/a.ts': "import { b } from '@/domains/b/lib/b';",
      'domains/b/lib/b.ts': "export { a } from '@/domains/a/lib/a';",
      'domains/a/lib/worker.ts':
        "new URL('../../../app/worker.ts', import.meta.url);",
    })
  ).toHaveLength(2);
});
