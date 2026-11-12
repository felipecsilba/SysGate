# Krakion App — Checagem (Por Fonte, Por API, Migração)

Parte da documentação do Krakion App. Índice e "Retomar aqui": `docs/desktop.md`.

## Checagem (Ferramentas → Checagem, 2026-10-18)

Duas frentes, como no web (abas **Por Fonte** / **Por API** no cabeçalho). `pages/Checagem/` (`index.jsx` com abas Por Fonte / Por API no cabeçalho + sistema/fonte; `PorFonte.jsx`; `Detalhes.jsx` com DetalheRegra/DetalheCampo/ResumoCampos/NotasCadastro; `pecas.jsx`) + `lib/arquivoFonte.js` (portado do web, agora com 11 testes). Usa as rotas `/api/checagem/*` do backend local; os dados vêm da importação (opção Checagem).
- Fluxo igual ao web: arrastar/abrir o `.jsonl` (ou colar texto), corte de cada registro aos caminhos das regras + `CONTEXTO`, lotes de 700 KB para `/verificar`, mescla, perfil de campos com o catálogo `FonteDados`. Diferença: o lote é medido em **bytes UTF-8** (o web media caracteres — acentos podiam estourar o 1 MB).
- Laudo só na memória enquanto o app está aberto (trocar de módulo não perde); nada em disco nem no banco (arquivo tem CPF/CNPJ).
- Visual sóbrio: severidade = ponto + palavra; lista à esquerda (regras, "Campos do arquivo", "Falta fora do arquivo", campos com filtros e busca sem acento); detalhe à direita sem caixas coloridas (ícone + título colorido, texto neutro). "Onde se concentra" em uma coluna.
- Conferido com o arquivo de referência (`ArquivosTemporarios/debitos_credito_285568.jsonl`): 16.451 débitos verificados em ~1,1 s, regra "Receita vinculada…" acusa os 1.635 esperados; concentração (INSCRITA 890, 2025 1.512, LIDFE 100%).
- **Frente Por API (2026-10-18)**: `PorApi.jsx` + `CamposApi.jsx` + `lib/checagem.js` (6 testes). Cadastro numa caixa única com busca sem acento ("Dívida · Inscrição em dívida · 2 marcados"), sub-abas **Verificar payload** (editor do Analisador + laudo: Contra a spec / Regras expansíveis — erros abertos / Falta fora do JSON) e **Campos** (chave Obrigatório + "O que quebra sem ele" editável; marcação igual à spec e sem observação é apagada). As marcações feitas no app ficam nesta máquina; reimportar a Checagem atualiza as que também existem na VPS (a VPS vence). Conferido: payload de dívida com campo errado → 15 achados (obrigatórios, tipo incorreto, campo inexistente), 2 regras e 3 notas.

## Checagem → frente Migração (2026-10-31)

Checagem de migração **por cadastro do tributos**, sobre o `.jsonl` exportado no Studio. As verificações nascem dos erros
reais do salvar pela tela na Migração Espelho, porque a tela roda validações que a API de migração pula.
- **Tela** (`pages/Checagem/Migracao.jsx`, terceira aba da Checagem): Cadastro → "1. Exportar" (script pronto) →
  "2. Verificar" (carrega o arquivo; laudo com uma linha por verificação à esquerda e o detalhe à direita: por que
  importa, como corrigir, os casos com id/nome/detalhe e **Exportar CSV**). O CSV sai **no formato do backup do Estímulo**
  (colunas do cadastro da Migração Espelho + `verificacao`/`detalhe`): depois de corrigir, é só carregá-lo no Estímulo.
  O arquivo é lido na tela e não é gravado.
- **Lógica** (`src/lib/checagemMigracao.js`, 7 testes): `lerRegistrosMigracao` aceita o JSONL do script, o console do
  Studio e o **backup completo da Migração Espelho** (`{ salvoEm, registro }`, último por id). `checarMigracao` →
  `[{ verificacao, casos }]`. `cpfCnpjValido` (dígitos de CPF/CNPJ, sequência repetida é inválida, vazio não avalia).
- **Contribuintes (primeira checagem):** mais de um endereço principal (marca quando são idênticos), logradouro de outro
  município (`município do endereço ≠ município do logradouro`), CPF/CNPJ inválido.
  **Gabarito:** o backup de Ruropolis de 2026-10-30 (10.955 contribuintes) dá 35 / 19 / 1, encontra os 54 erros do estímulo
  (54 de 54) e não acusa ninguém que salvou sem erro.
- **Script** (`montarScriptExportacao`): logradouros (id → município, que a fonte de endereços não traz) +
  `Dados.tributos.v2.contribuintes.enderecos.busca` (em lote, no plural) + contribuintes → um JSON por linha
  (`JSON.escrever`, arquivo `txt`). Sem `.valor` em enum: o `principal` vai inteiro e o App desembrulha. Ainda não rodou no Studio.
- **Script validado (2026-10-31):** o Felipe rodou no Studio de Ruropolis → `contribuintes_migracao.jsonl` com 10.955
  contribuintes e os mesmos 54 com erro.
- **Severidade:** `erro` = trava o salvar pela tela (estímulo); `alerta` = problema de dado que não trava. Os alertas foram
  testados contra o gabarito (nenhum caso deles falhou no estímulo): sem endereço (4.645), CPF/CNPJ vazio (24), CPF/CNPJ
  repetido (2, verificação com `preparar(registros)` porque compara a base toda) e endereço repetido não principal (2).
- **Correção sugerida** (`correcao` em cada verificação; tela `CorrecaoMigracao.jsx`, que reaproveita `useEnvioLote` e
  `SeletorToken` da Migração Espelho):
  - `api`: só o que precisa mudar, pela Service Layer do tributos. Principal repetido e endereço repetido →
    `DELETE /api/pessoasEnderecos` dos idênticos a mais (fica o principal de menor id; principais diferentes entre si
    vão para "sem correção automática"). Logradouro de outro município → **um `PATCH /api/logradouros` por logradouro**
    (`idGerado`, `idMunicipio`, `nome`), só quando todos os endereços que o usam estão no mesmo município. Em Ruropolis, um
    PATCH no SÃO JOÃO BATISTA resolve os 19. `montarLotesCorrecao` (prefixos `CHKEND`/`CHKLOG`).
  - `prefeitura`: CPF/CNPJ inválido, vazio e repetido, e sem endereço → `csvPrefeitura` (código, nome, documento, problema,
    detalhe, como corrigir) para repassar ao responsável.
  - A correção pela Service Layer **não espelha**: depois, reestimular com o "Exportar CSV" da verificação na Migração Espelho.
  - **Ainda não testado na Betha:** que o `idGerado` de `pessoasEnderecos` é o id do endereço da fonte, e que o PATCH
    de logradouro sem `idTipoLogradouro` (obrigatório na spec) é aceito, como foi o PATCH parcial de crédito. O "Testar
    com 1" confirma.
- Próximas checagens: um item por cadastro (créditos/receitas, logradouros, bairros…), cada erro novo do estímulo vira
  uma verificação.
