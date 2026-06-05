---
name: melhorias
description: Use quando trabalhar com um arquivo de backlog de melhorias — guia a leitura da documentação, planejamento, implementação e registro nas docs oficiais
---

# Melhorias — Workflow Completo

Este skill define o fluxo obrigatório para trabalhar com arquivos de backlog de melhorias (ex: `docs/melhorias-futuras.md` ou qualquer arquivo com lista de features/correções a implementar).

**Regra geral:** nunca pule fases. Cada fase tem uma barreira de saída explícita.

---

## FASE 1 — Leitura de contexto (ANTES de qualquer código)

Ao receber um arquivo de melhorias para trabalhar:

### 1.1 — Ler a documentação geral do sistema

Ler obrigatoriamente:
- `CLAUDE.md` — arquitetura, padrões, stack, rotas da API, modelos do banco, convenções
- `skills/banco-de-dados.md` — se alguma melhoria envolve mudança de schema
- `skills/backend.md` — se alguma melhoria envolve nova rota ou lógica de servidor
- `skills/frontend.md` — se alguma melhoria envolve componente, página ou estado React

### 1.2 — Ler os docs do módulo afetado

Identificar os módulos impactados pelas melhorias e ler o doc correspondente:

| Módulo | Arquivo |
|--------|---------|
| Chamados | `docs/chamados.md` |
| Portfólio | `docs/portfolio.md` |
| Municípios | `docs/municipios.md` |
| Sistemas / Endpoints | `docs/sistemas.md` |
| Sandbox / Envio em Lote | `docs/sandbox-unificado.md` |
| Analisador JSON | `docs/analisador-json.md` |

Se o módulo não tiver doc listado acima, buscar em `docs/`.

### 1.3 — Ler o arquivo de melhorias

Listar todas as melhorias com:
- ID (ex: `MELHORIA-007`)
- Descrição resumida
- Complexidade declarada
- Dependências entre melhorias

### Barreira de saída da Fase 1

Antes de prosseguir, confirmar com o usuário:
- A ordem de implementação (se o arquivo não deixar claro)
- Se alguma melhoria deve ser pulada ou adiada
- Se há decisões de abordagem em aberto (ex: "Opção A ou B")

---

## FASE 2 — Planejamento por melhoria

Para cada melhoria aprovada, identificar:

1. **Mudanças no banco** (`backend/prisma/schema.prisma`) — novos modelos, campos, relações
2. **Mudanças no backend** — novas rotas, mudanças em rotas existentes, novo arquivo em `routes/`
3. **Mudanças no frontend** — novos estados, componentes, chamadas de API, UI
4. **Impacto no deploy** — se há mudança de schema → `npx prisma db push` é obrigatório no deploy

Registrar o plano no TodoWrite antes de iniciar código.

### Checklist de planejamento

- [ ] Campos novos no banco precisam de `npx prisma db push` + `npx prisma generate` no servidor
- [ ] Nova rota: verificar se rota nomeada deve vir ANTES de `/:id` no Express
- [ ] Novo modelo no Prisma: verificar se o `index.js` do backend precisa importar a nova rota
- [ ] Mudança de comportamento de rota existente: verificar se o frontend usa a rota e precisa atualizar
- [ ] Novo campo em formulário: verificar se `ModalChamado` / componente relevante precisa do campo no payload

---

## FASE 3 — Implementação

Implementar uma melhoria por vez. Nunca misturar mudanças de melhorias diferentes no mesmo commit.

### Ordem de implementação recomendada dentro de cada melhoria

1. Schema Prisma (se houver)
2. Rota backend (se houver)
3. Registro da rota em `backend/src/index.js` (se rota nova)
4. API frontend em `lib/api.js` (se rota nova)
5. Componente / página frontend
6. Commit

### Convenções a seguir

- Seguir padrões visuais do projeto: header com barra acento `w-1 h-6 bg-sysgate-600`, ícones SVG em vez de texto nos botões de ação
- Classes Tailwind: usar `.btn`, `.card`, `.input`, `.badge` do `index.css`; paleta `sysgate-*` para acentos
- Não adicionar features além do que foi pedido (YAGNI)
- Não refatorar código que não é alvo da melhoria

### Deploy após implementação

Quando o usuário pedir para aplicar ao servidor, seguir o fluxo em `skills/deploy.md`:

```bash
git push origin master
ssh root@187.77.230.138
cd /var/www/krakion && git pull && cd backend && npx prisma db push && cd ../frontend && npm run build && cd ../backend && pm2 restart krakion-backend
```

**Atenção:** se houve mudança de schema, `npx prisma db push` regenera o cliente Prisma automaticamente. Nunca usar `--skip-generate`.

---

## FASE 4 — Registro na documentação oficial

Executar **após** o usuário confirmar que as melhorias estão aprovadas (funcionando em produção ou em homologação local).

### 4.1 — Atualizar `docs/<modulo>.md`

Para cada módulo com melhorias implementadas, atualizar o doc correspondente:

- Novos campos → adicionar na tabela "Campos do chamado" / tabela equivalente
- Novo comportamento → adicionar seção ou atualizar seção existente
- Schema alterado → atualizar bloco `prisma` no final do doc
- Nova API → atualizar seção "API utilizada"
- Novo estado React → atualizar tabela "Estado React"

### 4.2 — Atualizar `CLAUDE.md`

Verificar e atualizar cada ponto impactado:

| O que mudou | Onde atualizar no CLAUDE.md |
|---|---|
| Novo modelo Prisma | Linha `schema.prisma # N modelos:` — incrementar contador e adicionar à lista |
| Campo novo em modelo | Anotar `(+ campo)` na lista do schema.prisma |
| Nova rota em `routes/` | Adicionar linha na árvore de arquivos com comentário descritivo |
| Nova rota registrada em `index.js` | Não precisa atualizar a árvore, mas verificar se o comentário do `index.js` ficou desatualizado |
| Novo export em `api.js` | Atualizar comentário da linha `api.js` na árvore |
| Novo comportamento de componente | Atualizar comentário do arquivo na árvore ou adicionar nota em "Padrões importantes" |
| Nova tabela de rotas da API | Adicionar seção em "Rotas da API" |
| Novo padrão relevante | Adicionar bullet em "Padrões importantes" |

### 4.3 — Limpar o arquivo de backlog

Após todas as melhorias implementadas e documentadas:

1. Verificar se todas as melhorias do arquivo foram implementadas
2. Se sim → deletar o arquivo de backlog
3. Se parcial → remover apenas as concluídas e atualizar a tabela de ordem

### Barreira de saída da Fase 4

Antes de declarar "tudo registrado":
- Abrir `docs/<modulo>.md` e ler as seções alteradas para confirmar que refletem o estado atual
- Buscar no `CLAUDE.md` pelo nome de cada modelo/rota/componente novo e confirmar que aparece
- Confirmar que o arquivo de backlog foi atualizado ou deletado

---

## Resumo do fluxo

```
Arquivo de melhorias recebido
  ↓
FASE 1: Ler CLAUDE.md + docs do módulo + listar melhorias
  ↓ (aprovação da ordem com o usuário)
FASE 2: Planejar mudanças (banco, backend, frontend) + TodoWrite
  ↓
FASE 3: Implementar uma por vez + commit por melhoria
  ↓ (deploy quando solicitado)
FASE 4: Registrar em docs/<modulo>.md + CLAUDE.md + limpar backlog
```

---

## Sinais de alerta

| Situação | Ação |
|----------|------|
| Melhoria muda schema Prisma | Lembrar que deploy precisa de `prisma db push` (sem `--skip-generate`) |
| Nova rota nomeada em Express | Verificar se deve vir ANTES de `/:id` |
| Componente usa lista para calcular algo (ex: ticketNum) | Garantir que a lista completa é passada como argumento |
| Melhoria toca em autenticação ou permissões | Ler `skills/seguranca.md` antes |
| Melhoria usa proxy ou API Betha | Ler `skills/betha-api.md` antes |
