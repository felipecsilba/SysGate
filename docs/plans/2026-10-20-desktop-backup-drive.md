# Plano: Backup automático no Google Drive (Krakion App)

**Goal:** cópia de segurança do que não está no git, usando o conector do Google Drive (`docs/plans/2026-10-19-desktop-conexao-google-drive.md`).

**Decisões (brainstorming de 2026-10-20, aprovadas pelo Felipe):**
- **Banco do App, diário:** exportação de todas as tabelas para JSON, compactado (`banco-AAAA-MM-DD_HHMM.json.gz`). O Postgres
  embutido não traz `pg_dump`. Copiar a pasta do banco com ele rodando sai corrompido e só serve para a mesma versão.
  O JSON é legível, independente de versão e serve de base para o "Restaurar" futuro. Guarda os **30** mais recentes.
- **Biblioteca, só quando mudar:** um zip por pasta principal de `biblioteca/` (mais `_raiz` com os arquivos soltos na raiz).
  A "impressão" de cada pasta (caminho + tamanho + data de cada arquivo) fica em `<userData>/backup.json`. Só a pasta que
  mudou é reenviada. Guarda as **3** últimas versões de cada pasta.
- **Quando:** ao abrir o App, se o último backup completo tiver mais de 24 h, roda em segundo plano. Também tem o botão
  "Fazer backup agora".
- **No Drive:** `Krakion App/Backups/Banco/` e `Krakion App/Backups/Biblioteca/`.
- **Tela:** cartão "Backup" em Conexões → Google Drive (último, próximo, progresso, erro, botão).
- **Fora desta etapa:** restaurar pelo App.

**Architecture:** `desktop/electron/backup/`
- `zip.js`: `criarZip(destino, arquivos)` escreve em disco, arquivo por arquivo (deflate, nomes UTF-8, caminhos longos
  do Windows), com limites do formato sem zip64 (4 GB, 65.535 entradas) checados. `lerZip(caminho)` serve para os testes
  e para o restaurar futuro.
- `impressao.js`: `listarArquivos(pasta)` (ignora `__pycache__`) e `impressao(lista)` → hash.
- `retencao.js`: `paraApagar(arquivos, manter)` agrupa pelo prefixo antes do carimbo de data e mantém os N mais recentes.
- `exportarBanco.js`: `exportarBanco(consultar)` → Buffer gzip `{ formato, geradoEm, tabelas: { Nome: linhas } }`.
- `index.js`: `criarBackup({ userData, drive, pastaBiblioteca, exportarBanco, manter })` com `status`, `precisaRodar`,
  `executar({ aoProgresso })` (uma execução por vez; arquivos temporários sempre apagados; impressão atualizada só depois
  do envio com sucesso).
- `cliente.js` (Drive) ganha `listar(pastaId)` e `excluir` passa a ser usado na retenção.
- `main.js`: banco com `pg` (`databaseUrl` do `bancoLocal.iniciar`), IPC `backup:*` + evento `backup:progresso`;
  agenda a checagem 15 s depois de o App abrir.

**Testes:** zip (ida e volta, UTF-8, vazio, binário), impressão (muda com conteúdo, data e arquivo novo; ignora `__pycache__`),
retenção, exportação (com consulta falsa) e o orquestrador ponta a ponta contra o Google falso (1ª execução envia tudo;
2ª só o banco; mudar um arquivo reenvia só aquela pasta; retenção apaga no Drive; falha no meio não marca a pasta como enviada;
`precisaRodar` respeita as 24 h e a conexão).
