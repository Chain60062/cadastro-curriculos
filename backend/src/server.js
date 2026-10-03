import { app } from './app.js';
import { prisma } from './lib/prisma.js';

const port = Number(process.env.PORT) || 3333;

const server = app.listen(port, (error) => {
  if (error) {
    console.error(`Não foi possível iniciar a API na porta ${port}:`, error.message);
    process.exit(1);
  }
  console.log(`API rodando em http://localhost:${port}`);
});

// Testa a conexão logo na subida para o problema aparecer no terminal, e não só na primeira requisição.
// A API continua de pé mesmo sem banco: a leitura de PDF não depende dele.
prisma
  .$connect()
  .then(() => console.log('Conectado ao SQL Server.'))
  .catch((error) => {
    console.error('Não foi possível conectar ao SQL Server. Verifique DATABASE_URL no arquivo .env.');
    console.error(error.message);
  });

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
