// Todas as expressões regulares e listas de palavras usadas na extração ficam aqui,
// para facilitar o ajuste sem mexer na lógica do extrator.

// ---------------------------------------------------------------------------
// E-mail
// ---------------------------------------------------------------------------

/** parte-local@dominio.tld — aceita subdomínios e TLDs compostos (.com.br). */
export const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}/gi;

/** "joao.silva @ gmail.com" → espaços em volta do "@" (comum na extração de PDF). */
export const EMAIL_SPACED_AT = /([a-z0-9._%+-]) *@ *([a-z0-9-])/gi;

/** "maria@gmail.comLinkedIn" → texto grudado depois do TLD (minúsculas seguidas de maiúscula). */
export const EMAIL_GLUED_SUFFIX = /^(.+\.[a-z]{2,})[A-Z][A-Za-z]*$/;

// ---------------------------------------------------------------------------
// Telefone
// ---------------------------------------------------------------------------

/**
 * Telefones brasileiros, com ou sem +55, DDD com ou sem parênteses (e com ou sem 0 na frente),
 * separados por espaço, ponto, hífen ou nada:
 *   +55 (11) 91234-5678 · (11) 9 1234-5678 · 11 91234 5678 · 11912345678 · (011) 3456-7890
 * Grupos: 1 = DDD entre parênteses, 2 = DDD sem parênteses, 3 = prefixo, 4 = sufixo.
 * Celular: 9 + 8 dígitos. Fixo: começa com 2 a 5 + 7 dígitos.
 * Os lookarounds impedem casar no meio de números maiores ou de datas (11/2020).
 */
export const PHONE_BR =
  /(?<![\d/])(?:\+?\s?55[\s.-]*)?(?:\(\s*0?(\d{2})\s*\)|0?(\d{2}))[\s.-]*(9[\s.-]?\d{4}|[2-5]\d{3})[\s.-]?(\d{4})(?![\d/])/g;

/** Telefones internacionais (sempre com "+" e código do país diferente de 55). */
export const PHONE_INTL = /\+(?!\s?55)\d{1,3}(?:[\s.-]?\(?\d{1,5}\)?){2,5}(?![\d/])/g;

/** Rótulos que indicam que o número da linha é um telefone de contato. */
export const PHONE_LABEL = /\b(?:tel(?:efone)?|fone|cel(?:ular)?|whats\s?app|whats|contato|phone|mobile)\b/i;

/** CPF, CNPJ, RG etc. são removidos antes de procurar telefones (um CPF tem 11 dígitos, como um celular). */
export const DOCUMENT_NUMBERS =
  /\b(?:cpf|cnpj|rg|pis|cnh|ctps)\b[\s:nº°.#-]*[\d./-]{6,}|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/gi;

/** DDDs existentes no Brasil — descarta sequências que só parecem telefone. */
export const VALID_DDDS = new Set(
  (
    '11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 ' +
    '51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 ' +
    '91 92 93 94 95 96 97 98 99'
  ).split(' '),
);

// ---------------------------------------------------------------------------
// Nome
// ---------------------------------------------------------------------------

/** "Nome: Maria da Silva" / "Nome completo - Maria da Silva" */
export const NAME_LABEL = /^(?:nome(?:\s+completo)?|full\s+name|name)\s*[:\-–]\s*(.+)$/iu;

/** "Currículo - Maria da Silva" / "Curriculum Vitae: ..." → remove o prefixo antes de avaliar o nome. */
export const RESUME_TITLE_PREFIX = /^(?:curr[íi]culo(?:\s+vitae)?|curriculum(?:\s+vitae)?|cv|r[ée]sum[ée])(?!\p{L})\s*[-–:|]?\s*/iu;

/** Palavra de nome: começa com maiúscula. Aceita acentos, apóstrofo (D'Ávila), hífen e inicial abreviada (M.). */
export const NAME_WORD = /^\p{Lu}[\p{L}'’]*(?:-\p{L}[\p{L}'’]*)*\.?$/u;

/** Partículas que podem aparecer minúsculas no meio do nome. */
export const NAME_PARTICLE = /^(?:d[aeo]s?|e|di|du|del|della|van|von|der|la|le|y)$/iu;

/** Caracteres que não aparecem em nomes de pessoas (dígitos, e-mail, URLs, separadores...). */
export const NAME_FORBIDDEN = /[\d@/\\|:;,()[\]{}<>#$%&*=+_!?"“”•·–]|https?|www\./iu;

/** Palavras (sem acento, minúsculas) que indicam que a linha é título, cargo ou endereço, não um nome. */
export const NOT_NAME_WORDS = new Set(
  (
    // títulos e seções
    'curriculo curriculum vitae resume cv perfil profissional profissionais objetivo objetivos resumo sobre mim ' +
    'experiencia experiencias formacao academica educacao escolaridade habilidades competencias conhecimentos ' +
    'idiomas linguas cursos certificacoes certificados contato contatos dados pessoais informacoes adicionais ' +
    'complementares projetos qualificacoes referencias endereco telefone celular email linkedin github portfolio ' +
    'tecnologias ferramentas atividades premios voluntariado historico apresentacao sintese ' +
    'summary profile experience education skills languages contact about projects certifications ' +
    // cargos e níveis
    'desenvolvedor desenvolvedora developer engenheiro engenheira engineer analista analyst gerente manager ' +
    'assistente tecnico tecnica designer estagiario estagiaria estagio intern coordenador coordenadora consultor ' +
    'consultora especialista programador programadora arquiteto arquiteta auxiliar supervisor supervisora diretor ' +
    'diretora professor professora administrador administradora vendedor vendedora atendente recepcionista ' +
    'contador contadora advogado advogada enfermeiro enfermeira medico medica cientista scientist operador ' +
    'operadora motorista lider lead head trainee junior pleno senior software sistemas dados data full stack ' +
    'fullstack front back end frontend backend web mobile devops product owner scrum master marketing vendas ' +
    'recursos humanos rh ti tecnologia informacao administracao engenharia ciencia computacao ' +
    // endereço e datas
    'rua avenida av alameda travessa rodovia bairro cep brasil brazil ' +
    'janeiro fevereiro marco abril maio junho julho agosto setembro outubro novembro dezembro'
  ).split(' '),
);

// ---------------------------------------------------------------------------
// Seções do currículo
// ---------------------------------------------------------------------------

/** Qualquer título de seção comum (linha só com o título, com ou sem ":"; ou "Título: conteúdo"). */
export const SECTION_HEADER = new RegExp(
  '^(?:' +
    [
      'experi[êe]ncias?(?:\\s+profissionais?)?',
      'hist[óo]rico\\s+profissional',
      'forma[çc][ãa]o(?:\\s+acad[êe]mica)?',
      'educa[çc][ãa]o',
      'escolaridade',
      'habilidades(?:\\s+t[ée]cnicas)?',
      'compet[êe]ncias(?:\\s+t[ée]cnicas)?',
      'conhecimentos(?:\\s+t[ée]cnicos)?',
      'idiomas',
      'l[íi]nguas',
      'cursos(?:\\s+(?:complementares|livres|e\\s+certifica[çc][õo]es))?',
      'certifica[çc][õo]es',
      'certificados',
      'projetos',
      'qualifica[çc][õo]es',
      'informa[çc][õo]es\\s+(?:adicionais|complementares|pessoais)',
      'dados\\s+pessoais',
      'contatos?',
      'refer[êe]ncias',
      'objetivos?(?:\\s+profissional)?',
      'resumo(?:\\s+profissional)?',
      'sobre(?:\\s+mim)?',
      'perfil(?:\\s+profissional)?',
      'apresenta[çc][ãa]o',
      'tecnologias',
      'ferramentas',
      'atividades',
      'volunt[áa]riado',
      'pr[êe]mios',
      '(?:work\\s+)?experience',
      'education',
      'skills',
      'languages',
      'certifications',
      'projects',
      'contact',
      '(?:professional\\s+)?summary',
      'profile',
      'about(?:\\s+me)?',
      'objective',
    ].join('|') +
    ')\\s*(?::.*)?$',
  'iu',
);

/** Título da seção de resumo. Grupo 1 = texto na mesma linha ("Resumo: Desenvolvedor com..."). */
export const SUMMARY_HEADER =
  /^(?:resumo(?:\s+profissional)?|sobre(?:\s+mim)?|perfil(?:\s+profissional)?|apresenta[çc][ãa]o(?:\s+pessoal)?|s[íi]ntese(?:\s+profissional)?|(?:professional\s+)?summary|profile|about(?:\s+me)?)\s*(?::\s*(.*))?$/iu;

// ---------------------------------------------------------------------------
// Área / cargo de interesse
// ---------------------------------------------------------------------------

/** "Objetivo: Analista de Dados" / "Cargo pretendido - Desenvolvedor Back-end" / "Área de interesse: RH" */
export const ROLE_LABEL =
  /^(?:objetivos?(?:\s+profissional)?|cargo(?:\s+(?:pretendido|desejado|almejado|de\s+interesse))?|[áa]rea\s+de\s+(?:interesse|atua[çc][ãa]o)|vaga(?:\s+(?:pretendida|desejada|de\s+interesse))?|posi[çc][ãa]o(?:\s+(?:pretendida|desejada))?|desired\s+(?:position|role)|objective)\s*[:\-–]\s*(.+)$/iu;

/** Título "Objetivo" sozinho na linha (o conteúdo vem nas linhas seguintes). */
export const OBJECTIVE_HEADER = /^(?:objetivos?(?:\s+profissional)?|objective)\s*:?$/iu;

/**
 * "Atuar como Desenvolvedor Back-end em empresa..." / "Busco uma vaga de Analista de Dados..."
 * Grupo 1 = o que vem depois ("Desenvolvedor Back-end em empresa...").
 */
export const ROLE_IN_SENTENCE =
  /(?:(?:atuar|trabalhar|ingressar)\s+(?:profissionalmente\s+)?(?:como|na\s+[áa]rea\s+de|no\s+cargo\s+de|na\s+fun[çc][ãa]o\s+de|na\s+posi[çc][ãa]o\s+de)|(?:vaga|cargo|posi[çc][ãa]o)\s+(?:de|como))\s+([^.;,\n]+)/iu;

/** Corta o complemento da frase: "Desenvolvedor Back-end em empresa de tecnologia" → "Desenvolvedor Back-end". */
export const ROLE_SENTENCE_TAIL = /\s+(?:em|na|no|numa|num|para|com|onde|visando|buscando|que|a\s+fim|e\s+contribuir)\s.*$/iu;

/** Linha de título profissional logo abaixo do nome: "Desenvolvedora Full Stack | React | Node.js". */
export const JOB_TITLE_HINT =
  /(?:desenvolved|developer|engenheir|engineer|analista|analyst|gerente|manager|assistente|t[ée]cnic[oa]|designer|estagi[áa]ri|intern|coordenador|consultor|especialista|programador|arquitet|auxiliar|supervisor|diretor|professor|administrador|vendedor|atendente|recepcionista|contador|advogad|enfermeir|cientista|scientist|product\s+(?:owner|manager)|scrum|devops|tester|l[íi]der|tech\s+lead|trainee|j[úu]nior|pleno|s[êe]nior|full[\s-]?stack|front[\s-]?end|back[\s-]?end)/iu;
