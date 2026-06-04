# Municípios — Documentação da Tela

**Arquivo:** `frontend/src/pages/Municipios.jsx`

---

## Visão Geral

A tela **Municípios** gerencia os municípios de trabalho do usuário logado. Cada município representa uma prefeitura cliente com suas credenciais de acesso (tokens por sistema). Os dados são **completamente isolados por usuário** — cada implantador vê e gerencia apenas os seus próprios municípios.

---

## Layout Geral

Tela dividida em dois painéis horizontais:

| Painel | Conteúdo |
|--------|----------|
| **Tabela** (esquerda) | Lista de municípios com ações inline |
| **Painel lateral** (direita) | Tokens do município selecionado — abre ao clicar em uma linha |

O painel lateral tem cabeçalho com gradiente (`from-white to-sysgate-50/30`) e label "X selecionado" com botão × para fechar.

---

## Tabela de Municípios

### Colunas

| Coluna | Descrição |
|--------|-----------|
| Nome | Nome da prefeitura |
| Status | Badge **Ativo** (verde) ou **Inativo** (cinza) |
| Observações | Texto livre — truncado com reticências |
| Ações | Ícones: ativar, editar, excluir |

### Ações inline

- **Ativar** (ícone de alvo): torna o município o ativo; desativa automaticamente os demais **do mesmo usuário**
- **Editar** (ícone de lápis): abre modal de edição
- **Excluir** (ícone de lixeira): remove com confirmação — exige `ConfirmDialog`

### Município ativo

O município ativo é usado como contexto padrão no Sandbox e no Envio em Lote. O badge "Ativo" verde destaca qual está selecionado. Um alerta vermelho aparece no `MunicipioBadge` quando o ambiente é produção.

---

## Painel Lateral — Tokens por Sistema

Ao clicar em qualquer linha da tabela, o painel lateral se abre mostrando os tokens cadastrados para aquele município.

### Exibição do token

- Token mascarado: exibe apenas os **primeiros 8 caracteres** seguidos de `••••`
- Botão de olho para revelar o token completo
- Botão de copiar com feedback "Copiado!" por 2s
- Nome do sistema em negrito com badge colorido de validade abaixo

### Badge de validade (`dataVencimento`)

Exibe o estado do token com base na data de vencimento cadastrada:

| Cor | Condição |
|-----|----------|
| Verde | Vence em mais de 30 dias |
| Amarelo | Vence em 8–30 dias |
| Laranja | Vence em 1–7 dias ou "Vence hoje" |
| Vermelho | "Expirado há X dias" |

> Tokens sem data de vencimento não exibem badge. O badge é apenas informativo — não bloqueia o uso do token.

### Adicionar / atualizar token

Botão **+ Adicionar sistema** abre um modal com:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Sistema | Select | Todos os sistemas cadastrados |
| Token | text | Valor do token de acesso |
| Data de vencimento | date | Opcional; mín = hoje, máx = hoje + 15 dias |

A operação é um **upsert** — se já existir um token para o par (município × sistema), ele é substituído. Para atualizar apenas a data de vencimento de um token existente, basta re-salvar o mesmo sistema via este modal.

### Remover token

Ícone de lixeira ao lado do token. Remove apenas aquele par (município × sistema), sem afetar o município.

---

## Isolamento por Usuário

Toda a lógica de backend filtra por `usuarioId = req.usuario.id`:

- `GET /api/municipios` retorna apenas municípios do usuário logado
- `PATCH /:id/ativar` desativa apenas os municípios do mesmo usuário
- Operações em tokens verificam posse do município antes de executar
- O proxy verifica `municipioId` pertence ao usuário antes de usar o token — impede uso de tokens de outros usuários (retorna 403)
- Municípios de outros usuários retornam 404 (não 403) para não vazar informação de existência
- No logout, `localStorage.removeItem('krakion-municipio')` limpa o contexto para não vazar dados ao próximo usuário no mesmo browser

---

## API utilizada

```js
municipiosApi.listar()
municipiosApi.ativo()
municipiosApi.criar({ nome, observacoes })
municipiosApi.atualizar(id, { nome, observacoes })
municipiosApi.ativar(id)
municipiosApi.remover(id)
municipiosApi.tokens.listar(municipioId)
municipiosApi.tokens.salvar(municipioId, { sistemaId, token, dataVencimento })
municipiosApi.tokens.remover(municipioId, sistemaId)
```

---

## Estado React (principais)

| State | Tipo | Descrição |
|-------|------|-----------|
| `municipios` | array | Lista de municípios do usuário |
| `selecionado` | object \| null | Município com painel lateral aberto |
| `tokens` | array | Tokens do município selecionado |
| `showModal` | boolean | Modal de criar/editar aberto |
| `editando` | object \| null | Dados do município em edição |
| `showTokenModal` | boolean | Modal de adicionar token aberto |
| `confirmDialog` | object | Controle do `ConfirmDialog` |

---

## Schema do banco (modelos relevantes)

```prisma
model Municipio {
  id           Int                @id @default(autoincrement())
  nome         String
  observacoes  String?
  ativo        Boolean            @default(false)
  usuarioId    Int?
  usuario      Usuario?           @relation(...)
  sistemas     MunicipioSistema[]
  requisicoes  Requisicao[]
  criadoEm     DateTime           @default(now())
}

model MunicipioSistema {
  id              Int       @id @default(autoincrement())
  municipioId     Int
  sistemaId       Int
  token           String
  dataVencimento  DateTime?
  municipio       Municipio @relation(...)
  sistema         Sistema   @relation(...)
  @@unique([municipioId, sistemaId])
}
```
