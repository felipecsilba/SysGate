# Plano: Mapa de dependências (Krakion App)

**Goal:** tela visual que mostra, para uma entidade da API Betha (Imóvel, Contribuinte, Econômico…), quem depende dela,
como excluir cada dependente (endpoints) e como descobri-lo (fonte BFC). Nasceu do caso dos ~3.000 imóveis migrados
errado (`biblioteca/_CONHECIMENTO/Imoveis/casos/Excluir imovel por API (migrado errado).md`).

**Decisões (brainstorming de 2026-10-20):**
- Ícone próprio no Rail ("Mapa de dependências"), entre o Gerador e Configurações.
- Visual em **colunas que se expandem ao clicar**: entidade → dependentes diretos, agrupados em Cadastro, Financeiro 💰,
  Documentos e Outros → clicar num nó abre os dependentes dele. Nada abre sozinho: no nível 2 a inferência explode
  (só a dívida tem ~40 dependentes).
- Painel de detalhe: endpoints (body do DELETE pronto), fonte BFC (nome, filtro/parâmetro), notas da prática, status.
- **Inferido × confirmado:** a inferência vem do Swagger (campo `id<Recurso>` no POST de outro recurso) e do catálogo
  de fontes. O arquivo curado `biblioteca/FontesDeDados/dependencias_confirmadas.json` sempre vence, acrescenta arestas
  que a inferência não vê (histórico via `entityId`) e traz as notas. Validação no Swagger real: nível 1 do imóvel
  tem 33 dependentes, todos os confirmados aparecem.
- Swagger (`FontesDeDados/swagger/tributos-openapi.json`, 5,6 MB, público) passa a ser versionado.
- Fora: gerar o levantamento a partir do mapa e executar a exclusão em cascata (próximas etapas).

**Architecture:**
- `electron/mapaDependencias.js` (puro + leitura de arquivos, testado): `extrairRecursos(swagger)`, `alvoDoCampo`,
  `indexarDependentes`, `categoria`, `rotuloDoRecurso` (do summary do Swagger, com acento), `corpoDelete`,
  `fonteDoRecurso(nome, catalogo, mapaBfc)` e `criarMapa({ swagger, catalogo, mapaBfc, curado })` →
  `{ entidades(), dependentes(nome) }`. A leitura dos arquivos é lazy e fica em cache no main.
- IPC `mapa:entidades` / `mapa:dependentes` + `window.krakion.mapa`.
- `src/lib/mapa.js` (puro, testado): `agruparPorCategoria`, `legenda`.
- `src/pages/Mapa/`: seletor de entidade, filtros, colunas, painel.
