import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { findToolRoute, toolRoutes } from './tool-routes';

it('홈 GLB의 도구 에셋과 현재 기능을 중복과 누락 없이 연결한다', () => {
  const bytes = readFileSync(
    new URL('../../../public/models/workspace/scene.glb', import.meta.url)
  );
  const length = bytes.readUInt32LE(12);
  const scene = JSON.parse(bytes.subarray(20, 20 + length).toString()) as {
    nodes: { extras?: { source_asset?: string; tool_id?: string } }[];
  };
  const tools = scene.nodes.filter((node) => node.extras?.source_asset);
  const ids = tools.map((node) => node.extras?.tool_id);
  expect(ids.toSorted()).toEqual(
    toolRoutes.map((tool) => tool.modelId).toSorted()
  );
  expect(new Set(ids).size).toBe(toolRoutes.length);
  for (const id of ids) expect(findToolRoute(id)).toBeDefined();
});
