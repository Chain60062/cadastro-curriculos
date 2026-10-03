import { useEffect, useState } from 'react';
import Alert from '../components/Alert.jsx';
import { api } from '../lib/api.js';
import { formatDate, SOURCE_LABELS } from '../lib/format.js';
import { navigate } from '../lib/router.js';

export default function CandidateListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: 'loading', candidates: [], error: null });

  useEffect(() => {
    let ignore = false;
    setState((current) => ({ ...current, status: 'loading' }));

    api.listCandidates(search).then(
      (candidates) => !ignore && setState({ status: 'ready', candidates, error: null }),
      (error) => !ignore && setState({ status: 'error', candidates: [], error: error.message }),
    );

    return () => {
      ignore = true;
    };
  }, [search, reloadKey]);

  function handleSearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Candidatos</h1>
          <p className="mt-1 text-sm text-slate-500">Cadastros mais recentes primeiro.</p>
        </div>
        <a href="#/novo" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
          Novo candidato
        </a>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nome, e-mail ou cargo"
          aria-label="Buscar candidatos"
          className="block w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
        <button type="submit" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
          Buscar
        </button>
      </form>

      {state.status === 'error' && (
        <Alert type="error">
          {state.error}{' '}
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-medium underline">
            Tentar novamente
          </button>
        </Alert>
      )}

      {state.status === 'loading' && <p className="text-sm text-slate-500">Carregando candidatos…</p>}

      {state.status === 'ready' && state.candidates.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {search ? (
            `Nenhum candidato encontrado para "${search}".`
          ) : (
            <>
              Nenhum candidato cadastrado ainda.{' '}
              <a href="#/novo" className="font-medium text-indigo-600 hover:underline">
                Cadastre o primeiro
              </a>
              .
            </>
          )}
        </div>
      )}

      {state.status === 'ready' && state.candidates.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="hidden px-4 py-3 md:table-cell">Telefone</th>
                <th className="hidden px-4 py-3 lg:table-cell">Área/cargo</th>
                <th className="hidden px-4 py-3 sm:table-cell">Origem</th>
                <th className="hidden px-4 py-3 sm:table-cell">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  onClick={() => navigate(`/candidatos/${candidate.id}`)}
                  className="cursor-pointer hover:bg-indigo-50/50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <a href={`#/candidatos/${candidate.id}`} className="hover:text-indigo-700">
                      {candidate.fullName}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{candidate.email}</td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{candidate.phone ?? '—'}</td>
                  <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{candidate.desiredRole ?? '—'}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {SOURCE_LABELS[candidate.source] ?? candidate.source}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 whitespace-nowrap text-slate-500 sm:table-cell">
                    {formatDate(candidate.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
