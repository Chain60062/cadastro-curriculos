import { describe, expect, it } from 'vitest';
import { extractResumeFields, findEmails, findName, findPhones } from '../src/extraction/resume-extractor.js';

/**
 * Monta as linhas no formato que o leitor de PDF entrega ao extrator.
 * Cada linha pode ser um texto (fonte 10) ou um par [texto, tamanhoDaFonte].
 */
function toLines(...rows) {
  return rows.map((row) => {
    const [text, fontSize = 10] = Array.isArray(row) ? row : [row];
    return { page: 1, text, fontSize };
  });
}

describe('extração do currículo', () => {
  it('encontra o e-mail no texto', () => {
    expect(findEmails('Contato: Maria.Silva@Empresa.com.br | São Paulo')).toEqual(['maria.silva@empresa.com.br']);
    expect(findEmails('pedro.oliveira @ outlook.com')).toEqual(['pedro.oliveira@outlook.com']); // espaços em volta do @
    expect(findEmails('Instagram: @maria.silva')).toEqual([]);
  });

  it('reconhece telefones brasileiros em vários formatos', () => {
    const formats = ['(11) 91234-5678', '+55 (11) 91234-5678', '11 9 1234 5678', '11.91234.5678', '11912345678'];
    for (const format of formats) {
      expect(findPhones(toLines(`Celular: ${format}`)), format).toEqual(['(11) 91234-5678']);
    }
    expect(findPhones(toLines('Tel.: (21) 3344-5566'))).toEqual(['(21) 3344-5566']); // fixo
  });

  it('não confunde CPF, CEP e datas com telefone', () => {
    for (const text of ['CPF: 119.876.543-21', 'CPF 11987654321', 'CEP 01310-100', '2018 - 2021', '01/2019 - 12/2021']) {
      expect(findPhones(toLines(text)), text).toEqual([]);
    }
  });

  it('identifica o nome no topo do currículo', () => {
    const lines = toLines(['CURRÍCULO', 18], ['MARIA APARECIDA DOS SANTOS', 16], 'Analista de Recursos Humanos', 'EXPERIÊNCIA PROFISSIONAL');
    expect(findName(lines).value).toBe('Maria Aparecida dos Santos');
    expect(findName(toLines('Nome: Pedro Henrique Oliveira')).value).toBe('Pedro Henrique Oliveira'); // com rótulo
    expect(findName(toLines('EXPERIÊNCIA PROFISSIONAL', 'Rua das Flores, 123'))).toBeNull();
  });

  it('extrai todos os campos de um currículo comum', () => {
    const lines = toLines(
      ['João Pedro da Silva', 22],
      ['Desenvolvedor Full Stack | React | Node.js', 12],
      'joao.silva92@gmail.com | (11) 98765-4321 | São Paulo - SP',
      'RESUMO PROFISSIONAL',
      'Desenvolvedor com 6 anos de experiência em aplicações web',
      'e bancos de dados relacionais.',
      'EXPERIÊNCIA PROFISSIONAL',
      'Empresa X - Desenvolvedor Pleno (03/2021 - atual)',
    );

    expect(extractResumeFields(lines).fields).toEqual({
      fullName: 'João Pedro da Silva',
      email: 'joao.silva92@gmail.com',
      phone: '(11) 98765-4321',
      desiredRole: 'Desenvolvedor Full Stack',
      summary: 'Desenvolvedor com 6 anos de experiência em aplicações web e bancos de dados relacionais.',
    });
  });

  it('devolve null nos campos que não encontra', () => {
    const { fields } = extractResumeFields(toLines('documento sem dados de contato', 'apenas texto corrido'));
    expect(fields).toEqual({ fullName: null, email: null, phone: null, desiredRole: null, summary: null });
  });
});
