import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));

/** 별칭과 상대 경로를 같은 기준으로 검사해 경계 우회를 막는다. */
export function checkArchitecture(sources) {
  const errors = [];
  const graph = new Map();
  for (const [file, source] of Object.entries(sources)) {
    const layer = file.split('/')[0];
    if (!['app', 'domains', 'components', 'lib'].includes(layer)) {
      errors.push(`${file}: 허용되지 않은 최상위 폴더`);
    }
    const domain = layer === 'domains' ? file.split('/')[1] : null;
    if (
      domain &&
      !['api', 'model', 'lib', 'config', 'ui'].includes(file.split('/')[2])
    ) {
      errors.push(`${file}: 허용되지 않은 domain 세그먼트`);
    }
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    function inspect(spec) {
      if (domain && (spec === 'next' || spec.startsWith('next/'))) {
        errors.push(`${file}: domain은 Next.js를 참조할 수 없다`);
      }
      const target = spec.startsWith('@/')
        ? path.posix.normalize(spec.slice(2))
        : spec.startsWith('.')
          ? path.posix.normalize(
              path.posix.join(path.posix.dirname(file), spec)
            )
          : null;
      if (!target) return;
      const targetLayer = target.split('/')[0];
      if (
        (['lib', 'components'].includes(layer) &&
          ['app', 'domains'].includes(targetLayer)) ||
        (layer === 'domains' && targetLayer === 'app')
      ) {
        errors.push(`${file}: 위층 참조 ${spec}`);
      }
      if (layer === 'app' && targetLayer === 'app' && spec.startsWith('@/')) {
        errors.push(`${file}: app 내부는 상대 경로 사용 ${spec}`);
      }
      if (layer === 'app' && targetLayer !== 'app' && spec.startsWith('.')) {
        errors.push(`${file}: 아래층은 별칭 경로 사용 ${spec}`);
      }
      const segments = target.split('/');
      const boundary = segments.lastIndexOf('_components');
      if (targetLayer === 'app' && boundary !== -1) {
        const owner = segments.slice(0, boundary).join('/') + '/';
        if (!file.startsWith(owner))
          errors.push(`${file}: 다른 화면 부품 참조 ${spec}`);
      }
      if (domain && targetLayer === 'domains' && domain !== segments[1]) {
        if (!graph.has(domain)) graph.set(domain, new Set());
        graph.get(domain).add(segments[1]);
      }
    }
    function visit(node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        inspect(node.moduleSpecifier.text);
      }
      // 동적 import와 Worker URL도 파일 이동 때 끊길 수 있는 의존성이다.
      if (
        (ts.isCallExpression(node) &&
          (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
            node.expression.getText(ast) === 'require')) ||
        (ts.isNewExpression(node) && node.expression.getText(ast) === 'URL')
      ) {
        const argument = node.arguments?.[0];
        if (argument && ts.isStringLiteralLike(argument))
          inspect(argument.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  const visited = new Set();
  const active = new Set();
  function visitDomain(domain) {
    if (active.has(domain)) {
      errors.push(`domain 순환: ${[...active, domain].join(' -> ')}`);
      return;
    }
    if (visited.has(domain)) return;
    active.add(domain);
    for (const dependency of graph.get(domain) ?? []) visitDomain(dependency);
    active.delete(domain);
    visited.add(domain);
  }
  for (const domain of graph.keys()) visitDomain(domain);
  return errors;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const directories = [
    'app',
    'domains',
    'components',
    'lib',
    'src',
    'features',
    'shared',
  ];
  const sources = Object.fromEntries(
    directories
      .filter((directory) => fs.existsSync(path.join(root, directory)))
      .flatMap((directory) =>
        fs
          .readdirSync(path.join(root, directory), { recursive: true })
          .map((file) => path.join(directory, file))
      )
      .filter((file) => /\.(?:ts|tsx|mjs)$/.test(file))
      .map((file) => [file, fs.readFileSync(path.join(root, file), 'utf8')])
  );
  const errors = checkArchitecture(sources);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log('프론트엔드 import 경계 검사 통과');
}
