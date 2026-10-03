import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { AppError } from '../lib/app-error.js';
import { normalizeLine } from './text-utils.js';

const MAX_PAGES = 10;

/**
 * Lê o PDF e devolve o texto em linhas, na ordem em que aparecem no arquivo:
 * [{ page: 1, text: 'Maria da Silva', fontSize: 22 }, ...]
 *
 * O tamanho da fonte é guardado porque ajuda a achar o nome (normalmente o maior texto da 1ª página)
 * e o fim das seções (títulos costumam ser maiores que o corpo).
 */
export async function readPdfLines(buffer) {
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false, // não executa código embutido no PDF
    disableFontFace: true,
    useSystemFonts: false,
    verbosity: 0,
  });

  try {
    const pdf = await loadingTask.promise;
    const lines = [];
    const pageCount = Math.min(pdf.numPages, MAX_PAGES);

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      lines.push(...groupItemsIntoLines(content.items, pageNumber));
    }

    return { pages: pdf.numPages, lines };
  } catch (error) {
    if (error?.name === 'PasswordException') {
      throw new AppError(422, 'O PDF está protegido por senha. Remova a proteção ou preencha o formulário manualmente.');
    }
    console.warn('Falha ao ler PDF:', error?.message);
    throw new AppError(
      422,
      'Não foi possível ler o PDF. O arquivo pode estar corrompido. Preencha o formulário manualmente.',
    );
  } finally {
    await loadingTask.destroy();
  }
}

/**
 * O pdf.js devolve pedaços de texto soltos, cada um com posição (x, y) e tamanho.
 * Aqui eles são juntados em linhas: muda de linha quando o y muda, quando há quebra
 * explícita (hasEOL) ou quando há um salto horizontal grande (layout em colunas).
 */
function groupItemsIntoLines(items, page) {
  const lines = [];
  let current = null;

  const flush = () => {
    if (current) {
      const text = normalizeLine(current.text);
      if (text) lines.push({ page, text, fontSize: Math.round(current.fontSize * 10) / 10 });
    }
    current = null;
  };

  for (const item of items) {
    if (typeof item.str !== 'string') continue; // marcadores de conteúdo, sem texto

    const [, , c, d, x, y] = item.transform;
    const fontSize = Math.hypot(c, d) || item.height || 0;

    if (item.str.trim() === '') {
      // Espaço explícito vira espaço duplo: preserva a separação de palavras em títulos com letras espaçadas.
      if (current && !current.text.endsWith(' ')) current.text += '  ';
      if (item.hasEOL) flush();
      continue;
    }

    if (current) {
      const size = Math.max(fontSize, current.fontSize);
      const sameRow = Math.abs(y - current.y) <= size * 0.5;
      const gap = x - current.endX;
      if (!sameRow || gap > size * 3 || gap < -size) flush();
    }

    if (!current) {
      current = { text: item.str, y, endX: x + item.width, fontSize };
    } else {
      const gap = x - current.endX;
      let separator = '';
      if (!current.text.endsWith(' ') && !item.str.startsWith(' ')) {
        if (gap > current.fontSize * 0.6) separator = '  ';
        else if (gap > current.fontSize * 0.15) separator = ' ';
      }
      current.text += separator + item.str;
      current.endX = x + item.width;
      current.fontSize = Math.max(current.fontSize, fontSize);
    }

    if (item.hasEOL) flush();
  }

  flush();
  return lines;
}
