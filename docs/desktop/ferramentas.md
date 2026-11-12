# Krakion App — Histórico, Notas, Conhecimento e Analisador JSON

Parte da documentação do Krakion App. Índice e "Retomar aqui": `docs/desktop.md`.

## Histórico (Ferramentas → Histórico, 2026-10-18)

`pages/Historico.jsx` — todas as requisições do proxy (até 500 mais recentes, `GET /api/requisicoes`). Filtros: município (no backend), sistema, Todas/Sucesso/Erro com contadores e busca sem acento por path, ID gerado, endpoint ou método. Lista agrupada por dia (Hoje / Ontem / data) → painel de detalhe: município, sistema, endpoint, quando, duração, ID gerado (copiar), URL (copiar), Enviado e Resposta. Lixeira limpa o histórico do município filtrado (ou tudo, com confirmação). Regras puras em `lib/historico.js` (`situacao` — só 2xx é sucesso; `filtrarHistorico`; `agruparPorDia` pelo dia local) — testadas.

## Notas (Ferramentas → Notas, 2026-10-18)

`pages/Notas/` — mesmo backend do web (`/api/notas`), outro desenho: **lista à esquerda** (busca sem acento, filtro por tipo com ícones, etiquetas `#`, Fixadas no topo, prévia de uma linha — checklist mostra `feitos/total`) e **editor à direita que grava sozinho** (700 ms sem digitar; ao trocar de nota grava o que faltou; selo Salvo/Salvando/Editando). Tipos texto, checklist, lista e código (trocar de tipo converte linhas ↔ itens; Tab no código insere 2 espaços; Enter num item cria o próximo, Backspace num item vazio apaga). Cor da nota vira um **ponto** saturado (as cores pastel do web somem no tema claro e destoam no escuro — `PONTO` em `Notas/constantes.js`; o banco segue guardando o hex do web). Sem compartilhamento (só há a conta local) e sem arrastar para ordenar. Regras puras em `lib/notas.js` (testadas).

## Conhecimento (Ferramentas → Conhecimento, 2026-10-18)

`pages/Conhecimento/` — mesmo backend e **mesmo formato de dados** do web (blocos `texto|subtitulo|codigo|nota` em JSON no `conteudo`; passo-a-passo em `passos[].texto`; texto plano antigo vira um bloco). Lista à esquerda (busca sem acento que acha **até dentro de bloco de código e de passo**, filtro por tipo com ponto colorido, vertical → sistema do `CatalogoVertical` em CaixaBusca) carregada de uma vez (`limite=100000`). Direita: **leitura** em coluna de leitura (código em fundo escuro com realce VS Code e botão copiar; passos numerados) ou **edição no próprio painel** (sem modal — Salvar/Cancelar; trocar de/para passo-a-passo aproveita as linhas). Permissões iguais ao web: edita autor ou admin, exclui admin. Regras em `lib/conhecimento.js` (`parseConteudo`, `formDoArtigo`, `montarArtigo`, `trocarTipo`, `filtrarArtigos`) e realce em `lib/codigo.js` (escapa HTML antes de pintar) — testados.

## Analisador JSON (Ferramentas → Analisador JSON, 2026-10-18)

`pages/AnalisadorJson/` (`index.jsx` com modos Analisar / Comparar no cabeçalho, `Editor`, `Arvore`, `Tabela`, `Estatisticas`, `Comparar`) + `lib/json.js` (17 testes). 100% na tela, sem backend; o texto sobrevive à troca de módulo (variável do módulo), nunca vai a disco.
- Esquerda: editor com números de linha (Tab = 2 espaços), Colar / Abrir / Formatar / Minificar / Limpar; a linha do erro fica vermelha na régua.
- Direita: abas Formatado / Árvore / Tabela / Estatísticas + busca de chave/valor (sem acento; clique copia o caminho). Barra de status: válido ou "Erro na linha X, coluna Y" (clique leva ao erro), Ln/Col, caracteres.
- `interpretar()` acha a posição do erro com um leitor próprio — a mensagem do `JSON.parse` muda entre versões do V8 e nem sempre traz posição. Mensagem em português ("esperava "," ou "}"").
- `caminhoFilho()`: `$.a[0].b`; chave fora do padrão de identificador vai entre colchetes (`$["meu-campo"]`).
- Tabela: lista de objetos, ou objeto com **um** array de objetos dentro (envelope `{ content: [...] }` — mostra "lista em content"); objetos aninhados viram colunas com ponto (`credito.id`), arrays ficam inteiros; ordena por coluna (vazios por último); Exportar CSV com `;`. Mostra 1.000 linhas, o CSV leva todas.
- Cores do JSON: `colorirJson()` / `CORES_JSON` (claro e escuro) — o `JsonColorido` usa a mesma função com as cores fixas de fundo escuro.
- Visual sóbrio: sem o tema próprio do web, sem cards coloridos nas estatísticas (números neutros + barra discreta).

- **Comparar**: dois editores (A original / B novo, Colar / Formatar / Limpar, botão trocar A↔B) e embaixo a lista de diferenças (`comparar()`): `+` adicionado, `−` removido, `~` alterado (de riscado → para), filtros por tipo, clique copia o caminho. Modo e textos sobrevivem à troca de módulo.
- **Grafo do web não foi portado** — decisão do Felipe (2026-10-18): Árvore e Tabela cobrem o uso.
