'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Object3D, Vector3 } from 'three';
import * as styles from './preview.css';

type Props = { host: HTMLDivElement; tools: Object3D[] };

/** 기능명은 모델과 분리된 HTML로 표시하고 도구의 실제 화면 위치를 따라간다. */
export default function ToolLabels({ host, tools }: Props) {
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const point = useRef(new Vector3());
  const { camera, size } = useThree();
  useFrame(() => {
    tools.forEach((tool, index) => {
      const label = labels.current[index];
      if (!label) return;
      tool.updateWorldMatrix(true, false);
      point.current
        .set(0, -0.1, 0)
        .applyMatrix4(tool.matrixWorld)
        .project(camera);
      const shown =
        tool.scale.x > 0.5 && point.current.z > -1 && point.current.z < 1;
      label.style.opacity = shown ? '1' : '0';
      label.style.transform =
        size.width < 600
          ? 'none'
          : `translate(-50%, 0) translate(${((point.current.x + 1) * size.width) / 2}px, ${((1 - point.current.y) * size.height) / 2 + 8}px)`;
    });
  }, 0);
  useEffect(() => {
    const container = document.createElement('div');
    host.appendChild(container);
    const root = createRoot(container);
    root.render(
      <div className={styles.labels}>
        {tools.map((tool, index) => (
          <span
            key={tool.name}
            ref={(element) => {
              labels.current[index] = element;
            }}
            className={styles.toolLabel}>
            {tool.userData.tool_label}
          </span>
        ))}
      </div>
    );
    return () => {
      container.remove();
      queueMicrotask(() => root.unmount());
    };
  }, [host, tools]);
  return null;
}
