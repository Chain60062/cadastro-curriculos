# Início e esboço do projeto

Inicialmente, tive minhas dúvidas sobre como resolver o problema central do sistema: a classificação de texto. A parte de limpeza e extração foi mais simples, pois sabia que existiriam bibliotecas e técnicas para extração de texto de um PDF, que, por ser um formato bem conhecido e com texto bruto, não precisaria passar por uma etapa de extração ou uma pipeline de ETL complexa com uso de OCR. Tendo isso em mente, comecei a levantar possibilidades. A primeira foi a utilização de algoritmos de *machine learning*; um em especial veio à mente: Naive Bayes. Considerei o NB inicialmente, pois já utilizei ele (e algumas de suas variantes, como o MultinomialNB) em tarefas simples de classificação de texto e obtive resultados satisfatórios, mesmo com um treinamento em um corpo de texto relativamente pequeno.

Pesquisando mais a fundo sobre classificação de texto e extração de informação, percebi que, talvez, para a tarefa atual, o uso de regras de REGEX poderia ser a solução mais simples, mas, ao mesmo tempo, a mais eficiente, sem a necessidade de treinar um modelo, fazer *deploy* e servir ele para o *backend*. Foi considerada, durante o esboço da solução, a criação de dois modos: um modo "performance", com pouca acurácia, utilizando expressões regulares e regras básicas (como os formatos comuns de um número de telefone brasileiro, o fato de nomes serem, na maioria das vezes, a primeira informação que um currículo apresenta, resumos profissionais conterem certas palavras-chave, etc.), e um modo "precisão", com o uso de um modelo de ML, uma LLM ou soluções de PNL um pouco mais rebuscadas.

---

## LLMs
Tendo em mente que considerei o uso de uma LLM, logo surgiram problemas com esta solução: uma LLM, apesar de acurada, é intensiva computacionalmente, e rodar um modelo de 7 bilhões ou 8 bilhões de parâmetros não seria ideal para uma tarefa como classificação de texto. 

---

## SMLs?
O uso das Small Language Models (SMLs), como o Qwen3.5-0.8B, também foi considerado. Mas descartado, pois não estava seguro de sua eficácia em comparação com outras possíveis soluções.

Um ponto importante é que, LLMs e SLMs, apesar de serem ótimas para classificação de texto, são modelos generativos e, como a tarefa não requer geração de resumos ou algo do tipo, não utilizaríamos um aspecto central das LLMs modernas: o fato de serem *decoder-only*, em resumo, geradores de texto novo, e não apenas modelos de compreensão. Outro problema seria o *deploy* do modelo para fins demonstrativos.

Tendo descartado o uso de LLMs, eu busquei compreender as possíveis soluções de processamento natural de linguagem. Utilizei o mecanismo de busca do Google, ChatGPT e o livro *Natural Language Processing in Action, Second Edition* (Lane; Dyshel, 2025) para minha pesquisa. Logo descobri o conceito de *Named Entity Recognition* (NER):

> O Named Entity Recognition (NER) — também chamado de fragmentação de entidades ou extração de entidades — é um componente do processamento de linguagem natural (NLP) que identifica categorias predefinidas de objetos em um corpo de texto. (IBM, [s.d.])

O que soava com a tarefa dada. O livro acrescenta:

> Now that you know what you are up against, you are ready to tackle this difficult challenge. Deep problems call for deep learning! But don’t believe the hype about LLMs. You cannot achieve commonsense reasoning with a purely generative model, like ChatGPT. Rather than large language models, you will be able to achieve better results using significantly smaller and more efficient transformer-based language models, such as RoBERTa, combined with conventional linguistics algorithms and logic within the spaCy package. (Lane; Dyshel, 2025)

Tradução:

> Agora que você sabe o que tem pela frente, está pronto para enfrentar esse desafio complexo. Problemas profundos exigem aprendizado profundo! Mas não se deixe levar pelo *hype* em torno das LLMs. Não é possível obter raciocínio baseado no senso comum com um modelo puramente generativo, como o ChatGPT. Em vez de grandes modelos de linguagem, você obterá melhores resultados utilizando modelos de linguagem baseados em *transformers* significativamente menores e mais eficientes — como o RoBERTa — combinados com algoritmos linguísticos convencionais e lógica do pacote spaCy. (Lane; Dyshel, 2025, tradução via google translate)

Então, havia algum fundamento em ter abandonado a ideia de utilizar uma LLM. O próximo passo foi entender os possíveis modelos de linguagem disponíveis, e as possibilidades são diversas, mas duas chamaram a atenção: ModernBERT e DeBERTaV3. Pesquisando sobre, descobri rapidamente que estes modelos de linguagem *encoder-only* (que são IAs não generativas, servem apenas para tarefas de *natural language understanding*, ou NLU, o que é justamente o nosso caso) são treinados com dados como a Wikipedia anglófona e corpos de texto majoritariamente em inglês. Claramente seria um grande problema ao utilizar currículos em português brasileiro, mas, para a minha sorte, existem modelos semelhantes pré-treinados em múltiplos idiomas e, especificamente, em português brasileiro, como o ModBERTBr, DeBERTinha e o NorBERTo, este último sendo desenvolvido por uma iniciativa do banco Itaú.

Fui avisado pelo ChatGPT sobre ter de realizar *fine-tuning* com os modelos citados, já que modelos encoder-only pré-treinados não fazem NER de fábrica: é preciso treinar uma camada de classificação de tokens com dados rotulados, o que adiciona uma complexidade para sua utilização como solução.

Por fim, acabei por optar pela utilização apenas de regras de REGEX para a classificação de texto. Acredito que o resultado foi satisfatório, principalmente ao classificar informações com formatos claros e repetitivos, como e-mail e número de telefone.

---

# Desenvolvimento

A escolha das bibliotecas e tecnologias foi feita, principalmente, levando em consideração familiaridade com as tecnologias e facilidade de desenvolvimento para uma entrega rápida. Tendo isso em mente, já tinha tido contato, mesmo que breve, com todas as bibliotecas utilizadas, com a exceção do pdfjs. O uso de python também foi considerado por conta das bibliotecas necessárias para algumas das soluções levantadas, mas no fim preferi utilizar apenas o node.js.

O projeto teve duas etapas: o esboço e desenvolvimento. Durante o esboço, foram levantadas as possíveis formas de realizar o projeto; o desenvolvimento em si foi, em grande parte, realizado utilizando o Claude Opus 5.5, com nível de esforço extra.

### Por que Prisma 6 e não um mais recente como o 7 ou o 8?
 No Prisma 7 a conexão com o SQL Server passa pelo driver `@prisma/adapter-mssql` (baseado no `tedious`), que não aceita autenticação do Windows (`Trusted_Connection`). O Prisma 6 aceita `integratedSecurity=true`, o que permite usar o SQL Server local sem criar login e senha. O prisma 8 está em early access, e não tem suporte para alguns bancos de dados, como o SQL Server.

Referências:
- https://github.com/prisma/orm/issues/29148
- https://www.prisma.io/docs/orm
---

# Desafios

Ao instalar o SQL Server Express, eu esbarrei no seguinte problema: o SQL Server possui apenas suporte oficial para discos com setores de 4 KB no máximo. Meu SSD NVMe aparenta possuir tamanho dos setores incompatível com o SQL Server 2025; por isso, a instalação local (sem uso de Docker) falhou 4 vezes enquanto eu tentava encontrar qual era o erro, deixando resquícios de instalações falhas anteriores, que me afetaram no futuro ao tentar habilitar conexões TCP/IP no SQL Server. Uma thread no portal da Microsoft e um post no Reddit continham a solução: alterar o registro do Windows 11 para que o SQL Server acreditasse que estava em um disco de 4 KB de tamanho de setor.

Ao rodar `prisma db:migrate`, eu encontrei um erro:

> The datasource provider `mssql` specified in your schema does not match the one specified in the migration_lock.toml, `sqlserver`. Please remove your current migration directory and start a new migration history with prisma migrate dev. Read more: https://pris.ly/d/migrate-provider-switch

Em resumo, a IA criou um arquivo manualmente que deveria ter sido criado pelo próprio Prisma; por isso, os valores do datasource `sqlserver` e `provider = "mssql"` no `migration_lock.toml` não batiam, pois, na versão 6, os nomes são destoantes, enquanto, em versões posteriores, eles são iguais. Talvez um indicativo explícito de qual versão específica o Claude deveria utilizar poderia ter evitado este erro.

---

# Tempo Estimado
O tempo total não foi contabilizado, mas julgo que algo em torno de 7 - 10 horas foram dedicadas para pesquisa, desenvolvimento,documentação, testes e revisão. Tendo a pesquisa levado grande parte do tempo total do projeto, problemas técnicos também podem ter contabilizado por cerca de 1 - 2 horas do total.

---

# Resultados

Foram realizados testes com currículos de exemplo. Nos meus testes, currículos comuns em formatos mais simples foram os que obtiveram maior taxa de sucesso, enquanto currículos com imagens, layouts complexos com estilização elaborada e formatos não convencionais foram onde o sistema, compreensivelmente, enfrentou maiores dificuldades para extrair/classificar as informações corretamente.

---

# Melhorias e Considerações Finais
Com maiores recursos e tempo para dedicar a atividade, o caminho para melhorias mais óbvio seria implementar e comparar algumas soluções levantadas, incluindo as descartadas, realizando assim um comparativo justo e preciso. Além de validar e pesquisar mais sobre as vantagens, desvantagens e comparativos de SMLs com modelos da *encoder-only* para verificar a solução ideal para este caso.

Vale ressaltar que parte da pesquisa completa que envolve estudos de comparativos entre modelos e limitações de redes neurais não constará no documento, por questões de irrelevância para a solução final, apenas nas referências.

Além disso, é importante enfatizar que não sou um especialista de Machine Learning, e que, a parte técnica levantada aqui pode conter detalhes incorretos ou desatualizados. 

Apesar de ter dedicado um tempo para me certificar de que a parte técnica estaria o mais atualizada possível, levando em consideração a data de 03/10/2026, e que estaria factualmente correta, tenho de reconhecer que meu conhecimento em processamento natural de linguagem é limitado, e também reconheço que podem existir caminhos e detalhes que não foram abordados neste documento, pois vão além do meu conhecimento atual, dito isto, me sinto satisfeito com os resultados, pesquisa e solução implantada neste pequeno projeto.

---

# Exemplos de Prompts Usados

>Olá, preciso que você assuma o papel de um desenvolvedor com experiência em processamento natural de linguagem e machine learning. Estou participando de um processo seletivo no qual preciso passar por uma etapa técnica, o exato email recebido foi o seguinte:
-- Email do teste técnico inteiro -- 
>Eu sou um programador, possuindo um conhecimento limitado em NLP e machine learning, além disso, esta empresa não possui acesso ao ollama(é bloqueado) e possui máquinas fracas(apesar de possuírem ssds e 16gb de ram), notebooks com placas de vídeo integradas. Pensando um pouco sobre como resolver de maneira satisfatória o desafio, cheguei ao seguinte esboço:
>Solução proposta
A solução consiste em uma aplicação web para extração automática de informações de currículos em formato PDF, utilizando uma arquitetura híbrida com dois modos de processamento.
No modo Performance, a aplicação utiliza técnicas determinísticas, como expressões regulares, heurísticas e análise da estrutura do documento, permitindo extrair informações como nome, e-mail, telefone, datas e links com baixo consumo de recursos e processamento rápido.
No modo Precisão, o texto extraído do PDF é encaminhado para um serviço independente desenvolvido em Python/FastAPI, responsável pelo processamento de linguagem natural utilizando o BERTimbau, modelo baseado em BERT especializado em português. O modelo realiza a identificação de entidades relevantes no currículo, como pessoas, organizações, datas, cargos e outras informações, que posteriormente são combinadas e normalizadas pelo backend.
A arquitetura será composta por:
>React: interface para envio dos currículos e apresentação das informações extraídas.
>Node.js: API principal, responsável pelo recebimento dos PDFs, extração inicial do texto, processamento determinístico e integração com o serviço de NLP.
>FastAPI + BERTimbau: serviço especializado em processamento de linguagem natural utilizado no modo de maior precisão.
>Processamento local: a solução não depende de APIs de IA comerciais ou serviços de LLM em nuvem, permitindo que os documentos permaneçam localmente na infraestrutura utilizada.
>O resultado dos dois modos será convertido para uma estrutura JSON padronizada, permitindo que o restante da aplicação trabalhe de maneira independente da técnica utilizada para realizar a extração.
>Essa abordagem busca equilibrar desempenho, consumo de recursos e qualidade da extração, possibilitando utilizar técnicas simples para processamento rápido e técnicas de NLP mais sofisticadas quando uma maior capacidade de interpretação do conteúdo do currículo for necessária.
>
>O que você acha desta solução, tendo em mente todo o contexto da tarefa?

---

### Fundamentos de PLN e Transformers

BERT (modelo de linguagem). *In*: WIKIPÉDIA: a enciclopédia livre. Disponível em: https://pt.wikipedia.org/wiki/BERT_(modelo_de_linguagem). Acesso em: 3 out. 2026.

IBM. **O que é named entity recognition (NER)?** [s.d.]. Disponível em: https://www.ibm.com/br-pt/think/topics/named-entity-recognition. Acesso em: 3 out. 2026.

LANE, Hobson; DYSHEL, Maria. **Natural Language Processing in Action**. 2. ed. Shelter Island: Manning, 2025.

STRYKER, Cole; BERGMANN, Dave. **What is a transformer model?** IBM, 28 mar. 2025. Disponível em: https://www.ibm.com/think/topics/transformer-model. Acesso em: 3 out. 2026.

### RNN e LSTM

CANARY, Jim. **Recurrent Neural Networks (RNNs) and LSTMs**. Medium, 26 jan. 2025. Disponível em: https://medium.com/@jimcanary/recurrent-neural-networks-rnns-and-lstms-d54d0073843e. Acesso em: 3 out. 2026.

LONG short-term memory. *In*: WIKIPÉDIA: a enciclopédia livre. Disponível em: https://pt.wikipedia.org/wiki/Long_short-term_memory. Acesso em: 3 out. 2026.

TUYCHIEV, Bex. **Modelos LSTM**: um guia completo sobre redes de memória de longo e curto prazo. DataCamp, 17 set. 2026. Disponível em: https://www.datacamp.com/pt/tutorial/lstm-models. Acesso em: 3 out. 2026.

### Modelos *encoder-only* (ModernBERT e DeBERTaV3)

ANTOUN, Wissam; SAGOT, Benoît; SEDDAH, Djamé. **ModernBERT or DeBERTaV3?** Examining architecture and data influence on transformer encoder models performance. arXiv, 2025. Disponível em: https://huggingface.co/papers/2504.08716. Acesso em: 3 out. 2026.

HUGGING FACE. **ModernBERT**. Documentação da biblioteca Transformers, 2024. Disponível em: https://huggingface.co/docs/transformers/model_doc/modernbert. Acesso em: 3 out. 2026.

### Modelos *encoder-only* em português brasileiro

CAMPIOTTI, Israel *et al.* **DeBERTinha**: a multistep approach to adapt DebertaV3 XSmall for Brazilian Portuguese natural language processing task. arXiv, 2023. Disponível em: https://arxiv.org/abs/2309.16844. Acesso em: 3 out. 2026.

SILVA, Enzo S. N. *et al.* NorBERTo: a ModernBERT model trained for Portuguese with 331 billion tokens corpus. *In*: INTERNATIONAL CONFERENCE ON COMPUTATIONAL PROCESSING OF PORTUGUESE (PROPOR), 17., 2026, Salvador. **Proceedings** [...]. Association for Computational Linguistics, 2026. p. 183-193. Modelo disponível em: https://huggingface.co/Itau-Unibanco/NorBERTo-base. Acesso em: 3 out. 2026.

SOUZA, Fábio; NOGUEIRA, Rodrigo; LOTUFO, Roberto. BERTimbau: pretrained BERT models for Brazilian Portuguese. *In*: BRAZILIAN CONFERENCE ON INTELLIGENT SYSTEMS (BRACIS), 9., 2020, Rio Grande. **Proceedings** [...]. 2020. Modelo disponível em: https://huggingface.co/neuralmind/bert-base-portuguese-cased. Acesso em: 3 out. 2026.

WU, Wallace Ben Teng Lin; GARCIA, Luis Paulo Faina. ModBERTBr: a ModernBERT-based model for Brazilian Portuguese. *In*: ENCONTRO NACIONAL DE INTELIGÊNCIA ARTIFICIAL E COMPUTACIONAL (ENIAC), 22., 2025, Fortaleza. **Anais** [...]. Porto Alegre: Sociedade Brasileira de Computação, 2025. p. 2044-2055. DOI: 10.5753/eniac.2025.14516. Disponível em: https://sol.sbc.org.br/index.php/eniac/article/view/38875. Modelo disponível em: https://huggingface.co/wallacelw/ModBERTBr. Acesso em: 3 out. 2026.

### Modelos generativos compactos (LLMs)

GOOGLE DEEPMIND. **Gemma 4 E2B-it**. Hugging Face, 2026. Disponível em: https://huggingface.co/google/gemma-4-E2B-it. Acesso em: 3 out. 2026.

QWEN TEAM. **Qwen3.5-0.8B**. Hugging Face, 2026. Disponível em: https://huggingface.co/Qwen/Qwen3.5-0.8B. Acesso em: 3 out. 2026.