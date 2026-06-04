# Melhorias Estruturais — SysGate

Análise realizada em 2026-06-03 com base no estado atual do sistema.

---

## 1. Performance do bundle (prioridade alta)

**Problema:** O build produz um único arquivo JS de **905 KB** com todas as 12 páginas embutidas. O usuário que acessa o Dashboard baixa o código do AnalisadorJson (1.540 linhas), do Recharts (gráficos), do PapaParse (CSV parsing), etc — coisas que talvez nunca use.

**Arquivo afetado:** `frontend/src/App.jsx`

**Solução:** Code splitting com `React.lazy` + `Suspense`. Trocar as importações estáticas por dinâmicas faz o Vite gerar chunks separados por rota. Páginas pesadas como AnalisadorJson, Chamados (com Recharts), EnvioLote (com PapaParse) e Portfolio seriam baixadas sob demanda.

Além disso, configurar `manualChunks` no `frontend/vite.config.js` para isolar o Recharts (usado apenas em Chamados/Dashboard) num vendor chunk separado.

**Impacto estimado:** Bundle inicial cai de ~905 KB para ~300-400 KB. As páginas pesadas seriam carregadas em ~100-200 KB cada, só quando acessadas.

**Status:** Pendente

---

## 2. Assets estáticos — logos de 9.7 MB (prioridade alta)

**Problema:** O diretório `dist/` tem ~11 MB, mas **9.7 MB são duas imagens PNG**:
- `frontend/public/logo-com-nome.png` — 5.0 MB
- `frontend/public/logo-sem-nome.png` — 4.7 MB

Na UI são exibidos em `w-8 h-8` (32x32px) na sidebar e no máximo ~200px no login. As imagens estão em resolução original desnecessária.

**Solução:** Comprimir/redimensionar para ~500px de largura e converter para WebP. Resultado esperado: de 9.7 MB para <100 KB (redução de 99%).

**Status:** Pendente

---

## 3. Páginas monolíticas (prioridade média)

**Problema:** 4 arquivos somam 5.537 linhas — mais da metade de todo o frontend. Cada um contém múltiplos componentes e funções utilitárias que poderiam ser extraídos.

| Arquivo | Linhas | Componentes/funções internas |
|---------|--------|------------------------------|
| `frontend/src/pages/AnalisadorJson.jsx` | 1.540 | 19 (grafo, diff, tabela, busca, stats, highlight) |
| `frontend/src/pages/EnvioLote.jsx` | 1.435 | CSV parsing + batch logic + highlight + UI |
| `frontend/src/pages/Portfolio.jsx` | 1.398 | Accordion + 3 modais + cores verticais + M2M |
| `frontend/src/pages/Chamados.jsx` | 1.164 | CRUD + Dashboard Recharts + Histórico + comentários |

**Solução:** Extrair cada página grande em uma pasta com sub-componentes:

```
pages/
├── AnalisadorJson/
│   ├── index.jsx            (estado + layout principal)
│   ├── JsonGrafo.jsx        (grafo com pan/zoom)
│   ├── JsonTabela.jsx       (tabela com ordenação + CSV export)
│   ├── JsonNode.jsx         (árvore colapsável)
│   ├── DiffViewer.jsx       (comparador)
│   ├── BuscaResultados.jsx  (busca no JSON)
│   └── utils.js             (highlight, analyzeJson, buscaJson, diffJson)
├── Chamados/
│   ├── index.jsx
│   ├── ChamadosDashboard.jsx (gráficos Recharts)
│   ├── PainelHistorico.jsx
│   └── ModalChamado.jsx
├── Portfolio/
│   ├── index.jsx
│   ├── AccordionEntidade.jsx
│   ├── ModalGerenciarSistemas.jsx
│   └── ModalCatalogo.jsx
└── EnvioLote/
    ├── index.jsx
    ├── CsvPreview.jsx
    ├── BatchProgress.jsx
    └── utils.js             (construirBodyLinha, highlightJson)
```

As importações em `App.jsx` continuam iguais (`import X from './pages/AnalisadorJson'`) porque o bundler resolve `index.jsx` automaticamente. Zero breaking changes nas rotas.

**Status:** Pendente

---

## 4. Componentes compartilhados (prioridade média)

**Problema:** Atualmente existem apenas 5 componentes na pasta `frontend/src/components/` (Layout, Sidebar, PrivateRoute, MunicipioBadge, SearchSelect + SwaggerImport). Enquanto isso, várias páginas reimplementam padrões idênticos:

| Padrão duplicado | Onde aparece |
|------------------|-------------|
| Syntax highlight JSON | AnalisadorJson.jsx, EnvioLote.jsx |
| Modal de confirmação de exclusão | Municipios, Scripts, Chamados, Portfolio |
| Badges de método HTTP (GET=azul, POST=verde...) | Historico, ClienteAPI, EnvioLote |
| Toast/feedback de cópia | AnalisadorJson, ClienteAPI, EnvioLote |
| Tabela com header + scroll interno | Historico, Scripts, Usuarios |

**Solução:** Extrair para `frontend/src/components/`:

```
components/
├── ...existentes...
├── JsonHighlight.jsx        (syntax highlight reutilizável, dark + light)
├── ConfirmDialog.jsx        (modal de confirmação genérico)
├── MethodBadge.jsx          (badge colorido por método HTTP)
├── StatusBadge.jsx          (badge colorido por status code)
├── CopyButton.jsx           (botão com feedback "Copiado!" 2s)
└── Toast.jsx                (toast inline reutilizável)
```

**Status:** Pendente

---

## 5. Backend — dependência Twilio sem uso (prioridade baixa)

**Problema:** O `backend/package.json` declara `twilio@5.13.0` mas não há nenhum import ou uso no código das rotas ou middleware.

**Solução:** `npm uninstall twilio` no backend. Reduz tamanho do `node_modules`.

**Status:** Pendente

---

## 6. Backend — paginação ausente em listagens (prioridade baixa)

**Problema:** As rotas `GET /api/chamados`, `GET /api/portfolio` e `GET /api/scripts` retornam todos os registros sem paginação. Com poucos dados funciona, mas conforme o sistema cresce, as respostas ficam pesadas.

**Rotas afetadas:**
- `backend/src/routes/chamados.js` — GET /
- `backend/src/routes/portfolio.js` — GET /
- `backend/src/routes/scripts.js` — GET /

**Solução:** Implementar `?pagina=1&limite=50` com `skip`/`take` do Prisma. Retornar header ou campo `total` para o frontend montar paginação.

**Status:** Pendente

---

## 7. Backend — índices compostos no Prisma (prioridade baixa)

**Problema:** O schema Prisma (`backend/prisma/schema.prisma`) não declara `@@index` explícitos em campos frequentemente filtrados. SQLite cria índices automáticos para foreign keys, mas queries com filtros compostos (ex: chamados por status + data) não são otimizadas.

**Índices sugeridos:**

```prisma
model Chamado {
  // ...campos existentes...
  @@index([status, criadoEm])
  @@index([responsavelId])
  @@index([vertical])
}

model Requisicao {
  // ...campos existentes...
  @@index([municipioId, criadoEm])
}

model Script {
  // ...campos existentes...
  @@index([categoria])
}
```

**Status:** Pendente

---

## 8. Backend — armazenamento base64 para anexos (prioridade futura)

**Problema:** `ChamadoAnexo.conteudo` e `Relatorio.jxrmlConteudo` armazenam arquivos como strings base64 no SQLite. Base64 aumenta o tamanho em ~33% sobre o original. Para o uso atual (anexos pequenos, relatórios JRXML) funciona, mas se o volume crescer o banco fica pesado.

**Solução futura:** Se surgir necessidade de anexos maiores (>5 MB), mover para filesystem local (`uploads/`) ou S3, armazenando apenas o path no banco.

**Status:** Monitorar

---

## 9. Documentação — CLAUDE.md monolítico (prioridade futura)

**Problema:** O `CLAUDE.md` tem ~600 linhas documentando stack, rotas, segurança, padrões visuais, módulos e deploy num único arquivo. Conforme o sistema cresce, fica difícil navegar.

**Solução:** Manter o `CLAUDE.md` como índice resumido (~150 linhas: stack, comandos, estrutura de diretórios, credenciais) e mover seções detalhadas:

```
CLAUDE.md                              (resumo + índice com links)
skills/
├── backend.md                         (rotas API, segurança, proxy)
├── frontend.md                        (componentes, stores, padrões visuais)
├── banco-de-dados.md                  (schema, relações, migrations)
├── deploy.md                          (VPS, nginx, PM2, túnel SSH — extrair do CLAUDE.md)
├── fluxos.md
├── swagger-parser.md
└── superpowers/
docs/
├── melhorias-estruturais.md           (este arquivo)
├── historico.md
├── cliente-api.md
├── envio-lote.md
├── analisador-json.md                 (extrair do CLAUDE.md)
├── chamados.md                        (extrair do CLAUDE.md)
└── portfolio.md                       (extrair do CLAUDE.md)
```

**Status:** Pendente

---

## Ordem de execução recomendada

A ordem **não é indiferente** — há dependências entre os itens:

### Dependências críticas

- **Item 3 deve vir antes do item 4:** Extrair sub-componentes das páginas grandes primeiro revela naturalmente o que está duplicado entre elas. Criar componentes compartilhados "no escuro" (antes da extração) é trabalhar sem o quadro completo.

- **Itens 1 e 3 se beneficiam juntos:** Code splitting e extração de sub-componentes se reforçam — o Vite gera chunks menores quando os arquivos já estão menores. Não há bloqueio técnico entre eles, mas idealmente caminham juntos.

- **Item 6 (paginação) afeta backend e frontend simultaneamente:** Diferente dos outros itens de backend, paginação exige mudança nas rotas e nas páginas de listagem. Deve ser planejado e executado em par.

### Itens completamente independentes (qualquer momento)

- Item 2 — comprimir logos
- Item 5 — remover Twilio
- Item 7 — índices Prisma
- Item 9 — reorganizar CLAUDE.md

### Sequência sugerida

```
Etapa 1 — Impacto imediato, esforço mínimo
  → Item 2: comprimir logos PNG

Etapa 2 — Performance do frontend
  → Item 1 + Item 3 juntos: code splitting + extração de sub-componentes

Etapa 3 — Qualidade de código
  → Item 4: componentes compartilhados (aproveita o trabalho do item 3)

Etapa 4 — Limpeza de backend (qualquer ordem entre si)
  → Item 5: remover Twilio
  → Item 7: índices Prisma

Etapa 5 — Escalabilidade
  → Item 6: paginação (backend + frontend juntos)

Futuro
  → Item 8: armazenamento de anexos fora do SQLite
  → Item 9: reorganizar CLAUDE.md
```

---

## Resumo de prioridades

| # | Melhoria | Esforço | Impacto | Prioridade | Depende de |
|---|----------|---------|---------|------------|------------|
| 2 | Comprimir logos PNG → WebP | Mínimo | Dist -9.7 MB | Alta | — |
| 1 | Code splitting (React.lazy) | Baixo | Bundle inicial -50% | Alta | — |
| 3 | Extrair sub-componentes das páginas grandes | Médio | Manutenibilidade | Média | — |
| 4 | Componentes compartilhados (highlight, badges, modais) | Médio | Consistência | Média | Item 3 |
| 5 | Remover Twilio não utilizado | Mínimo | Limpeza | Baixa | — |
| 7 | Índices compostos no Prisma | Mínimo | Performance de queries | Baixa | — |
| 6 | Paginação nas rotas de listagem | Baixo | Escalabilidade | Baixa | Backend + Frontend juntos |
| 8 | Armazenamento de anexos fora do SQLite | Alto | Escalabilidade | Futura | — |
| 9 | Reorganizar CLAUDE.md em arquivos menores | Médio | Navegabilidade | Futura | — |

---

## Métricas atuais (baseline)

| Métrica | Valor |
|---------|-------|
| Frontend — páginas JSX | 12 arquivos, 9.901 linhas |
| Frontend — componentes compartilhados | 5 arquivos, 837 linhas |
| Frontend — bundle JS (dist) | 905 KB (arquivo único) |
| Frontend — bundle CSS (dist) | 467 KB |
| Frontend — logos PNG (dist) | 9.7 MB |
| Frontend — dist total | ~11 MB |
| Backend — rotas | 12 arquivos, 2.710 linhas |
| Backend — modelos Prisma | 20 modelos |
| Backend — endpoints API | 50+ distintos |
| Total de código fonte | ~13.929 linhas em 38 arquivos |
