# Krakion App — o que existe, pendências e roadmap

Parte da documentação do Krakion App. Índice e "Retomar aqui": `docs/desktop.md`.

### O que existe no app

- Ferramentas: Analisador JSON (Analisar + Comparar), Checagem (Por Fonte + Por API e marcação de campos), Conhecimento, Notas, Histórico.
- Ícones próprios no Rail: **API** (requisição única, lote assíncrono, Modelos), **Municípios** (legislação e documentos), **Biblioteca** (scripts, relatórios e fórmulas da pasta local, com versões por ano), **Gerador de Extensões** (script de exportação), **Mapa de dependências** (cadastro → dependentes, endpoints, fonte BFC, notas da prática, scripts validados e exclusão em cascata de imóveis).
- Rodapé do Rail: **Conexões** (plugue): Google Drive conectado (conta do Felipe) + **backup automático** (banco sem segredos + biblioteca por pasta, a cada 24 h).
- Configurações: Sistemas, Central de Tokens, Betha Admin, Importar dados (sistemas, endpoints, municípios, tokens, notas, conhecimento, checagem).
- A base BFC mora em `biblioteca/` (ex-`Desktop/Scripts Formulas e Relatorios`). Ver `biblioteca/CLAUDE.md`.
- Testes: desktop **240**, backend **77**, todos passando (`npm test` em cada pasta).

**Pendências conhecidas:**
- **Gerador de Extensões**: fica como está (só o script de exportação) até o Felipe decidir — a geração de scripts e fórmulas está sendo desenhada por ele no VS Code com Claude Code e agentes, agora dentro do próprio Krakion (`biblioteca/` + `.claude/agents/`, desde 2026-10-19). **Não adiantar** Templates, Funções prontas ou geração no app sem o plano dele. O script de exportação ainda não foi rodado no Studio (primeiro uso com LIMITE pequeno).
- **Agente de tokens**: login real no Betha Admin falhando (ver seção própria) — pulado pelo Felipe por custo.
- **Municípios**: busca dentro do texto dos PDFs não existe (precisaria extrair o texto). Os dois PDFs soltos na raiz de `biblioteca/` (Código Tributário de Ruropólis e Lei 524) não foram movidos.
- **Biblioteca**: os 132 grupos de scripts iguais com nomes diferentes na mesma cidade (`_BIBLIOTECA/Relatorio - Duplicatas em Scripts.txt`) aparecem separados; e o "Bom Jesus" mistura dois municípios diferentes (pendência do README da pasta).

**Roadmap:**

- Agente de tokens: login real (pulado pelo Felipe por custo — ver seção própria).
- **Mapa de dependências:** confirmar outros cadastros (Pessoa, Econômico…) conforme os casos reais aparecerem. Script de levantamento na tela só depois de validado no Studio.
- **Exclusão em cascata:** guardar o progresso do envio (hoje fica só na tela) e generalizar para outros cadastros quando houver receita validada.
  Pedidos do Felipe (2026-10-20, para depois): indicador visível de "consultando de novo…" enquanto o lote está na fila
  (hoje parece parado); PUT de inscrição sem o "ok" verde (só "pedidos aceitos", confirmação vem do DELETE); clicar
  numa dependência da análise para ver quais imóveis/ids a têm; no DELETE, "Não foi encontrado nenhum registro" contar
  como "já excluído" (cinza), não erro — numa reexecução o vermelho fica só com o que travou de verdade.
  Sandbox/AbaLote: mesmo tratamento de HTTP 429 que a exclusão em cascata ganhou (esperar e repetir o lote).
- **Backup:** restaurar pelo App (junto com o instalador).
- **Processos de BFC** (`skills/bfc/`): criação e debug de fórmulas/scripts, a partir de casos reais (combinado no início de 2026-10-19).
- Ideias anotadas: conector Claude API (perguntar à legislação e cruzar com a biblioteca); NotebookLM com a legislação no Drive (sem API pessoal: o Krakion só poria os PDFs na pasta).
- Instalador `.exe` (empacotar Node + backend + binários do Postgres) — necessário para levar ao notebook; hoje o atalho depende do repositório nesta máquina.
- Sincronização com a VPS (ids globais, `atualizadoEm`, exclusão lógica).
- Chat com agentes (Claude Code local — `claude` 2.1 instalado em `~/.local/bin`). Abordagem sugerida: Agent SDK no processo main com ferramentas MCP do próprio app. Decisões pendentes (o Felipe pulou por ora): o que o agente pode fazer (sugestão: ler/preparar, **nunca** disparar chamada à Betha), onde pode criar arquivos, onde o chat aparece (sugestão: ícone próprio no Rail).
