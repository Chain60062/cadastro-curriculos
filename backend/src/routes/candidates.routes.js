import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/app-error.js';
import { candidateSchema } from '../schemas/candidate.schema.js';

export const candidatesRouter = Router();

const listFields = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  desiredRole: true,
  source: true,
  createdAt: true,
};

// GET /api/candidates?search=texto  -> lista (mais recentes primeiro), com busca opcional
candidatesRouter.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';

  const candidates = await prisma.candidate.findMany({
    where: search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
            { desiredRole: { contains: search } },
          ],
        }
      : undefined,
    select: listFields,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  res.json(candidates);
});

// GET /api/candidates/:id  -> detalhes
candidatesRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'Identificador de candidato inválido.');
  }

  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) {
    throw new AppError(404, 'Candidato não encontrado.');
  }

  res.json(candidate);
});

// POST /api/candidates  -> cadastro (manual ou pré-preenchido pelo PDF)
candidatesRouter.post('/', async (req, res) => {
  const data = candidateSchema.parse(req.body ?? {});
  const candidate = await prisma.candidate.create({ data });

  res.status(201).location(`/api/candidates/${candidate.id}`).json(candidate);
});
