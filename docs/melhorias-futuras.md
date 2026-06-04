# Melhorias Futuras — Backlog de Ideias

Documento para registrar sugestões de melhoria identificadas durante o desenvolvimento.
Não representa comprometimento de prazo — serve como referência para sessões futuras de planejamento.

---

## [MELHORIA-001] Mover Catálogo de Verticais para o módulo Sistemas

**Status:** Ideia registrada
**Módulo afetado:** `Portfolio/ModalCatalogo.jsx`, `Sistemas.jsx`
**Prioridade:** Média

### Problema atual

O **Catálogo de Verticais Betha** (CRUD de `CatalogoVertical` — nomes, cores e listas de sistemas de cada vertical) está embutido dentro do módulo **Portfólio**, acessível apenas pelo botão de engrenagem dentro da tela `/portfolio`. Isso cria um problema de descobribilidade: quem administra os sistemas Betha precisaria entrar no Portfólio para configurar algo que é global ao sistema.

Além disso, o catálogo é uma configuração de dados-mestre que se aplica a mais de um módulo — já é usado pelo Portfólio para agrupar entidades por vertical e pode futuramente ser usado em outras partes do sistema.

### Solução proposta

Mover o gerenciamento do **Catálogo de Verticais** para dentro do módulo **Sistemas** (`/sistemas`), na seção de Configuração da sidebar.

**Opções de posicionamento dentro de Sistemas:**

| Opção | Descrição | Prós | Contras |
|-------|-----------|------|---------|
| **A** Nova aba "Verticais" em `Sistemas.jsx` | O painel de detalhe de Sistemas já tem 3 abas (Informações, Specs, Endpoints). Adicionar uma 4ª aba "Verticais" no nível global (sem sistema selecionado) | Contexto natural — verticais são agrupamentos de sistemas | Muda o UX do painel de detalhe existente |
| **B** Card dedicado na listagem de Sistemas | Seção separada no topo ou rodapé da página de Sistemas, acima ou abaixo da tabela de sistemas | Sempre visível, sem precisar selecionar nada | Ocupa espaço na tela principal |
| **C** Item próprio na sidebar dentro de "Configuração" | Rota `/verticais` como NavItem dentro do grupo Configuração | Acesso direto e explícito | Aumenta itens na sidebar |

**Opção recomendada:** A ou B — manter tudo na rota `/sistemas` sem criar nova rota.

### Impacto técnico

**Backend:** sem mudanças — rotas `/api/catalogo` já existem e são independentes.

**Frontend — o que muda:**
- Remover `ModalCatalogo.jsx` de `pages/Portfolio/` (ou manter como componente reutilizado)
- Remover o botão de engrenagem do header de `Portfolio/index.jsx`
- Adicionar o gerenciamento do catálogo em `Sistemas.jsx`
- `Portfolio/index.jsx` ainda precisa **ler** o catálogo (`catalogoApi.listar()`) para exibir as verticais no accordion — isso não muda

**Arquivos a modificar:**
| Arquivo | Ação |
|---------|------|
| `pages/Sistemas.jsx` | Adicionar seção/aba de Catálogo de Verticais |
| `pages/Portfolio/index.jsx` | Remover botão ⚙ e estado `showCatalogo` |
| `pages/Portfolio/ModalCatalogo.jsx` | Mover para `components/` ou `Sistemas/` |

### Armadilhas conhecidas

1. **Acesso admin-only**: o CRUD do catálogo já é protegido por `exigirAdmin` no backend e deve continuar visível apenas para admin no frontend (`isAdmin = useAuthStore(...)`).
2. **Portfolio ainda consome o catálogo**: `Portfolio/index.jsx` chama `catalogoApi.listar()` para montar o accordion por vertical — esse fetch deve ser mantido independente de onde fica o CRUD.
3. **`ModalGerenciarSistemas` depende do catálogo**: recebe `catalogo` como prop vinda do pai (`Portfolio/index.jsx`) — sem impacto na mudança, pois o pai continuará buscando os dados.

### Referências no código atual

- CRUD do catálogo: `pages/Portfolio/ModalCatalogo.jsx`
- Trigger do modal: `pages/Portfolio/index.jsx` (botão ⚙ no header, estado `showCatalogo`)
- Consumo para exibição: `pages/Portfolio/AccordionEntidade.jsx` e `pages/Portfolio/ModalGerenciarSistemas.jsx`
- API backend: `backend/src/routes/catalogo.js` + `lib/api.js` → `catalogoApi`
- Documentação do modelo: `CLAUDE.md` — seção "Catálogo de Verticais"

---

> Adicione novas melhorias abaixo seguindo o mesmo formato `[MELHORIA-NNN]`.
