import Image from 'next/image';
import * as styles from './preview.css';

/** 로딩과 WebGL 미지원 상태에 같은 대체 이미지를 제공한다. */
export default function Poster() {
  // WebGL 미지원과 로딩 중에도 동일한 캐릭터를 보여준다.
  return (
    <Image
      unoptimized
      width={1000}
      height={1000}
      className={styles.poster}
      src='/models/toolbax/poster.png'
      alt='금빛 주머니가 열린 검정 가방 캐릭터'
    />
  );
}
