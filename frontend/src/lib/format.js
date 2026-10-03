export const FIELD_LABELS = {
  fullName: 'nome',
  email: 'e-mail',
  phone: 'telefone',
  desiredRole: 'área/cargo',
  summary: 'resumo',
};

export const SOURCE_LABELS = { manual: 'Manual', pdf: 'PDF' };

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const listFormatter = new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' });

export const formatDate = (value) => dateFormatter.format(new Date(value));

/** ['fullName', 'email'] → "nome e e-mail" */
export const formatFieldList = (fields) => listFormatter.format(fields.map((field) => FIELD_LABELS[field]));
