import Alert from './Alert.jsx';

const SUMMARY_MAX = 4000;

/**
 * Formulário único de cadastro, usado tanto no cadastro manual quanto no pré-preenchido pelo PDF.
 * As regras de validação ficam no backend; aqui só exibimos os erros devolvidos por campo.
 */
export default function CandidateForm({
  values,
  errors,
  message,
  highlighted,
  alternatives,
  submitting,
  onChange,
  onPickAlternative,
  onSubmit,
  onClear,
}) {
  const fieldProps = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: (event) => onChange(name, event.target.value),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    className: inputClass(errors[name], highlighted.has(name)),
  });

  const fieldState = (name) => ({ id: name, error: errors[name], fromPdf: highlighted.has(name) });

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {message && <Alert type="error">{message}</Alert>}

      <Field label="Nome completo" required {...fieldState('fullName')}>
        <input type="text" autoComplete="name" maxLength={150} {...fieldProps('fullName')} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="E-mail" required {...fieldState('email')}>
          <input type="email" autoComplete="email" maxLength={254} placeholder="nome@exemplo.com" {...fieldProps('email')} />
          <Alternatives options={alternatives.email} onPick={(value) => onPickAlternative('email', value)} />
        </Field>

        <Field label="Telefone" {...fieldState('phone')}>
          <input type="tel" autoComplete="tel" maxLength={30} placeholder="(11) 91234-5678" {...fieldProps('phone')} />
          <Alternatives options={alternatives.phone} onPick={(value) => onPickAlternative('phone', value)} />
        </Field>
      </div>

      <Field label="Área ou cargo de interesse" {...fieldState('desiredRole')}>
        <input type="text" maxLength={120} placeholder="Ex.: Desenvolvedor Back-end" {...fieldProps('desiredRole')} />
      </Field>

      <Field label="Resumo profissional" {...fieldState('summary')}>
        <textarea rows={6} maxLength={SUMMARY_MAX} {...fieldProps('summary')} />
        <p className="mt-1 text-right text-xs text-slate-400">
          {values.summary.length}/{SUMMARY_MAX}
        </p>
      </Field>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? 'Salvando…' : 'Salvar candidato'}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={submitting}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Limpar formulário
        </button>
        <a href="#/" className="text-sm text-slate-500 hover:text-slate-700">
          Cancelar
        </a>
        <span className="ml-auto text-xs text-slate-400">* campos obrigatórios</span>
      </div>
    </form>
  );
}

function Field({ id, label, required, error, fromPdf, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
        <span>
          {label} {required && <span className="text-red-600">*</span>}
        </span>
        {fromPdf && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-800">
            preenchido pelo PDF, confira
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Outras opções encontradas no PDF (ex.: segundo telefone); clicar troca o valor do campo. */
function Alternatives({ options, onPick }) {
  if (!options?.length) return null;
  return (
    <p className="mt-1 text-xs text-slate-500">
      Também encontrado no PDF:{' '}
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onPick(option)}
          className="mr-2 text-indigo-600 underline hover:text-indigo-800"
        >
          {option}
        </button>
      ))}
    </p>
  );
}

function inputClass(hasError, fromPdf) {
  const base =
    'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40';
  if (hasError) return `${base} border-red-400 bg-red-50/40`;
  if (fromPdf) return `${base} border-amber-300 bg-amber-50/60`;
  return `${base} border-slate-300 bg-white`;
}
