# Histórico — Documentação da Tela

**Arquivo:** `frontend/src/pages/Historico.jsx`

---

## Visão Geral

A tela **Histórico** exibe uma tabela paginável com todas as requisições executadas pelo sistema — tanto pelo **Cliente API** (tipo `individual`) quanto pelo **Envio em Lote** (tipo `lote`). Permite filtrar, consultar e limpar o registro de chamadas.

---

## Layout Geral

Tela de largura total com três seções verticais:

1. **Cabeçalho** — título, contador de registros, botões Atualizar e Limpar
2. **Filtros** — selects de Município, Sistema, Tipo e Método
3. **Tabela** — lista de requisições com scroll interno

---

## Colunas da Tabela

| Coluna | Campo no banco | Descrição |
|--------|---------------|-----------|
| Data/Hora | `criadoEm` | Formato `DD/MM/AAAA HH:MM:SS` |
| Município | `municipio.nome` | Nome do município vinculado |
| Sistema | `sistema.nome` | Nome do sistema utilizado |
| Endpoint | `endpoint.modulo` + `endpoint.nome` | Módulo em cinza pequeno + nome em negrito. Exibe a URL completa se não houver endpoint |
| Método | `metodo` | Badge colorido: GET=azul, POST=verde, PUT=amarelo, PATCH=laranja, DELETE=vermelho |
| Status | `statusCode` | Badge colorido: 2xx=verde, 4xx=amarelo, 5xx=vermelho |
| ID Gerado | `idGerado` | ID retornado pela API na resposta (campo `id`, `idGerado` ou `idEconomico`). Badge azul sysgate |
| Tipo | `tipo` | `⚡ Individual` (sysgate) ou `📦 Lote` (índigo) |
| Duração | `duracaoMs` | Tempo de resposta em milissegundos |

---

## Filtros

Todos os filtros são cumulativos (AND) e disparam nova busca automaticamente ao mudar:

| Filtro | Campo enviado | Descrição |
|--------|--------------|-----------|
| Município | `municipioId` | Filtra por município específico |
| Sistema | `sistemaId` | Filtra por sistema específico |
| Tipo | `tipo` | `"individual"` ou `"lote"` |
| Método | — (client-side) | Filtra por método HTTP após receber os dados |

---

## Comportamento do ID Gerado

O backend tenta extrair o `idGerado` da resposta da API na seguinte ordem:

1. `resposta.id`
2. `resposta.idGerado`
3. `resposta.idEconomico`
4. `null` (se nenhum encontrado)

O valor é armazenado como `String?` no banco. Para requisições com erro (status ≠ 2xx) ou métodos que não retornam entidade (GET, DELETE), `idGerado` fica `null`.

---

## Tipo de Requisição

| Valor | Origem | Visual |
|-------|--------|--------|
| `individual` | Cliente API | Badge `⚡ Individual` azul sysgate |
| `lote` | Envio em Lote | Badge `📦 Lote` índigo |

O campo `tipo` é enviado automaticamente pelo frontend no body do `POST /api/proxy/executar` — não requer configuração manual.

---

## Limpeza do Histórico

- Botão **Limpar histórico** exibe confirmação inline antes de agir
- A limpeza respeita o filtro de município ativo: se um município estiver selecionado no filtro, remove apenas os registros dele; se não, remove todos
- Após limpar, a tabela é recarregada automaticamente

---

## Limites e Performance

- **HISTORICO_MAX** = 200 por município (definido em `backend/src/routes/proxy.js`)
- O backend mantém automaticamente apenas os últimos 200 registros por município, removendo os mais antigos a cada nova requisição
- A API aceita `limite` de 1 até 500; o frontend solicita `limite=500`

---

## API utilizada

```js
requisicoesApi.listar({ municipioId?, sistemaId?, tipo?, limite? })
requisicoesApi.limpar(municipioId?)
```

Definidas em `frontend/src/lib/api.js`. O backend correspondente está em `backend/src/routes/requisicoes.js`.

---

## Estado React (principais)

| State | Tipo | Descrição |
|-------|------|-----------|
| `requisicoes` | array | Lista de requisições retornadas pela API |
| `carregando` | boolean | Flag de carregamento |
| `municipios` | array | Lista para popular o filtro de município |
| `sistemas` | array | Lista para popular o filtro de sistema |
| `filtroMunicipio` | string | ID do município selecionado no filtro |
| `filtroSistema` | string | ID do sistema selecionado no filtro |
| `filtroTipo` | string | `""`, `"individual"` ou `"lote"` |
| `filtroMetodo` | string | `""`, `"GET"`, `"POST"`, etc. |
| `confirmLimpar` | boolean | Controla exibição da confirmação de limpeza |

---

## Schema do banco (modelo Requisicao)

```prisma
model Requisicao {
  id          Int        @id @default(autoincrement())
  municipioId Int
  sistemaId   Int?       // referência direta ao Sistema
  endpointId  Int?
  metodo      String
  url         String
  headers     String?    // JSON serializado
  body        String?    // JSON serializado
  statusCode  Int?
  resposta    String?    // JSON serializado
  duracaoMs   Int?
  tipo        String?    // "individual" | "lote"
  idGerado    String?    // ID extraído da resposta da API
  criadoEm   DateTime   @default(now())
  municipio   Municipio  @relation(...)
  sistema     Sistema?   @relation(...)
  endpoint    Endpoint?  @relation(...)
}
```

> `sistemaId` é armazenado diretamente na `Requisicao` (além de via `endpoint.sistemaId`) para garantir que o sistema seja rastreável mesmo quando o endpoint não estiver vinculado ou for removido.
