// "J O Ã O  S I L V A" (títulos com espaçamento entre letras) — palavras separadas por 2+ espaços.
const LETTER_SPACED = /^(?:\p{L} ){2,}\p{L}(?: {2,}(?:\p{L} )*\p{L})*$/u;

const NAME_PARTICLES = new Set(['da', 'das', 'de', 'do', 'dos', 'e', 'di', 'du', 'del', 'della', 'van', 'von', 'der', 'la', 'le', 'y']);

/** Limpa uma linha extraída do PDF: ligaduras (ﬁ→fi), espaços especiais, ícones e letras espaçadas. */
export function normalizeLine(raw) {
  let text = raw
    .normalize('NFKC')
    .replace(/[​-‍⁠﻿­]/g, '') // caracteres invisíveis e hífen suave
    .replace(/[-\u{F0000}-\u{FFFFD}]/gu, ' ') // ícones de fontes (área de uso privado)
    .replace(/\s/g, ' ')
    .trim();

  if (LETTER_SPACED.test(text)) {
    text = text
      .split(/ {2,}/)
      .map((word) => word.replaceAll(' ', ''))
      .join(' ');
  }

  return text.replace(/ {2,}/g, ' ');
}

/** Minúsculas e sem acentos, para comparar palavras ("Experiência" → "experiencia"). */
export function fold(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** "MARIA DA SILVA" → "Maria da Silva" */
export function toTitleCase(name) {
  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) =>
      index > 0 && NAME_PARTICLES.has(word)
        ? word
        : word.replace(/(^|[-'’])(\p{L})/gu, (_, separator, letter) => separator + letter.toUpperCase()),
    )
    .join(' ');
}
