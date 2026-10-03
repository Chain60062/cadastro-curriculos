/** Erro vindo da API, com a mensagem pronta e, quando houver, os erros por campo. */
export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se o backend está em execução.', 0);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // Sem corpo JSON e erro 5xx: normalmente o proxy do Vite não alcançou o backend.
    const fallback =
      response.status >= 500
        ? 'Servidor indisponível. Verifique se o backend está em execução.'
        : `Erro inesperado (HTTP ${response.status}).`;
    throw new ApiError(body?.message ?? fallback, response.status, body?.errors);
  }

  return body;
}

export const api = {
  listCandidates: (search = '') => request(`/candidates${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getCandidate: (id) => request(`/candidates/${id}`),

  createCandidate: (data) =>
    request('/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  extractResume: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/resumes/extract', { method: 'POST', body: form });
  },
};
