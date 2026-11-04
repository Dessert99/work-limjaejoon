'use client';
/* eslint-disable @next/next/no-img-element -- 실제 GLB에서 캡처한 작은 정적 대체 이미지를 원본 크기로 표시한다. */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { paperTheme } from '@/lib/styles/tokens';
import * as styles from './workspace.css';

/** 실제 가방 자산을 독립적으로 불러와 홈으로 돌아가는 아이콘으로 사용한다. */
export default function BagBackLink() {
  const host = useRef<HTMLSpanElement>(null);
  const spin = useRef<() => void>(() => {});
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    async function load() {
      const [THREE, { GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
        import('three'),
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/libs/meshopt_decoder.module.js'),
      ]);
      if (disposed || !host.current) return;
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(100, 100);
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setClearColor(0, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      host.current.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
      // 방의 조명 재현이 아닌 독립 아이콘 조명이며 GLB 조명은 이 장면에 추가하지 않는다.
      scene.add(
        new THREE.HemisphereLight(
          paperTheme.iconSky,
          paperTheme.iconGround,
          2.6
        )
      );
      const key = new THREE.DirectionalLight(paperTheme.iconKey, 4.2);
      key.position.set(-3, 5, 5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(paperTheme.iconFill, 2);
      fill.position.set(4, 2, -3);
      scene.add(fill);
      const pivot = new THREE.Group();
      scene.add(pivot);
      let animation = 0;
      let playing = false;
      let releaseAsset = () => {};
      const reduced = matchMedia('(prefers-reduced-motion: reduce)');
      const stop = () => {
        cancelAnimationFrame(animation);
        playing = false;
        pivot.rotation.y = 0;
        renderer.render(scene, camera);
      };
      const motionChanged = () => {
        if (reduced.matches) stop();
      };
      reduced.addEventListener('change', motionChanged);
      cleanup = () => {
        cancelAnimationFrame(animation);
        reduced.removeEventListener('change', motionChanged);
        spin.current = () => {};
        releaseAsset();
        renderer.dispose();
        renderer.domElement.remove();
      };
      const gltf = await new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .loadAsync('/models/toolbax/scene.glb');
      // 홈의 캐시와 분리해 읽었으므로 이 아이콘이 소유한 자원만 해제한다.
      const geometries = new Set<InstanceType<typeof THREE.BufferGeometry>>();
      const materials = new Set<InstanceType<typeof THREE.Material>>();
      const textures = new Set<InstanceType<typeof THREE.Texture>>();
      gltf.scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          materials.add(material);
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) textures.add(value);
          }
        }
      });
      releaseAsset = () => {
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        textures.forEach((texture) => texture.dispose());
      };
      if (disposed) {
        releaseAsset();
        return;
      }
      const mixer = new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      mixer.setTime(0);
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
      const bag = gltf.scene.getObjectByName('Backpack_Motion');
      if (!bag) throw new Error('가방 자산을 찾을 수 없습니다.');
      const removed: InstanceType<typeof THREE.Object3D>[] = [];
      bag.traverse((object) => {
        if (
          /Energy_|Golden_|Idle_Starlight|Spiral_|Pocket_Glow/.test(
            object.name
          ) ||
          object instanceof THREE.Light
        )
          removed.push(object);
      });
      removed.forEach((object) => object.removeFromParent());
      bag.removeFromParent();
      bag.position.set(0, 0, 0);
      bag.quaternion.identity();
      bag.scale.setScalar(1);
      bag.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(bag);
      const size = bounds.getSize(new THREE.Vector3());
      bag.position.sub(bounds.getCenter(new THREE.Vector3()));
      pivot.add(bag);
      const distance =
        (Math.max(size.x, size.y, size.z) / (2 * Math.tan(Math.PI / 12))) * 1.2;
      camera.position.set(-distance * 0.12, distance * 0.11, distance);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      setReady(true);
      spin.current = () => {
        if (playing || reduced.matches) return;
        playing = true;
        const start = performance.now();
        const frame = (now: number) => {
          const progress = Math.min((now - start) / 1100, 1);
          pivot.rotation.y =
            progress * progress * (3 - 2 * progress) * Math.PI * 2;
          renderer.render(scene, camera);
          if (progress < 1) animation = requestAnimationFrame(frame);
          else playing = false;
        };
        animation = requestAnimationFrame(frame);
      };
    }
    void load().catch(() => {
      cleanup();
      if (!disposed) setFailed(true);
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);
  return (
    <Link
      href='/'
      className={styles.bagLink}
      aria-label='방으로 돌아가기'
      data-failed={failed}
      onPointerEnter={() => spin.current()}
      onFocus={() => spin.current()}>
      <span
        className={styles.backArrow}
        aria-hidden='true'>
        ←
      </span>
      <span
        className={styles.bagView}
        aria-hidden='true'>
        {!ready && (
          <img
            src='/models/toolbax/bag-icon.png'
            width={100}
            height={100}
            alt=''
            className={styles.bagFallback}
          />
        )}
        <span ref={host} />
      </span>
    </Link>
  );
}
