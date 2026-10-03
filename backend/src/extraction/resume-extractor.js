import { z } from 'zod';
import {
  DOCUMENT_NUMBERS,
  EMAIL,
  EMAIL_GLUED_SUFFIX,
  EMAIL_SPACED_AT,
  JOB_TITLE_HINT,
  NAME_FORBIDDEN,
  NAME_LABEL,
  NAME_PARTICLE,
  NAME_WORD,
  NOT_NAME_WORDS,
  OBJECTIVE_HEADER,
  PHONE_BR,
  PHONE_INTL,
  PHONE_LABEL,
  RESUME_TITLE_PREFIX,
  ROLE_IN_SENTENCE,
  ROLE_LABEL,
  ROLE_SENTENCE_TAIL,
  SECTION_HEADER,
  SUMMARY_HEADER,
  VALID_DDDS,
} from './patterns.js';
import { fold, toTitleCase } from './text-utils.js';

const NAME_SEARCH_LINES = 25; // o nome costuma estar no topo da 1ª página
const MIN_NAME_SCORE = 3;
const MAX_SUMMARY_LENGTH = 1500;
const emailFormat = z.email(); // mesma regra de formato usada no cadastro

/**
 * Recebe as linhas do PDF e tenta identificar os campos do formulário.
 * Campos não identificados voltam como null para serem preenchidos manualmente.
 */
export function extractResumeFields(lines) {
  const text = lines.map((line) => line.text).join('\n');
  const emails = findEmails(text);
  const phones = findPhones(lines);
  const name = findName(lines, emails[0]);
  const summary = findSummary(lines);

  return {
    fields: {
      fullName: name?.value ?? null,
      email: emails[0] ?? null,
      phone: phones[0] ?? null,
      desiredRole: findDesiredRole(lines, name?.index, summary),
      summary,
    },
    // Outras opções encontradas (ex.: currículo com dois e-mails ou telefone de referência).
    alternatives: { email: emails.slice(1, 4), phone: phones.slice(1, 4) },
  };
}

// ---------------------------------------------------------------------------
// E-mail
// ---------------------------------------------------------------------------

/** Todos os e-mails válidos, na ordem em que aparecem (o primeiro costuma ser o do cabeçalho). */
export function findEmails(text) {
  const prepared = text.replace(EMAIL_SPACED_AT, '$1@$2');
  const emails = [];

  for (const [match] of prepared.matchAll(EMAIL)) {
    const email = match
      .replace(/^[._%+-]+/, '')
      .replace(EMAIL_GLUED_SUFFIX, '$1')
      .toLowerCase();

    if (emailFormat.safeParse(email).success && !emails.includes(email)) {
      emails.push(email);
    }
  }
  return emails;
}

// ---------------------------------------------------------------------------
// Telefone
// ---------------------------------------------------------------------------

/**
 * Telefones encontrados, do mais provável para o menos provável.
 * Pontuação: brasileiro (+3), linha com rótulo "Tel/Celular/WhatsApp" (+2), celular (+1).
 * Empate: vence o que aparece primeiro.
 */
export function findPhones(lines) {
  const candidates = [];

  lines.forEach((line, index) => {
    const text = line.text.replace(DOCUMENT_NUMBERS, ' ');
    const previous = lines[index - 1]?.text ?? '';
    const labeled = PHONE_LABEL.test(text) || (previous.length < 25 && PHONE_LABEL.test(previous));

    for (const match of text.matchAll(PHONE_BR)) {
      const ddd = match[1] ?? match[2];
      if (!VALID_DDDS.has(ddd)) continue;

      const number = match[3].replace(/\D/g, '') + match[4];
      const isMobile = number.length === 9;
      candidates.push({
        value: formatBrazilianPhone(ddd, number),
        score: 3 + (labeled ? 2 : 0) + (isMobile ? 1 : 0),
        index,
      });
    }

    for (const [match] of text.matchAll(PHONE_INTL)) {
      const digits = match.replace(/\D/g, '').length;
      if (digits < 8 || digits > 15) continue;
      candidates.push({ value: match.trim().replace(/\s+/g, ' '), score: labeled ? 2 : 0, index });
    }
  });

  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  return [...new Set(candidates.map((candidate) => candidate.value))];
}

function formatBrazilianPhone(ddd, number) {
  const split = number.length === 9 ? 5 : 4;
  return `(${ddd}) ${number.slice(0, split)}-${number.slice(split)}`;
}

// ---------------------------------------------------------------------------
// Nome
// ---------------------------------------------------------------------------

/**
 * 1) Rótulo explícito ("Nome: ...").
 * 2) Senão, pontua as linhas do topo da 1ª página que têm "forma de nome":
 *    tamanho da fonte (o nome costuma ser o maior texto), posição (mais perto do topo)
 *    e semelhança com o e-mail (maria.silva@... reforça "Maria Silva").
 */
export function findName(lines, email) {
  for (const [index, line] of lines.entries()) {
    const match = line.text.match(NAME_LABEL);
    if (match && isPlausibleName(match[1])) {
      return { value: formatName(match[1]), index };
    }
  }

  const firstPageLines = lines.filter((line) => line.page === 1);
  const maxFontSize = Math.max(...firstPageLines.map((line) => line.fontSize), 1);
  let best = null;

  lines.slice(0, NAME_SEARCH_LINES).forEach((line, index) => {
    if (line.page !== 1) return;

    // "Maria Souza | Desenvolvedora" → avalia só o trecho antes do separador
    const candidate = line.text.replace(RESUME_TITLE_PREFIX, '').split(/\s+[|•·]\s+/)[0].trim();
    if (!isPlausibleName(candidate)) return;

    const fontRatio = line.fontSize / maxFontSize;
    const score =
      3 * fontRatio +
      (fontRatio >= 0.95 ? 2 : 0) +
      2 * (1 - index / NAME_SEARCH_LINES) +
      3 * emailSimilarity(candidate, email);

    if (score >= MIN_NAME_SCORE && (!best || score > best.score)) {
      best = { value: formatName(candidate), index, score };
    }
  });

  return best;
}

function isPlausibleName(text) {
  const value = text.trim();
  if (value.length < 5 || value.length > 70 || NAME_FORBIDDEN.test(value)) return false;

  const words = value.split(/\s+/);
  if (words.length < 2 || words.length > 6) return false;

  let nameWords = 0;
  for (const word of words) {
    if (NAME_PARTICLE.test(word)) continue;
    if (!NAME_WORD.test(word)) return false;
    if (NOT_NAME_WORDS.has(fold(word).replace(/\.$/, ''))) return false;
    nameWords++;
  }
  return nameWords >= 2;
}

/** 0 = nenhuma parte do nome no e-mail, 0.5 = uma parte, 1 = duas ou mais. */
function emailSimilarity(name, email) {
  if (!email) return 0;
  const localPart = fold(email.split('@')[0]);
  const matches = fold(name)
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !NAME_PARTICLE.test(word) && localPart.includes(word)).length;
  return Math.min(matches, 2) / 2;
}

function formatName(text) {
  const name = text.trim().replace(/\s+/g, ' ');
  const isAllCaps = name === name.toUpperCase();
  const isAllLower = name === name.toLowerCase();
  return isAllCaps || isAllLower ? toTitleCase(name) : name;
}

// ---------------------------------------------------------------------------
// Área / cargo de interesse
// ---------------------------------------------------------------------------

/**
 * 1) Rótulo explícito ("Objetivo: ...", "Cargo pretendido: ...").
 * 2) Seção "Objetivo" → primeiras linhas da seção.
 * 3) Linha de título profissional logo abaixo do nome ("Desenvolvedora Full Stack | React").
 * 4) Frase no resumo ("Busco uma vaga de Product Designer...").
 */
export function findDesiredRole(lines, nameIndex, summary) {
  for (const line of lines) {
    const match = line.text.match(ROLE_LABEL);
    const role = match && roleFromText(match[1]);
    if (role) return role;
  }

  const objectiveIndex = lines.findIndex((line) => OBJECTIVE_HEADER.test(line.text));
  if (objectiveIndex >= 0) {
    const role = roleFromText(collectSection(lines, objectiveIndex + 1, 3).join(' '));
    if (role) return role;
  }

  if (nameIndex !== undefined) {
    for (const line of lines.slice(nameIndex + 1, nameIndex + 4)) {
      const { text } = line;
      if (text.length <= 100 && !/[@\d]/.test(text) && !SECTION_HEADER.test(text) && JOB_TITLE_HINT.test(text)) {
        return cleanRole(text.split(/\s+[|•·–-]\s+/)[0]);
      }
    }
  }

  const sentence = summary?.match(ROLE_IN_SENTENCE);
  return sentence ? cleanRole(sentence[1].replace(ROLE_SENTENCE_TAIL, '')) : null;
}

/** Extrai o cargo de uma frase de objetivo, ou aceita o texto se ele já for curto como um cargo. */
function roleFromText(text) {
  const sentence = text.match(ROLE_IN_SENTENCE);
  if (sentence) return cleanRole(sentence[1].replace(ROLE_SENTENCE_TAIL, ''));

  const role = cleanRole(text);
  return role && role.length <= 80 && role.split(' ').length <= 8 ? role : null;
}

function cleanRole(text) {
  const role = text
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–:•·|]+|[\s.;:,\-–•·|]+$/g, '')
    .trim();
  return role ? role.slice(0, 120) : null;
}

// ---------------------------------------------------------------------------
// Resumo profissional
// ---------------------------------------------------------------------------

/** Texto da seção "Resumo" / "Sobre mim" / "Perfil", até o próximo título de seção. */
export function findSummary(lines) {
  for (const [index, line] of lines.entries()) {
    const match = line.text.match(SUMMARY_HEADER);
    if (!match) continue;

    const parts = match[1] ? [match[1]] : [];
    parts.push(...collectSection(lines, index + 1, 15));

    const summary = joinParagraph(parts);
    if (summary.length >= 20) return truncate(summary, MAX_SUMMARY_LENGTH);
  }
  return null;
}

/**
 * Linhas de uma seção a partir de "start", parando no próximo título: um título conhecido
 * ou uma linha com fonte bem maior que a do corpo da seção.
 */
function collectSection(lines, start, maxLines) {
  const bodyFontSize = lines[start]?.fontSize ?? 0;
  const result = [];

  for (let i = start; i < lines.length && result.length < maxLines; i++) {
    const line = lines[i];
    if (SECTION_HEADER.test(line.text) || line.fontSize > bodyFontSize * 1.15) break;
    result.push(line.text);
  }
  return result;
}

/** Junta linhas quebradas em um parágrafo, desfazendo hifenização ("desenvol-\nvimento"). */
function joinParagraph(parts) {
  let text = '';
  for (const part of parts) {
    if (!text) text = part;
    else if (/^[•▪●◦*-]\s/.test(part)) text += `\n${part}`;
    else if (/\p{L}-$/u.test(text) && /^\p{Ll}/u.test(part)) text = text.slice(0, -1) + part;
    else text += ` ${part}`;
  }
  return text.trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}
