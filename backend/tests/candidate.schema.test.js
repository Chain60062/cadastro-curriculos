import { describe, expect, it } from 'vitest';
import { candidateSchema } from '../src/schemas/candidate.schema.js';

/** Devolve os nomes dos campos com erro (ou [] se a entrada for válida). */
function invalidFields(input) {
  const result = candidateSchema.safeParse(input);
  return result.success ? [] : [...new Set(result.error.issues.map((issue) => issue.path[0]))].sort();
}

describe('validação do cadastro', () => {
  it('aceita um cadastro válido e normaliza os dados', () => {
    const parsed = candidateSchema.parse({
      fullName: '  Maria   da Silva ',
      email: ' Maria@Empresa.COM ',
      phone: '(11) 91234-5678',
      desiredRole: '',
    });

    expect(parsed).toEqual({
      fullName: 'Maria da Silva',
      email: 'maria@empresa.com',
      phone: '(11) 91234-5678',
      desiredRole: null,
      summary: null,
      source: 'manual',
    });
  });

  it('exige nome completo e e-mail', () => {
    expect(invalidFields({})).toEqual(['email', 'fullName']);
    expect(invalidFields({ fullName: 'Maria', email: 'maria@empresa.com' })).toEqual(['fullName']); // só o primeiro nome
  });

  it('rejeita e-mail em formato inválido', () => {
    for (const email of ['maria', 'maria@', '@empresa.com', 'maria@empresa', 'maria silva@empresa.com']) {
      expect(invalidFields({ fullName: 'Maria da Silva', email }), email).toEqual(['email']);
    }
  });
});
