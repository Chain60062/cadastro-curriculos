/** Erro de negócio com status HTTP e mensagem pronta para exibir ao usuário. */
export class AppError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
