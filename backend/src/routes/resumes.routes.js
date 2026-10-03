import { Router } from 'express';
import { AppError } from '../lib/app-error.js';
import { assertPdfSignature, uploadPdf } from '../middlewares/upload-pdf.js';
import { readPdfLines } from '../extraction/pdf-reader.js';
import { extractResumeFields } from '../extraction/resume-extractor.js';

export const resumesRouter = Router();

const MAX_TEXT_PREVIEW = 20_000;

// POST /api/resumes/extract (multipart, campo "file")
// Só lê o PDF e devolve sugestões para o formulário; nada é salvo aqui.
resumesRouter.post('/extract', uploadPdf, async (req, res) => {
  if (!req.file) {
    throw new AppError(400, 'Nenhum arquivo enviado. Selecione um currículo em PDF.');
  }
  assertPdfSignature(req.file.buffer);

  const startedAt = performance.now();
  const { pages, lines } = await readPdfLines(req.file.buffer);
  const text = lines.map((line) => line.text).join('\n');

  if (text.replace(/\s/g, '').length < 20) {
    throw new AppError(
      422,
      'Não encontramos texto no PDF. Ele pode ser uma imagem digitalizada. Preencha o formulário manualmente.',
    );
  }

  const { fields, alternatives } = extractResumeFields(lines);
  const found = Object.keys(fields).filter((key) => fields[key]);
  const missing = Object.keys(fields).filter((key) => !fields[key]);

  res.json({
    fields,
    found,
    missing,
    alternatives,
    text: text.slice(0, MAX_TEXT_PREVIEW),
    meta: { pages, characters: text.length, durationMs: Math.round(performance.now() - startedAt) },
  });
});
