import multer from 'multer';
import { AppError } from '../lib/app-error.js';

export const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Recebe um único arquivo no campo "file", em memória (o PDF não é gravado em disco).
 * O filtro aqui olha só o tipo declarado/extensão; a assinatura real do arquivo é
 * conferida depois com assertPdfSignature, já que o tipo declarado pode ser falso.
 */
export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_SIZE, files: 1 },
  fileFilter(req, file, callback) {
    const looksLikePdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname);
    if (!looksLikePdf) {
      return callback(new AppError(415, 'Arquivo inválido. Envie o currículo no formato PDF.'));
    }
    callback(null, true);
  },
}).single('file');

/** Todo PDF começa com "%PDF-" (a especificação tolera lixo nos primeiros 1024 bytes). */
export function assertPdfSignature(buffer) {
  const header = buffer.subarray(0, 1024).toString('latin1');
  if (!header.includes('%PDF-')) {
    throw new AppError(415, 'O arquivo enviado não é um PDF válido.');
  }
}
