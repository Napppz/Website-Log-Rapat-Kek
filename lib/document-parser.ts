import mammoth from 'mammoth';

/**
 * Extracts plain text from an uploaded document buffer (PDF, DOCX, TXT, MD).
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. Word Document (.docx)
  if (
    extension === 'docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (err: any) {
      console.error('Error parsing DOCX file:', err);
      throw new Error(`Gagal membaca berkas Word (.docx): ${err?.message || 'Format tidak valid'}`);
    }
  }

  // 2. PDF Document (.pdf)
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    try {
      // Dynamic import or require to handle different pdf-parse packaging
      const pdfModule = require('pdf-parse');
      
      // If pdf-parse exposes PDFParse class (v2+)
      if (typeof pdfModule.PDFParse === 'function') {
        const parser = new pdfModule.PDFParse({ data: buffer });
        const res = await parser.getText();
        if (typeof res === 'string') return res;
        if (res && typeof res.text === 'string') return res.text;
      }
      
      // If pdf-parse is callable function (v1)
      if (typeof pdfModule === 'function') {
        const data = await pdfModule(buffer);
        return data.text || '';
      }

      if (pdfModule.default && typeof pdfModule.default === 'function') {
        const data = await pdfModule.default(buffer);
        return data.text || '';
      }

      throw new Error('Modul pembaca PDF tidak dapat diinisialisasi.');
    } catch (err: any) {
      console.error('Error parsing PDF file:', err);
      throw new Error(`Gagal membaca berkas PDF: ${err?.message || 'Format tidak valid'}`);
    }
  }

  // 3. Plain Text / Markdown (.txt, .md, .csv)
  if (
    extension === 'txt' ||
    extension === 'md' ||
    extension === 'csv' ||
    mimeType?.startsWith('text/')
  ) {
    return buffer.toString('utf-8');
  }

  // Fallback: try decoding as UTF-8 string
  return buffer.toString('utf-8');
}
