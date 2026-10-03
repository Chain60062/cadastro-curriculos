import { useEffect, useState } from 'react';
import CandidateCreatePage from './pages/CandidateCreatePage.jsx';
import CandidateDetailPage from './pages/CandidateDetailPage.jsx';
import CandidateListPage from './pages/CandidateListPage.jsx';
import { navigate, useHashPath } from './lib/router.js';

export default function App() {
  const path = useHashPath();
  const [flash, setFlash] = useState(null); // mensagem de sucesso exibida na tela de detalhes após salvar

  useEffect(() => {
    window.scrollTo(0, 0);
    setFlash((current) => (current && current.path !== path ? null : current));
  }, [path]);

  function handleSaved(candidate) {
    const detailPath = `/candidatos/${candidate.id}`;
    setFlash({ path: detailPath, message: 'Candidato cadastrado com sucesso.' });
    navigate(detailPath);
  }

  const detailMatch = path.match(/^\/candidatos\/(\d+)$/);
  let page;
  if (path === '/') page = <CandidateListPage />;
  else if (path === '/novo') page = <CandidateCreatePage onSaved={handleSaved} />;
  else if (detailMatch) page = <CandidateDetailPage id={detailMatch[1]} flash={flash?.path === path ? flash.message : null} />;
  else page = <NotFound />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <a href="#/" className="text-lg font-semibold text-slate-900">
            Cadastro de Currículos
          </a>
          <nav className="flex gap-4 text-sm whitespace-nowrap">
            <a href="#/" className={path === '/' ? 'font-medium text-indigo-600' : 'text-slate-600 hover:text-slate-900'}>
              Candidatos
            </a>
            <a href="#/novo" className={path === '/novo' ? 'font-medium text-indigo-600' : 'text-slate-600 hover:text-slate-900'}>
              Novo cadastro
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{page}</main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
      <p className="text-slate-600">Página não encontrada.</p>
      <a href="#/" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
        Ir para a lista de candidatos
      </a>
    </div>
  );
}
