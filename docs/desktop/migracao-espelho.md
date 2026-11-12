# Krakion App — Migração Espelho

Parte da documentação do Krakion App. Índice e "Retomar aqui": `docs/desktop.md`.

## Migração Espelho (ícone próprio, 2026-10-29)

O cadastro único sincroniza um registro com os outros sistemas (procuradoria, por exemplo) **quando ele é salvo**. Uma base
migrada inteira para o tributos nunca foi salva depois de o cadastro único estar configurado, então nada foi espelhado. Em vez
de migrar de novo pela Service Layer, a ferramenta provoca um "salvar" em cada registro. Ordem dos cadastros: créditos
tributários → contribuintes → logradouros (depois bairros, moradores, receitas).
- **Tela** (`pages/MigracaoEspelho/`): menu de cadastros à esquerda (só Créditos tributários pronto), fluxograma no meio
  (Backup → Estímulo → Sincronização → Desfazer → Conferência) e o detalhe da etapa à direita.
- **Backup:** script BFC gerado de `CADASTROS[].campos` (`src/lib/espelho.js`, 4 testes). Gera CSV `;` em UTF-8, com uma
  coluna por campo na ordem da fonte e enum pelo `.valor`. Os campos dos créditos foram conferidos no Studio em 2026-10-29.
  **O script ainda não rodou no Studio** (a tela avisa isso).
- **Estímulo** (`Estimulo.jsx`, decisão do Felipe em 2026-10-29): carregar o CSV do backup → cada crédito vai num
  `PATCH /api/creditosTributarios` **só com `idGerado` e a descrição atual + "."**. A spec lista `tipoCadastro`,
  `abreviatura` e `idIndexadores` como obrigatórios; se a Betha recusar o PATCH enxuto, a mensagem aparece na linha.
  - Pré-validação (`prevalidarEstimulo`): descrição que já termina com "." **só avisa**, não impede. A linha fica âmbar
    e a descrição vai ficar com "..". Fica fora do envio quem não tem id (vazio ou 0), não tem descrição ou tem id repetido.
  - Lista com ID | Descrição atual | Vai ficar e, depois do envio, a Situação de cada crédito (Sucesso, erro com a mensagem da Betha, ou na fila).
  - Envio: município + sistema com token; "Testar com 1" (só o primeiro) ou todos, em lotes de 50, com confirmação.
    Usa `interpretarEnvio`/`interpretarStatusLote` e a espera no 429 do lote da API. O idLote é consultado a cada 8 s
    por até 3 min; depois disso, "Consultar pendentes". Também há "Reenviar os com erro" e "Parar".
  - `idIntegracao` = `ESPCRED<id>`: o PATCH só aceita letras e números (hífen é recusado).
  - **Validado em 2026-10-29:** 33 créditos, 1 lote, todos "Sucesso". O lote ficou alguns minutos em `NAO_PROCESSADO`
    e saiu com "Consultar pendentes". **O PATCH parcial funciona:** a Betha aceita só `idGerado` + `descricao`, apesar
    de a spec marcar outros campos como obrigatórios.
  - **O PATCH pela Service Layer NÃO dispara o cadastro único** (2026-10-29: nada chegou na procuradoria). Só salvar pela
    tela dispara. A tela usa outra API, `tributos.betha.cloud/tributos/v1/api/cadastros/creditos-tributarios`, com o
    token da sessão (ver `tools/betha-capture`). O gatilho está nela ou numa chamada que a tela faz depois de salvar.
  - **Captura de 2026-10-29 (`tools/betha-capture/capturas/investigacao`, fora do git):**
    - **A chave entre os sistemas é o template.** `template.id` no tributos (tela) = `templateId` na fonte BFC =
      `idTemplate` na procuradoria (`api.procuradoria.betha.cloud/procuradoria/api/creditosTributarios/{id}`). Os ids
      são diferentes nos dois lados (313937 ↔ 211206). As receitas também se ligam pelo template. A listagem da
      procuradoria não traz `idTemplate`, só o detalhe.
    - O salvar da tela é `PUT tributos/v1/api/cadastros/creditos-tributarios/{id}` com o objeto inteiro e `version`.
      Salvo sem mudança, o `version` continuou 48, ou seja, nada foi gravado. Provavelmente por isso salvar sem mudar
      não dispara: o truque do caractere força uma gravação de verdade.
    - A procuradoria tinha 25 créditos e o tributos 33. Lá havia duplicados (IRRF ×3, Alvará de Obras ×2) e dois com "."
      que no tributos não têm mais (211206 "AUTO DE INFRAÇÃO.", 211305 "Imposto de Renda Retido na Fonte."). Isso
      indica que estímulos anteriores criaram registros novos em vez de atualizar, e que a remoção do "." não propagou.
  - **Limpeza da procuradoria (Ruropolis, 2026-10-29):** `DELETE /api/creditosTributarios` (Service Layer da procuradoria,
    lote `6ae3fa6905e3ac4fbb81a74c`) com os 25 créditos. **20 excluídos.** 5 recusados por "em uso em outro registro":
    202045 Alvará de Obras, 193225 IPTU, 211025 ISS NFe, 209685 e 211305 IRRF. Esses ficam na procuradoria.
    Próximo passo: estimular pela tela do tributos e ver se o cadastro único recria os 20.
  - **Estímulo pela tela VALIDADO (Habite-se 307397, 2026-10-29):** com "." o crédito **foi criado** na procuradoria
    (211325) cerca de 4 s depois do PUT. Sem o ".", a descrição **voltou lá também**. O ciclo é: `GET
    tributos/v1/api/cadastros/creditos-tributarios/{id}` → `PUT` no mesmo path com **o objeto do GET** e só a
    `descricao` trocada (a tela só descarta `indexador.version`) → GET → PUT com a descrição original. Cada PUT
    incrementou o `version` em 4 (78→82→86). O template vai no corpo porque a tela manda o objeto inteiro. A Service
    Layer não tem campo de template, e o motivo de ela não disparar é que o evento do cadastro único sai da API da
    tela. Para automatizar: chamar a API da tela com o token de sessão (`Authorization: Bearer <uuid>` + `User-Access`).
  - **Não estimular** crédito que já tem correspondente antigo na procuradoria, sem o template (vira duplicado):
    278737 IPTU ↔ 193225, 282157 Alvará de Obras ↔ 202045, 278817 ISS NFe ↔ 211025, 278777 IRRF ↔ 209685/211305.
  - **Pela API de migração não há como (2026-10-29):** o PUT e o PATCH com todos os campos não mudaram nada na
    procuradoria. Nas duas Service Layers, só `estados`/`paises` (tributos) e `paises`/`documentosDivida` (procuradoria)
    têm `idTemplate`. **A API da tela recusa o token de migração:** `GET tributos/v1/api/cadastros/creditos-tributarios/{id}`
    → 401 "Sem permissão", mesmo com o `User-Access` da captura. **Conclusão: o estímulo precisa do token de sessão de
    um usuário logado.**
- **Estímulo pela API da tela — VALIDADO (Ruropolis, 2026-10-29):**
  - **Sessão** (`electron/sessaoTributos/`): "Entrar no tributos" abre uma janela do App (partição `sessao-tributos`, só
    em memória) em `tributos.betha.cloud`. O Felipe entra e escolhe a entidade. O main lê `Authorization` + `User-Access`
    das chamadas da própria tela (`webRequest.onBeforeSendHeaders`). **O token nunca vai à interface:** ela pede
    `window.krakion.tributos.chamar(metodo, path, corpo)` e o main só deixa passar o que está em `regras.js`
    (hoje, GET/PUT de `/api/cadastros/creditos-tributarios/{id}`). Um 401 apaga a sessão e avisa a tela. `regras.test.js`: 3 testes.
  - **Ciclo** (`estimularPelaTela` em `src/lib/espelho.js`, testado com uma Betha falsa): GET → confere que a descrição bate
    com o backup (se não bater, não mexe) → PUT com "." (`corpoParaPut`: objeto do GET, descrição trocada, sem
    `indexador.version`) → espera (padrão 5 s) → GET → PUT com a original. Se o registro já estiver com "." de uma rodada
    interrompida, faz só a volta. Se a volta falhar, o registro fica `marcado` e "Reenviar os com erro" faz só a volta.
  - **Tela** (`EnvioTela.jsx`): barra da sessão, espera e paralelos (1–5), checkbox por crédito (para tirar os que têm
    correspondente antigo na procuradoria), Testar com 1 / Estimular N / Parar / Continuar / Reenviar com erro. Sessão
    expirada no meio pausa a fila: o item volta para "na fila" e nada vira erro.
  - **Desfazer pela API da tela** (`desfazerPelaTela`, mesmo `EnvioTela` com `desfazer`; 2026-10-29): GET e, se a descrição
    termina com ".", PUT sem o ponto. A volta **espelha** na procuradoria. Crédito já sem ponto não é gravado ("Já estava
    sem '.'"); descrição diferente do backup não é tocada. O envio antigo pela Service Layer (PATCH, que não espelhava) e
    `montarLotesEstimulo` saíram.
  - **Primeiro uso real (Ruropolis, 2026-10-29):** 7 créditos voltaram 422 `"Já existe uma receita com a descrição informada."`
    (285137, 278737, 285157, 278758, 278798, 278797, 278778). Na tela acontece o mesmo: salvar o crédito re-salva as
    receitas dele, e a Betha recusa receita com descrição repetida. **Antes de estimular, tratar as receitas repetidas.**
    Script `_BIBLIOTECA/Templates/Receitas_Descricao_Repetida_BASE.txt` (ainda não validado). A mensagem de 422 vem em
    `detail.message`, e a tela agora mostra esse texto. Os erros da API da tela vão para o `krakion.log` (`[tributos]`).
- **Bairros e logradouros no fluxo (2026-10-30):** cada cadastro tem `tela: { path, campo }` (onde fica na API da tela e
  qual campo recebe o "."): créditos `descricao`, bairros e logradouros `nome`, em `/api/cadastros/enderecos/bairros|logradouros/{id}`.
  O caminho de endereços foi liberado em `regras.js`. O backup sai de `Dados.tributos.v2.bairros|logradouros` com `idTemplate`
  e o município. **O Estímulo filtra por município** quando o arquivo traz mais de um (o tributos pode ter a base nacional),
  com `municipiosDoBackup`. O arquivo carregado agora é guardado por cadastro. Ordem do menu: Créditos → Bairros → Logradouros.
  O PUT de bairro/logradouro pela tela segue o padrão do crédito, inferido da captura do GET; o primeiro "Testar com 1" confirma.
- **Contribuintes (2026-10-30):** a captura do contribuinte 109271640 mostrou que **salvar sem mudar já dispara o cadastro
  único**: ele apareceu na procuradoria (54600425) com o mesmo template (`1b661af7…`), sem "." e com o `version` igual (6).
  A procuradoria tinha só **7 pessoas**, então não há base antiga para duplicar. O PUT da tela é o GET + `anoCorrente` (ano
  atual) + `enderecoPrincipal: null`, e endereços, telefones e e-mails vão como vieram. **Modo `salvar`** (`tela.modo`):
  `salvarPelaTela` faz GET → backup completo → um PUT (`corpoParaSalvar`), sem volta; o Desfazer mostra "não se aplica".
  Caminho liberado em `regras.js`: `/api/cadastros/referentes/contribuintes/{id}`. O backup do Studio leva só campos simples
  (sem enum). O registro inteiro vai para o backup automático.
- **Erros do estímulo (2026-10-30):** o salvar pela tela roda as validações da Betha que a API de migração pula, então
  cada erro é um bug de migração (ex.: receitas duplicadas). A tela mostra "Erros por motivo" (`resumoErros`) e
  **"Exportar erros (N)"** (`csvErros`): **o mesmo arquivo do script** (mesmas colunas, mesma ordem, linhas originais) só
  com quem falhou, mais `etapa` e `erro` no fim. Volta a ser carregado no próprio Estímulo para tentar só eles; ao
  reexportar, `etapa`/`erro` não se repetem. Os motivos recorrentes devem virar regra da Checagem ou atalho de Ajustes rápidos.
- **Arquivo do cadastro errado é bloqueado** (`cadastroDoArquivo`): pelo nome do arquivo (o do script ou o `_erros_`) ou
  pelas colunas, escolhendo o cadastro mais específico. Motivo: o CSV de logradouros tem `id` e `nome` e passaria na tela de
  bairros, que salvaria o bairro com o mesmo id. A tela diz "Este arquivo é de X — abra X no menu".
- **Backup completo automático (2026-10-30, pedido do Felipe: "o ideal é sempre ter o backup completo"):** no Estímulo e no
  Desfazer, o objeto que a tela devolve no GET (o registro inteiro, como a Betha guarda) é gravado **antes do 1º PUT** em
  `%APPDATA%\Krakion Desktop\backups\migracao-espelho\<cadastro>-<AAAA-MM-DD>.jsonl`, uma linha `{ salvoEm, registro }` por registro
  (`electron/espelho/backup.js`, 2 testes, IPC `espelho:guardar`). Se o backup falhar, o registro não é tocado ("Backup não
  gravado — não mexi"). Há o botão "Abrir backups". O CSV do Studio continua servindo de lista de ids e do texto original.
  Motivo: no contribuinte, endereços, telefones e sócios ficam em fontes separadas no Studio, mas vêm juntos no GET da tela.
- **Novas tentativas** (`comNovasTentativas`): 429/500/502/503/504 da tela repetem a mesma chamada até 3 vezes (2 s, 5 s, 15 s).
  Nos logradouros de Ruropolis, 7 de cerca de 870 deram 500 sem mensagem.
- **Ajustes rápidos** (seção da lateral da Migração Espelho; atalhos de correção de migração que travam o estímulo).
  `src/lib/ajustesMigracao.js` (6 testes) + `pages/MigracaoEspelho/AjusteRapido.jsx`, com as abas "1. Exportar" (script
  pronto, `ScriptPronto` de `comum.jsx`) e "2. Ler resultado" (CSV do script ou a saída do console do Studio colada, via `lerRegistros`).
  - **Receitas duplicadas:** `duplicadas()` agrupa descrição e abreviatura repetidas, sem diferenciar caixa e espaços. **Por
    padrão sem olhar a classificação:** em Ruropolis, 5 dos 7 pares que deram 422 eram TAXA × IMPOSTO. A opção "só na mesma
    classificação" fica disponível. Em cada par, uma receita tem `templateId` (cadastro único) e a outra **não tem** (faixa 877xxx,
    criada pela migração). A tela marca "sem template · fora do cadastro único".
  - **Aba "3. Corrigir"** (`CorrecaoReceitas.jsx`; `alvosCorrecao`/`lotesPatchReceitas`): em cada grupo de descrição
    repetida, a receita **sem template** ganha "." no fim da descrição por `PATCH /api/receitas`, com o token de migração
    (obrigatórios: idGerado, descricao, abreviatura, classificacao, inscDividaAtiva). A receita com template não é tocada.
    Grupo em que todas têm template, ou nenhuma tem, vai para "revisar à mão". Se a nova descrição já existir, a receita
    vem desmarcada. **Excluir ficou de fora por decisão do Felipe.** Em Ruropolis são as 7 receitas 877xxx dos créditos com 422.
  - **Validado (Ruropolis, 2026-10-29):** as 7 receitas foram atualizadas pela Correção. Em seguida, o estímulo dos créditos pela
    tela deu sucesso em todos. Ciclo completo: ajuste das receitas → estímulo → crédito espelhado na procuradoria.
  - **Limpar logradouros (procuradoria)** (`exclusao` no ajuste; aba "2. Excluir" em `ExclusaoAjuste.jsx`): a procuradoria de
    Ruropolis tinha 30.604 logradouros. Quase todos são a **base nacional da Betha ("Padrões do sistema", outras cidades,
    excluir desabilitado na tela)** e ficam. Os do município (`idMunicipio` 4320) eram **3.733**, contra 874 no tributos:
    todos "Rua" com o CEP genérico 68165000, com nomes como `*****`, "1" e "10A AVENIDA …", ou seja, base de outra migração.
    O script de exportação usa `Dados.procuradoria.v2.logradouros.buscar()`. **Na procuradoria o método é `.buscar`**, e
    `criterio: "idMunicipio = 4320"` volta "Erro interno do servidor", por isso o filtro é feito dentro do script
    (`montarScriptBackup` aceita `metodo` e `filtro`). A exclusão (`lotesExcluir`): `DELETE /api/logradouros` pela Service
    Layer da procuradoria, em lotes de 50. A tela separa "em uso" de outros erros e, por segurança, descarta registro fora
    do filtro do município (`separarPorFiltro`). A v1 da fonte traz a mesma base com menos campos.
  - **Limpar bairros (procuradoria)** (2026-10-30): `Dados.procuradoria.v2.bairros.buscar()`. O município vem num objeto
    (`municipio { id, nome }`), então o campo pode ter `caminho` (`municipio?.id`), usado no script, na leitura do console
    e no filtro. `DELETE /api/bairros` com `{ bairros: { idGerado } }`. Base de digitação de outra migração: dezenas de
    variações do mesmo bairro (AEROPOROT, AERORPOTO, CENGTRO, CETRO…), com os de outras cidades na mesma faixa de ids.
  - **Resultado da limpeza em Ruropolis (2026-10-30):** logradouros 30.604 → 24.952. Excluídos cerca de 5.650 "definidos por
    usuários". Sobraram 11 em uso (7 de Rurópolis: CASTELO BRANCO, FLORESTA, GOV MARIO COVAS, MILTON ALVES COSTA,
    OLAVO BILAC, RUA 03, SANTOS DUMONT). **"Padrões do sistema" (base nacional) a API não exclui**, igual à tela, e eles
    ficam. Bairros: sobraram 11 em uso (6 de Rurópolis: AEROPORTO, BELA VISTA, CENTRO, DIVINOPOLIS, PLANALTO, VILA NOVA).
    Os em uso saem num segundo passe, depois do estímulo dos contribuintes.
  - **Rajada** (`src/lib/rajada.js`, 4 testes; usada pelo `useEnvioLote`): manda todos os lotes, 4 em paralelo, e depois
    consulta os idLotes em rodadas (250 ms entre consultas, 5 s entre rodadas, até 30 min). Antes era lote → espera sair
    da fila → próximo. "Consultar pendentes" reconsulta sem reenviar.
  - **Limite da Betha medido (procuradoria, 2026-10-30):** cerca de **140 chamadas** e depois 429 por uns 3,5 min (142 lotes
    em 176 s → bloqueio de 214 s). O Felipe notou primeiro: "a cada 6.000–7.000 registros" (140 lotes × 50). No 429,
    todas as chamadas em paralelo param juntas (`pausaAte`) e tentam de novo **a cada 15 s**. A escada 30 s/1/2/5 min
    (`esperaApos429`) deixava até 2 min parados depois da liberação. O resumo da tela mostra "tenta de novo às HH:MM".
  - **Outras cidades** (opção na aba Excluir, desligada por padrão; `ID_MUNICIPIO = ""` no script exporta todas): o Felipe
    quer limpar também os padrões do sistema, porque o usuário recadastra pelo CEP. Na tela a exclusão deles vem
    desabilitada. Testar com 1 antes.
  - O envio pela Service Layer foi extraído para `envioLote.jsx` (`useMunicipioToken`, `SeletorToken`, `useEnvioLote`:
    espera no 429, consulta do idLote, pendentes). O Desfazer e a Correção usam o mesmo código. `aplicarRetornoLote`
    casa o erro pelo `idIntegracao` do corpo do lote, sem depender de prefixo.
- **Desfazer** (mesmo `Estimulo.jsx`, `modo="desfazer"`): usa o mesmo CSV e manda PATCH com a descrição do backup.
  Colunas: Está agora (backup + ".") | Vai voltar para. É seguro justamente porque o PATCH não sincroniza: a procuradoria
  não é tocada. Aviso: sobrescreve qualquer edição feita pela tela depois do backup.
