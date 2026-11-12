# Krakion App — Mapa de dependências e exclusão em cascata

Parte da documentação do Krakion App. Índice e "Retomar aqui": `docs/desktop.md`.

## Mapa de dependências (ícone próprio, 2026-10-20)

Plano: `docs/plans/2026-10-20-desktop-mapa-dependencias.md`. Nasceu do caso dos imóveis migrados errado (`biblioteca/_CONHECIMENTO/Imoveis/casos/`).
- **Termo:** o que se escolhe no topo é o **cadastro** (Imóvel, Pessoa…). "Entidade" no Betha é a prefeitura, por isso o termo não aparece na tela. **Alertas:** notas que começam com ⚠ no curado viram caixa vermelha ("Cuidado"), vínculo financeiro vira caixa âmbar, e o grupo Financeiro e os derivados ganham faixa colorida na coluna.
- **Tela** (`pages/Mapa/`): seletor de cadastro (as com mais dependentes primeiro: Pessoa 73, Imóvel 35, Dívida 34…), filtros Cadastro, Financeiro e Documentos e "só confirmados". Colunas: entidade → dependentes diretos agrupados → clicar num nó com ▸ abre os dependentes dele (nada abre sozinho, porque no nível 2 a inferência explode). Painel: status, "liga por", localização no menu, link da ajuda (das tags do Swagger), o que fazer, notas da prática, endpoints, body do DELETE, chamada da fonte BFC.
- **Motor** (`electron/mapaDependencias.js`, 9 testes, um deles com os dados reais): aresta = campo `id<Recurso>` no POST de outro recurso (singular, plural, composto); rótulo com acento do `summary`; categoria por nome; fonte BFC casando as letras do recurso com o path da fonte (sem `{params}`), indicando filtro em lote ou parâmetro. Parâmetro que não é o id do pai vira `semLigacao`.
- **Curado** (`biblioteca/FontesDeDados/dependencias_confirmadas.json`): vence a inferência e acrescenta arestas que ela não vê (histórico via `entityId`, inscrição imobiliária). Botão Recarregar relê os arquivos. **Ao confirmar algo novo na prática, registre ali.**
- Swagger `FontesDeDados/swagger/tributos-openapi.json` passou a ser versionado.
- **Scripts validados** (decisão do Felipe: na tela, só script que rodou de verdade, nada gerado sem teste): o cadastro lista os `scripts` do curado (nome, `principal` = selo "Use este" e primeiro da lista, arquivo, readme, validadoEm, descrição objetiva, sem narrar o caso), com Ver, Copiar e Como usar. O texto é lido da biblioteca pelo IPC `mapa:script` (`resolverDentro`, só `.txt`, `.groovy` ou `.md`). Imóvel: levantamento + varredura, validados em 2026-10-20.
- **Exclusão em cascata de imóveis** (`/mapa/exclusao`, botão "Analisar resultado →" no cartão do Levantamento; plano `docs/plans/2026-10-20-desktop-exclusao-cascata-imoveis.md`):
  - Entrada: o JSONL do levantamento, colado ou escolhido como arquivo (aceita linhas do console com a hora na frente; remove repetidos).
  - Análise: imóveis no arquivo, quantos entram no plano, com vínculo financeiro, para revisar (filho cuja exclusão não foi validada: corresponsáveis, testadas, englobados, benefícios) e não encontrados; quantidade por dependência.
  - Plano: só a receita validada. Proprietários → movimentações → reprocessar inscrição (PUT, só imóveis com a linha) → imóveis, em lotes de 50. **Lote vazio nunca é gerado** (teste).
  - Envio por etapa, com confirmação. A etapa seguinte só libera quando a anterior termina. Cada idLote é consultado sozinho (4 s, até 3 min; depois "Consultar pendentes"). O PUT fica "enviado", porque não devolve idLote. Etapa com erro fica âmbar e lista id + mensagem, com "Reenviar os N com erro".
  - O estado do envio fica só na tela. A fonte da verdade é rodar o levantamento de novo.
  - `src/lib/exclusaoImoveis.js` (5 testes) reaproveita `lerJsonl` (Checagem) e `interpretarEnvio`/`interpretarStatusLote` (lote da API). Validado num teste ponta a ponta com backend falso (120 imóveis + casos especiais).
- Próximo passo: gerar o levantamento a partir do mapa para outros cadastros, só depois de validar cada um.
