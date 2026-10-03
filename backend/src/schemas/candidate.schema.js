import { z } from 'zod';

// Regras únicas de validação do cadastro. Tanto o cadastro manual quanto o pré-preenchido
// pelo PDF chegam aqui pelo mesmo endpoint, então os dois caminhos seguem as mesmas regras.

/** Remove espaços das pontas e converte texto vazio em null (campos opcionais). */
const emptyToNull = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/** Remove espaços das pontas e junta espaços repetidos. */
const squish = (value) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value);

export const candidateSchema = z.object(
  {
    fullName: z.preprocess(
      squish,
      z
        .string({ error: 'Informe o nome completo.' })
        .min(1, 'Informe o nome completo.')
        .max(150, 'O nome deve ter no máximo 150 caracteres.')
        .refine((name) => name.split(' ').length >= 2, 'Informe o nome completo (nome e sobrenome).'),
    ),

    email: z.preprocess(
      (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
      z
        .string({ error: 'Informe o e-mail.' })
        .min(1, 'Informe o e-mail.')
        .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
        .pipe(z.email('Informe um e-mail válido, por exemplo: nome@empresa.com.')),
    ),

    phone: z.preprocess(
      emptyToNull,
      z
        .string({ error: 'Telefone inválido.' })
        .max(30, 'O telefone deve ter no máximo 30 caracteres.')
        .regex(/^\+?[\d\s().-]+$/, 'O telefone deve conter apenas números, espaços, parênteses, "+" ou "-".')
        .refine((phone) => {
          const digits = phone.replace(/\D/g, '').length;
          return digits >= 10 && digits <= 15;
        }, 'Informe o telefone com DDD, por exemplo: (11) 91234-5678.')
        .nullable(),
    ),

    desiredRole: z.preprocess(
      emptyToNull,
      z
        .string({ error: 'Área ou cargo inválido.' })
        .max(120, 'A área ou cargo deve ter no máximo 120 caracteres.')
        .nullable(),
    ),

    summary: z.preprocess(
      emptyToNull,
      z
        .string({ error: 'Resumo inválido.' })
        .max(4000, 'O resumo deve ter no máximo 4000 caracteres.')
        .nullable(),
    ),

    source: z.enum(['manual', 'pdf'], { error: 'Origem do cadastro inválida.' }).default('manual'),
  },
  { error: 'Envie os dados do candidato no formato JSON.' },
);
