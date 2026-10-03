import { useEffect, useState } from 'react';
import Alert from '../components/Alert.jsx';
import { api } from '../lib/api.js';
import { formatDate } from '../lib/format.js';

export default function CandidateDetailPage({ id, flash }) {
  const [state, setState] = useState({ status: 'loading', candidate: null, error: null });

  useEffect(() => {
    let ignore = false;
    setState({ status: 'loading', candidate: null, error: null });

    api.getCandidate(id).then(
      (candidate) => !ignore && setState({ status: 'ready', candidate, error: null }),
      (error) => !ignore && setState({ status: 'error', candidate: null, error: error.message }),
    );

    return () => {
      ignore = true;
    };
  }, [id]);

  const { status, candidate, error } = state;

  return (
    <div className="space-y-6">
      <a href="#/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Voltar para a lista
      </a>

      {flash && <Alert type="success">{flash}</Alert>}
      {status === 'loading' && <p className="text-sm text-slate-500">Carregando…</p>}
      {status === 'error' && <Alert type="error">{error}</Alert>}

      {status === 'ready' && (
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{candidate.fullName}</h1>
              <p className="mt-1 text-sm text-slate-500">{candidate.desiredRole ?? 'Área ou cargo não informado'}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {candidate.source === 'pdf' ? 'Cadastro com PDF' : 'Cadastro manual'}
            </span>
          </header>

          <dl className="grid gap-5 sm:grid-cols-2">
            <Info label="E-mail">
              <a href={`mailto:${candidate.email}`} className="text-indigo-600 hover:underline">
                {candidate.email}
              </a>
            </Info>
            <Info label="Telefone">
              {candidate.phone ? (
                <a href={`tel:${candidate.phone.replace(/[^\d+]/g, '')}`} className="text-indigo-600 hover:underline">
                  {candidate.phone}
                </a>
              ) : (
                'Não informado'
              )}
            </Info>
            <Info label="Área ou cargo de interesse">{candidate.desiredRole ?? 'Não informado'}</Info>
            <Info label="Cadastrado em">{formatDate(candidate.createdAt)}</Info>
            <Info label="Resumo profissional" wide>
              <span className="whitespace-pre-line">{candidate.summary ?? 'Não informado'}</span>
            </Info>
          </dl>
        </article>
      )}

      <a href="#/novo" className="inline-block text-sm font-medium text-indigo-600 hover:underline">
        + Cadastrar outro candidato
      </a>
    </div>
  );
}

function Info({ label, wide, children }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{children}</dd>
    </div>
  );
}
