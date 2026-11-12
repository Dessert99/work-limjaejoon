/** 서버 처리 도구의 요청 이름이며 화면 주소와는 구분한다. */
export type FileTool = 'pdf-edit' | 'pdf-compress' | 'document-to-pdf';

/** 브라우저가 화면에 표시할 서버 작업 상태다. */
export type FileJob = {
  id: string;
  state: 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';
  message?: string;
  result?: { name: string; size: number; originalReturned?: boolean };
};

/** PDF 편집은 원본 파일 번호와 1부터 시작하는 페이지 번호를 전달한다. */
export type PdfPage = {
  file: number;
  page: number;
  rotation: 0 | 90 | 180 | 270;
};
