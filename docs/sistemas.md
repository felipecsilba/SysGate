# Sistemas — Documentação da Tela

**Arquivo:** `frontend/src/pages/Sistemas.jsx`

---

## Visão Geral

A tela **Sistemas** gerencia os sistemas Betha disponíveis para uso no Sandbox e no Envio em Lote. Cada sistema possui uma URL base e uma coleção de endpoints importados via Swagger ou cadastrados manualmente. Os dados são **globais** (todos os usuários veem os mesmos sistemas) — a escrita é restrita a admins.

---

## Permissões

| Ação | Quem pode |
|------|-----------|
| Visualizar sistemas e endpoints | Qualquer usuário autenticado |
| Criar / editar / excluir sistema | Somente admin |
| Importar Swagger, editar endpoint | Somente admin |

O estado `isAdmin` é derivado de `useAuthStore` — botões e ações de escrita ficam ocultos para não-admins.

---

## Layout Geral

Tela dividida em dois painéis:

| Painel | Conteúdo |
|--------|----------|
| **Lista** (esquerda) | Tabela de sistemas com busca e ações inline |
| **Painel detalhe** (direita) | 3 abas do sistema selecionado — abre ao clicar na linha |

---

## Lista de Sistemas

### Colunas

| Coluna | Descrição |
|--------|-----------|
| Nome | Nome do sistema |
| URL Base | URL raiz da API (sem `/api` no final) |
| Endpoints | Contagem de endpoints importados |
| Specs | Contagem de specs Swagger vinculadas |
| Ações | Editar, excluir (somente admin) |

---

## Painel Detalhe — 3 Abas

### Aba Informações

Exibe stats do sistema:
- Total de endpoints, total de specs, data de criação
- Botão **Editar sistema** (admin) — modal inline com nome e URL base
- Botão **Importar Swagger** (admin) — abre o componente `SwaggerImport`

### Aba Specs

Lista as specs Swagger importadas:

| Coluna | Descrição |
|--------|-----------|
| Título | Nome da spec (extraído do campo `info.title`) |
| Versão | Campo `info.version` |
| Endpoints importados | Quantos endpoints foram gerados dessa spec |
| Ações | Excluir spec (admin) — remove apenas o registro histórico, não os endpoints |

### Aba Endpoints

Lista todos os endpoints do sistema com busca por texto:

| Coluna | Descrição |
|--------|-----------|
| Método | Badge colorido (GET=azul, POST=verde, PUT=amarelo, PATCH=laranja, DELETE=vermelho) |
| Módulo | Agrupamento (ex: "Imóveis", "Contribuintes") |
| Nome | Descrição do endpoint |
| Path | URL path relativo (ex: `/api/imoveis`) |
| Ações | Editar endpoint (admin) |

---

## Convenção de URL Base

> A `urlBase` do sistema **NÃO deve terminar com `/api` ou `/api/`**.

Os paths dos endpoints importados do Swagger já incluem `/api/...`. A URL final é montada como:

```
URL final = urlBase + endpoint.path
```

**Correto:**
```
urlBase = https://tributos.betha.cloud/service-layer-tributos
path    = /api/imoveis
final   = https://tributos.betha.cloud/service-layer-tributos/api/imoveis
```

**Errado:**
```
urlBase = https://tributos.betha.cloud/service-layer-tributos/api
path    = /api/imoveis
final   = https://tributos.betha.cloud/service-layer-tributos/api/api/imoveis  ← duplo /api → 404
```

---

## Importação de Swagger

O componente `SwaggerImport` (modal) oferece três formas de importar uma spec OpenAPI:

| Método | Descrição |
|--------|-----------|
| **URL** | Faz fetch server-side via `POST /api/endpoints/fetch-swagger` — suporta detecção automática de HTML do Swagger UI |
| **Upload de arquivo** | Aceita arquivo `.json` |
| **Specs salvas** | Lista as specs já importadas com opção de re-importar |
| **Limpar tudo** | Remove todos os endpoints e specs do sistema (admin) |

### O que o parser faz

- Resolve `$ref`, `allOf`, `anyOf`/`oneOf` (até 5 níveis de profundidade)
- Extrai campos do `requestBody` (ou do `items` quando o body é array)
- Armazena o primeiro elemento do `bodySchema` como sentinel `{ _exemplo: true, json: {...} }` com o exemplo completo do request body
- Detecta campos `idGerado` e os converte para `_wrapAsIdObject: true` quando o exemplo é `{id: N}`

---

## API utilizada

```js
sistemasApi.listar()
sistemasApi.detalhe(id)
sistemasApi.criar({ nome, urlBase })
sistemasApi.atualizar(id, { nome, urlBase })
sistemasApi.remover(id)

endpointsApi.listar({ modulo? })
endpointsApi.modulos()
endpointsApi.swagger.listar()
endpointsApi.swagger.remover(specId)
endpointsApi.atualizar(id, dados)
endpointsApi.remover(id)
endpointsApi.importarSwagger(sistemaId, jsonSpec)
endpointsApi.fetchSwagger(url)
endpointsApi.limparTudo(sistemaId)
```

---

## Estado React (principais)

| State | Tipo | Descrição |
|-------|------|-----------|
| `sistemas` | array | Lista de sistemas |
| `selecionado` | object \| null | Sistema com painel detalhe aberto |
| `aba` | string | `'informacoes'` \| `'specs'` \| `'endpoints'` |
| `endpoints` | array | Endpoints do sistema selecionado |
| `specs` | array | Specs do sistema selecionado |
| `showSwagger` | boolean | Modal SwaggerImport aberto |
| `showModalSistema` | boolean | Modal criar/editar sistema |
| `editandoSistema` | object \| null | Sistema em edição |
| `buscaEndpoint` | string | Filtro de texto na aba Endpoints |

---

## Schema do banco (modelos relevantes)

```prisma
model Sistema {
  id          Int                @id @default(autoincrement())
  nome        String
  urlBase     String
  endpoints   Endpoint[]
  tokens      MunicipioSistema[]
  specs       SwaggerSpec[]
  criadoEm   DateTime           @default(now())
}

model Endpoint {
  id          Int          @id @default(autoincrement())
  sistemaId   Int
  modulo      String
  nome        String
  path        String
  metodo      String
  bodySchema  String?      // JSON serializado (array de campos + sentinel _exemplo)
  swaggerSpecId Int?
  sistema     Sistema      @relation(...)
  spec        SwaggerSpec? @relation(...)
  criadoEm   DateTime     @default(now())
}

model SwaggerSpec {
  id          Int        @id @default(autoincrement())
  sistemaId   Int
  titulo      String?
  versao      String?
  conteudo    String     // JSON serializado da spec completa
  criadoEm   DateTime   @default(now())
  sistema     Sistema    @relation(...)
  endpoints   Endpoint[]
}
```
