# Cadastro de Currículos

Aplicação web para cadastrar e consultar candidatos. O cadastro pode ser feito de duas formas, com o mesmo formulário e as mesmas regras de validação:

1. **Manual**: a pessoa preenche o formulário e salva, sem enviar documento.
2. **Com PDF**: a pessoa envia o currículo; o backend extrai o texto e tenta identificar **nome, e-mail, telefone, área/cargo e resumo** usando expressões regulares e heurísticas simples. Os dados encontrados preenchem o formulário e podem ser corrigidos antes de salvar.

Depois de salvo, o candidato aparece na listagem (com busca) e tem uma tela de detalhes.

## Tecnologias e versões

| Camada   | Tecnologia                                                                                  |
| -------- | ------------------------------------------------------------------------------------------- |
| Runtime  | Node.js 22.13 ou superior (22 LTS ou 24 LTS), ES modules                                    |
| Backend  | Express 5.2.1, Prisma ORM 6.19.3, Zod 4.6.5, Multer 2.4.0, pdfjs-dist 6.3.289               |
| Frontend | React 19.3.0, Vite 8.3.1, Tailwind CSS 4.3.3 (plugin `@tailwindcss/vite`)                   |
| Banco    | SQL Server (Express ou superior)                                                            |



## Estrutura

```
backend/
  prisma/schema.prisma              modelo Candidate
  prisma/migrations/                script SQL que cria a tabela
  src/app.js, src/server.js         configuração do Express
  src/routes/                       /api/candidates e /api/resumes
  src/schemas/candidate.schema.js   regras de validação (Zod), usadas nos dois tipos de cadastro
  src/middlewares/                  upload do PDF e tratamento de erros
  src/extraction/                   leitura do PDF (pdf.js) e extração com regex
frontend/
  src/pages/                        lista, novo cadastro e detalhes
  src/components/                   formulário, envio do PDF e alertas
  src/lib/                          cliente da API, roteamento por hash e formatação
```

## 1. Preparar o SQL Server

O Prisma se conecta ao SQL Server **apenas por TCP/IP**, protocolo que vem desabilitado no SQL Server Express:

1. Abra o **SQL Server Configuration Manager**.
2. Em *Configuração de Rede do SQL Server → Protocolos para &lt;SUA INSTÂNCIA&gt;*, habilite **TCP/IP**.
3. Em *Serviços do SQL Server*, reinicie o serviço **SQL Server (&lt;SUA INSTÂNCIA&gt;)** e inicie o **SQL Server Browser**, que localiza instâncias nomeadas como `localhost\SQLEXPRESS`.

Se não quiser usar o SQL Server Browser: nas propriedades do TCP/IP, aba *Endereços IP → IPAll*, defina **Porta TCP = 1433**, deixe *Portas TCP Dinâmicas* vazio, reinicie o serviço e use `localhost:1433` na conexão.

## 2. Backend

```bash
cd backend
cp .env.example .env      # no Windows (cmd): copy .env.example .env
npm install               # instala as dependências e gera o Prisma Client
npm run db:migrate        # cria o banco "curriculos" (se não existir) e a tabela Candidates
npm run dev               # API em http://localhost:3333
```

Caso o npm fale algo sobre aprovação de scripts rode:

```bash
npm install-scripts approve prisma@6.19.3
npm install-scripts approve @prisma/client@6.19.3
npm install-scripts approve @prisma/engines@6.19.3
```

A conexão fica em `DATABASE_URL`, no arquivo `.env`, no formato de URL do Prisma. Equivalência com a connection string do ADO.NET:

| ADO.NET                       | Prisma (`DATABASE_URL`)              |
| ----------------------------- | ------------------------------------ |
| `Server=.\SQLEXPRESS`         | `sqlserver://localhost\SQLEXPRESS`   |
| `Database=curriculos`         | `database=curriculos`                |
| `Trusted_Connection=True`     | `integratedSecurity=true`            |
| `TrustServerCertificate=True` | `trustServerCertificate=true`        |

Exemplo: `DATABASE_URL="sqlserver://localhost\SQLEXPRESS;database=curriculos;integratedSecurity=true;trustServerCertificate=true"`. O `.env.example` traz também as variações com porta fixa e com usuário/senha do SQL Server.

O script da estrutura está em `backend/prisma/migrations/20260930120000_init/migration.sql`. O `npm run db:migrate` (`prisma migrate deploy`) o aplica e registra a migration. Se preferir, o mesmo SQL pode ser executado manualmente no SSMS, dentro de um banco já criado.

Ao subir, a API informa no terminal se conseguiu conectar ao SQL Server.

## 3. Frontend

Com o backend rodando, em outro terminal:

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

O Vite repassa as chamadas `/api` para `http://localhost:3333`. Para usar outro endereço, crie `frontend/.env` a partir do `.env.example` e ajuste `API_PROXY_TARGET`.

Para gerar a versão de produção: `npm run build` e `npm run preview` (http://localhost:4173).

## API

| Método | Rota                        | Descrição                                                                 |
| ------ | --------------------------- | ------------------------------------------------------------------------- |
| GET    | `/api/health`               | Verifica se a API está no ar                                              |
| GET    | `/api/candidates?search=`   | Lista candidatos (mais recentes primeiro), com busca por nome, e-mail ou cargo |
| GET    | `/api/candidates/:id`       | Detalhes de um candidato                                                  |
| POST   | `/api/candidates`           | Cadastra um candidato (JSON)                                              |
| POST   | `/api/resumes/extract`      | Recebe um PDF (multipart, campo `file`) e devolve os dados encontrados. **Não salva nada.** |

Respostas de erro sempre trazem `{ message }` e, na validação, `{ errors: { campo: mensagem } }`:
`400` dados inválidos · `404` não encontrado · `409` e-mail já cadastrado · `413` arquivo acima de 5 MB · `415` arquivo que não é PDF · `422` PDF ilegível, protegido por senha ou sem texto · `503` banco indisponível.

## Regras de validação

- **Nome completo**: obrigatório, com nome e sobrenome, até 150 caracteres.
- **E-mail**: obrigatório, formato válido, até 254 caracteres, único no cadastro.
- **Telefone**: opcional; apenas números, espaços, `( ) + - .`; de 10 a 15 dígitos (com DDD).
- **Área/cargo**: opcional, até 120 caracteres. **Resumo**: opcional, até 4000 caracteres.
- **Arquivo**: somente PDF (tipo declarado + assinatura `%PDF-` no conteúdo), até 5 MB.

As regras ficam só no backend (`candidate.schema.js`); o frontend exibe as mensagens devolvidas em cada campo. Assim, o cadastro manual e o pré-preenchido pelo PDF passam exatamente pelas mesmas regras.

## Como a extração funciona

1. O **pdf.js** lê o texto das até 10 primeiras páginas. Os pedaços de texto são agrupados em linhas, guardando o tamanho da fonte de cada uma.
2. As expressões regulares ficam todas em `backend/src/extraction/patterns.js`:
   - **E-mail**: padrão `local@dominio.tld`, com correções para espaços em volta do `@` e texto grudado depois do domínio (`nome@gmail.comLinkedIn`).
   - **Telefone**: formatos brasileiros com ou sem `+55`, DDD com ou sem parênteses, separados por espaço, ponto, hífen ou nada. O DDD é conferido contra a lista de DDDs existentes; celular = 9 + 8 dígitos, fixo = 2 a 5 + 7 dígitos. CPF/CNPJ são removidos antes da busca. Números em linhas com "Tel/Celular/WhatsApp" têm prioridade; os demais aparecem como "Também encontrado no PDF". Números internacionais são aceitos quando começam com `+`.
   - **Nome**: primeiro procura um rótulo (`Nome: ...`). Se não houver, pontua as linhas do topo da 1ª página que têm "forma de nome" (2 a 6 palavras iniciadas por maiúscula, sem dígitos ou símbolos, sem palavras de seção, cargo ou endereço). A pontuação considera o tamanho da fonte, a posição e a semelhança com o e-mail.
   - **Área/cargo**: rótulos (`Objetivo:`, `Cargo pretendido:`), a seção "Objetivo" (inclusive frases como "Atuar como ..."), a linha de título logo abaixo do nome ou uma frase como "vaga de ..." no resumo.
   - **Resumo**: texto da seção "Resumo", "Sobre mim" ou "Perfil" até o próximo título de seção.
3. O que não é encontrado volta como `null`. No formulário, os campos preenchidos pelo PDF ficam destacados até serem editados, e é possível ver o texto extraído.

## Limitações

- **PDF escaneado (imagem)** não tem texto para extrair e não há OCR. A aplicação avisa e o cadastro segue manual.
- **Layouts em colunas ou tabelas** podem embaralhar a ordem das linhas e prejudicar a identificação do resumo e do cargo. E-mail e telefone são pouco afetados.
- **Nome** depende de heurística: nomes todo em minúsculas, com uma única palavra, ou uma linha como "Rio de Janeiro" no topo do documento podem gerar sugestão errada ou nenhuma.
- **Telefone** é voltado ao padrão brasileiro. Celulares antigos com 8 dígitos (sem o 9) não são reconhecidos, e internacionais só com `+` e código do país.
- **Cargo e resumo** dependem de títulos de seção conhecidos, em português ou inglês.
- O PDF não é armazenado; só os dados do formulário são salvos.

## Problemas comuns

- **`Can't reach database server` / P1001**: TCP/IP desabilitado, serviço SQL Server Browser parado ou nome da instância errado (veja a seção 1).
- **`Login failed`**: o usuário do Windows não tem acesso à instância; use um login SQL (`user=...;password=...`).
- **Erro no `npm install` do backend ao baixar o Prisma**: o `prisma generate` baixa o engine de `binaries.prisma.sh`; redes corporativas podem bloquear esse endereço.