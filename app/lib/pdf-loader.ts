// 懒加载PDF处理库，减少初始包大小
export const loadPdfParse = async () => {
  const { default: pdfParse } = await import('pdf-parse');
  return pdfParse;
};

export const loadPdf2Json = async () => {
  const pdf2json = await import('pdf2json');
  return pdf2json;
};

export const loadPdfJs = async () => {
  const pdfjs = await import('pdfjs-dist');
  return pdfjs;
};

export const loadDocxParser = async () => {
  const { default: docxParser } = await import('docx-parser');
  return docxParser;
};

export const loadMammoth = async () => {
  const mammoth = await import('mammoth');
  return mammoth;
}; 