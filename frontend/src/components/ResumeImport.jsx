import { useRef, useState } from 'react';
import Alert from './Alert.jsx';
import { api } from '../lib/api.js';
import { formatFieldList } from '../lib/format.js';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB (o backend valida de novo)

/** Envio opcional do currículo em PDF. Qualquer falha aqui não impede o cadastro manual. */
export default function ResumeImport({ onExtracted }) {
  const [status, setStatus] = useState(null); // { type, message }
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;

    const clientError = validateFile(file);
    if (clientError) {
      setStatus({ type: 'error', message: clientError });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: `Lendo "${file.name}"…` });
    try {
      const result = await api.extractResume(file);
      onExtracted(result);
      setExtractedText(result.text);
      setStatus({ type: result.found.length ? 'success' : 'warning', message: describeResult(result) });
    } catch (error) {
      setExtractedText('');
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = ''; // permite reenviar o mesmo arquivo
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    if (!loading) handleFile(event.dataTransfer.files[0]);
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-center hover:border-indigo-400 hover:bg-indigo-50/40 ${loading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <span className="text-sm font-medium text-slate-700">
          {loading ? 'Lendo currículo…' : 'Clique para selecionar ou arraste o currículo aqui'}
        </span>
        <span className="mt-1 text-xs text-slate-500">Somente PDF, até 5 MB</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={loading}
          onChange={(event) => handleFile(event.target.files[0])}
        />
      </label>

      {status && (
        <Alert type={status.type}>
          {status.message}
          {status.type === 'error' && <span className="block">O cadastro manual continua disponível abaixo.</span>}
        </Alert>
      )}

      {extractedText && (
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700">Ver texto extraído do PDF</summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap text-slate-600">
            {extractedText}
          </pre>
        </details>
      )}
    </section>
  );
}

function validateFile(file) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) return 'Arquivo inválido. Selecione um currículo no formato PDF.';
  if (file.size === 0) return 'O arquivo está vazio.';
  if (file.size > MAX_SIZE) return 'O arquivo excede o limite de 5 MB.';
  return null;
}

function describeResult({ found, missing, meta }) {
  if (!found.length) {
    return 'Lemos o PDF, mas não identificamos nenhum dado. Preencha o formulário manualmente.';
  }
  const pages = `${meta.pages} ${meta.pages === 1 ? 'página' : 'páginas'}`;
  let message = `Currículo lido (${pages}, ${meta.durationMs} ms). Encontramos ${formatFieldList(found)}.`;
  if (missing.length) message += ` Não identificamos ${formatFieldList(missing)}; preencha manualmente se quiser.`;
  return `${message} Revise os dados antes de salvar.`;
}
