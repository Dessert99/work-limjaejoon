import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const jsxMessage =
  'JSX를 반환하는 이름 붙인 함수는 대문자 컴포넌트로 분리한다.';
const jsxFunctions = ['JSXElement', 'JSXFragment'].flatMap((jsx) => [
  {
    selector: `FunctionDeclaration[id.name=/^[a-z]/]:has(${jsx})`,
    message: jsxMessage,
  },
  {
    selector: `VariableDeclarator[id.name=/^[a-z]/] > ArrowFunctionExpression:has(${jsx})`,
    message: jsxMessage,
  },
  {
    selector: `VariableDeclarator[id.name=/^[a-z]/] > FunctionExpression:has(${jsx})`,
    message: jsxMessage,
  },
]);

/** Next.js 규칙과 층 경계를 적용하고 포맷은 Prettier에 맡긴다. */
export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  prettier,
  {
    files: ['components/ui/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/domains', '@/domains/**', '@/app', '@/app/**'],
              message: '공용 코드는 위층에 의존하지 않는다.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['domains/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app', '@/app/**', 'next', 'next/**'],
              message: 'domain은 화면과 Next.js에 의존하지 않는다.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['{app,domains,components,lib}/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', ...jsxFunctions] },
  },
]);
