import { fileTools } from '@/domains/file-tools/config/tools';
import type { FileTool } from '@/domains/file-tools/model/file-tools';
import FileToolWorkspace from './FileToolWorkspace';
import * as styles from './tools.css';

/** 검색 엔진과 스크립트 없는 화면에도 도구의 목적과 사용법을 전달한다. */
export default function FileToolPage({ tool }: { tool: FileTool }) {
  const config = fileTools[tool];
  return (
    <main>
      <h1 className={styles.heading}>{config.title}</h1>
      <p>{config.description}</p>
      <p className={styles.note}>
        입력은 처리 후, 결과는 다운로드 후 삭제합니다. 다운로드하지 않은 결과는
        10분 후 삭제합니다.
      </p>
      <FileToolWorkspace
        key={tool}
        tool={tool}
      />
      <section
        className={styles.panel}
        aria-label='사용 방법'>
        <h2>사용 방법</h2>
        <p>{config.instructions}</p>
        <p>
          각 파일은 90MB, 전체 합계는 300MB까지 선택할 수 있습니다. 암호가 걸린
          PDF는 지원하지 않습니다.
        </p>
        {tool === 'document-to-pdf' && (
          <p>
            원본에 사용한 글꼴에 따라 배치가 달라질 수 있습니다. 제출 전 결과
            PDF를 확인하세요. HWP·HWPX는 실험 기능이며 실제 파일의 글꼴·배치를
            확인해 주세요.
          </p>
        )}
      </section>
    </main>
  );
}
