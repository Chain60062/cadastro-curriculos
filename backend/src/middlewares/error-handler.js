import multer from 'multer';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/app-error.js';

const DB_UNAVAILABLE_CODES = new Set(['P1000', 'P1001', 'P1002', 'P1003', 'P1017']);

export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Rota não encontrada.' });
}

// Express 5 encaminha para cá também os erros lançados em handlers async.
export function errorHandler(error, req, res, next) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ message: error.message, errors: error.errors });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Verifique os campos destacados.', errors: toFieldErrors(error) });
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'O arquivo excede o limite de 5 MB.' });
    }
    return res.status(400).json({ message: 'Envie um único arquivo PDF no campo "file".' });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'O corpo da requisição não é um JSON válido.' });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Os dados enviados excedem o tamanho permitido.' });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const message = 'Já existe um candidato cadastrado com este e-mail.';
    return res.status(409).json({ message, errors: { email: message } });
  }

  if (error instanceof Prisma.PrismaClientInitializationError || DB_UNAVAILABLE_CODES.has(error.code)) {
    console.error(error);
    return res.status(503).json({
      message: 'Não foi possível conectar ao banco de dados. Verifique se o SQL Server está acessível.',
    });
  }

  console.error(error);
  res.status(500).json({ message: 'Erro inesperado no servidor. Tente novamente.' });
}

/** { fullName: 'Informe o nome completo.', ... } – primeira mensagem de cada campo. */
function toFieldErrors(zodError) {
  const errors = {};
  for (const issue of zodError.issues) {
    const field = issue.path.join('.') || 'form';
    errors[field] ??= issue.message;
  }
  return errors;
}
