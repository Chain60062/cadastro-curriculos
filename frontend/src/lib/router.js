import { useSyncExternalStore } from 'react';

// Roteamento mínimo por hash (#/candidatos/1): sem bibliotecas e com o "voltar" do navegador funcionando.

function subscribe(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function getPath() {
  return window.location.hash.replace(/^#/, '') || '/';
}

export function useHashPath() {
  return useSyncExternalStore(subscribe, getPath);
}

export function navigate(path) {
  window.location.hash = path;
}
