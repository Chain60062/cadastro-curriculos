import { useState } from 'react';
import CandidateForm from '../components/CandidateForm.jsx';
import ResumeImport from '../components/ResumeImport.jsx';
import { api } from '../lib/api.js';

const EMPTY_VALUES = { fullName: '', email: '', phone: '', desiredRole: '', summary: '' };
const NO_ALTERNATIVES = { email: [], phone: [] };

export default function CandidateCreatePage({ onSaved }) {
  const [mode, setMode] = useState('manual'); // 'manual' | 'pdf'
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [highlighted, setHighlighted] = useState(() => new Set()); // campos preenchidos pelo PDF
  const [alternatives, setAlternatives] = useState(NO_ALTERNATIVES);
  const [filledFromPdf, setFilledFromPdf] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors(({ [field]: _removed, ...rest }) => rest);
    setHighlighted((current) => {
      if (!current.has(field)) return current;
      const next = new Set(current);
      next.delete(field); // editado pela pessoa: deixa de ser "sugestão do PDF"
      return next;
    });
  }

  function handleExtracted({ fields, found, alternatives: other }) {
    // Só sobrescreve o que foi encontrado; o resto do que já foi digitado é mantido.
    setValues((current) => {
      const next = { ...current };
      for (const field of found) next[field] = fields[field];
      return next;
    });
    setHighlighted(new Set(found));
    setAlternatives(other);
    setErrors({});
    setMessage(null);
    if (found.length) setFilledFromPdf(true);
  }

  function handlePickAlternative(field, option) {
    setAlternatives((current) => ({
      ...current,
      [field]: current[field].map((item) => (item === option ? values[field] : item)).filter(Boolean),
    }));
    handleChange(field, option);
  }

  function handleClear() {
    setValues(EMPTY_VALUES);
    setErrors({});
    setMessage(null);
    setHighlighted(new Set());
    setAlternatives(NO_ALTERNATIVES);
    setFilledFromPdf(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setMessage(null);
    try {
      const candidate = await api.createCandidate({ ...values, source: filledFromPdf ? 'pdf' : 'manual' });
      onSaved(candidate);
    } catch (error) {
      setErrors(error.errors ?? {});
      setMessage(error.message);
      const firstInvalid = Object.keys(error.errors ?? {})[0];
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Novo candidato</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'manual'
            ? 'Preencha os dados abaixo e salve. Não é preciso enviar documento.'
            : 'Envie o currículo para pré-preencher o formulário. Revise, corrija ou complete os dados antes de salvar.'}
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm" role="group">
        <ModeButton active={mode === 'manual'} onClick={() => setMode('manual')}>
          Cadastro manual
        </ModeButton>
        <ModeButton active={mode === 'pdf'} onClick={() => setMode('pdf')}>
          Cadastro com PDF
        </ModeButton>
      </div>

      {mode === 'pdf' && <ResumeImport onExtracted={handleExtracted} />}

      <CandidateForm
        values={values}
        errors={errors}
        message={message}
        highlighted={highlighted}
        alternatives={alternatives}
        submitting={submitting}
        onChange={handleChange}
        onPickAlternative={handlePickAlternative}
        onSubmit={handleSubmit}
        onClear={handleClear}
      />
    </div>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-sm font-medium ${active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );
}
