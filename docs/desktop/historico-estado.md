# Krakion App — blocos "Retomar aqui" antigos (histórico)

Parte da documentação do Krakion App. Índice e "Retomar aqui": `docs/desktop.md`.

## Estado e próximos passos (2026-10-20)

### ▶ Retomar aqui (trabalho em andamento)

**Atualização 2026-10-30 — Migração Espelho (Ruropolis). Detalhes na seção "Migração Espelho" acima.**

**Onde paramos:** estímulo dos **contribuintes** rodando pela tela. Vários voltaram com **"Somente um endereço pode ser
definido como principal."** O Felipe já esperava ("eu sabia que apareceria"). **Amanhã:** corrigir esses contribuintes e
transformar o erro em **regra/script da Checagem** (ver a memória `estimulo-revela-erros-migracao`).

Para começar amanhã:
1. O CSV de erros (botão **Exportar erros** no Estímulo de Contribuintes, `contribuintes_tributos_erros_<data>.csv`) tem os
   contribuintes que falharam, no formato do script, com `etapa` e `erro`. Recarregá-lo no Estímulo tenta só eles.
2. O registro completo de cada contribuinte (como a tela devolveu, antes do salvar) está no backup automático:
   `%APPDATA%\Krakion Desktop\backups\migracao-espelho\contribuintes-2026-10-30.jsonl` (botão "Abrir backups"). Dá para
   contar ali quantos endereços estão marcados como principal em cada um e confirmar a causa antes de corrigir.
3. Hipótese a confirmar: é dado da migração (mais de um endereço com principal = SIM). O App manda o mesmo objeto do GET
   + `anoCorrente` + `enderecoPrincipal: null`, igual à tela, e o contribuinte de teste (1 endereço) salvou sem erro.
4. Corrigir (Service Layer ou script) → reestimular só os do CSV de erros → criar a regra da Checagem para esse caso.

**O que ficou pronto em 2026-10-29/30:**
- Módulo **Migração Espelho** (ícone próprio): Cadastros (Créditos tributários, Bairros, Logradouros, Contribuintes) com
  Backup → Estímulo → Sincronização → Desfazer → Conferência, e **Ajustes rápidos** (Receitas duplicadas, Limpar
  logradouros da procuradoria, Limpar bairros da procuradoria).
- Descobertas: só a **API da tela** dispara o cadastro único (a Service Layer grava, mas não espelha, e a tela recusa o
  token de migração com 401). A chave entre os sistemas é o **template**. Crédito, bairro e logradouro precisam de mudança
  real ("." e volta); **contribuinte espelha só de salvar**. O limite da Service Layer é de cerca de 140 chamadas por
  janela, com 429 por uns 3,5 min.
- Ruropolis: créditos ✅ (7 receitas duplicadas corrigidas antes); procuradoria limpa (logradouros 30.604 → 24.952,
  ficaram os padrões do sistema e 11 em uso; bairros, ficaram 11 em uso); bairros e logradouros estimulados ✅ (7 HTTP 500
  em logradouros: rodar o **Desfazer de logradouros** com o mesmo CSV para garantir que nenhum ficou com "."); contribuintes
  em andamento.
- O App: sessão do tributos numa janela própria (o token não vai à interface), backup completo automático antes de cada
  PUT, novas tentativas no 500/429, envio em rajada com pausa de 15 s no 429, exportação dos erros no formato do script,
  bloqueio de arquivo de outro cadastro.
- **Segundo passe de limpeza** na procuradoria (os 11 logradouros e 11 bairros em uso) depois dos contribuintes.
- Nada foi commitado: tudo está no working tree do `krakion-app`, junto com alterações anteriores do Felipe.

O que está abaixo é o estado de 2026-10-21, mantido como histórico.

**Atualização 2026-10-21 — exclusão de Placas CONCLUÍDA, exceto 1:** 2.373 imóveis excluídos. O 34664997 (código 2402)
não sai pela API (ciclo movimentação de criação ↔ linha de inscrição — ver o caso em `biblioteca/_CONHECIMENTO/Imoveis/casos/`);
ficou desativado, com chamado na Betha. A tela ganhou: espera no HTTP 429, botão Pular, lote/intervalo do PUT, "Tirar os
já excluídos e nova rodada" e o modo "PUT + DELETE lote a lote". **Esse modo reenvia o PUT a cada 3 min, o que pelo modelo
final (fila lenta, um pedido por vez, PUT repetido engorda a fila) é contraproducente:** trocar por "só DELETE a cada
5 min" ou remover. Os templates BFC não zipam mais (o Studio já zipa) — ainda não rodaram no Studio assim.
O que está abaixo é o estado de 2026-10-20, mantido como histórico.

**Exclusão dos imóveis migrados errado de Placas, códigos 11 a 2402 (~2.392 imóveis).** O Felipe deixou o
**Levantamento de vínculos rodando no Studio** em 2026-10-20 (leva horas). Ao voltar:
1. Ele baixa o resultado do Studio e cola o `.jsonl` em **Mapa de dependências → Imóvel → cartão "Levantamento de
   vínculos" → "Analisar resultado →"** (`/mapa/exclusao`).
2. Conferir a análise. Pelo padrão visto nos 91 já levantados (códigos 10 e 11–100), espera-se que **todos estejam
   livres e só com 1 movimentação de inscrição imobiliária** (`idMovimentacao: 0`), sem proprietário, movimentação,
   histórico ou financeiro. Qualquer coisa fora disso aparece em "Fora do plano".
3. Enviar a etapa **Reprocessar inscrição** (PUT, ~48 lotes de 50) → esperar alguns minutos → **rodar o levantamento de
   novo** e colar → a inscrição deve vir vazia → enviar **Excluir imóveis** (DELETE, ~48 lotes).
4. **Primeiro uso real da tela de envio** (até agora só testada com backend falso). Sugestão: começar pelos 90 dos
   códigos 11–100 (bodies prontos também em `ArquivosTemporarios/exclusao-imoveis-placas-cod-11-100/`, fora do git)
   e observar o primeiro lote antes de soltar o resto.
5. Se algo falhar: a Varredura (`_BIBLIOTECA/Templates/Varredura_Vinculos_Imovel_BASE.txt`) diz o que ainda usa um
   imóvel. Registrar o aprendizado em `biblioteca/FontesDeDados/dependencias_confirmadas.json` e no caso
   `biblioteca/_CONHECIMENTO/Imoveis/casos/`.

Já excluído de verdade: imóvel **34631456** (código 10), pela receita completa, passo a passo.

**Validado na prática (2026-10-20):** a receita (proprietários → movimentações → PUT de inscrição → imóvel), o
Levantamento e a Varredura no Studio, o `Lista_Ids_Imoveis_por_Codigo_BASE` (faixa de códigos → ids; corrigido o
`imprimir (a) + b` após o 1º uso, a versão corrigida ainda não rodou).
**Tela de envio validada (2026-10-20):** 17 imóveis "só inscrição" excluídos pela tela. O DELETE logo após o PUT dá
"em uso" (o reprocessamento ainda está na fila); alguns minutos depois, "Reenviar com erro" passa. O DELETE é a
confirmação do PUT.
**Ainda não validado:** excluir corresponsáveis, testadas,
englobados ou benefícios (imóvel com eles fica fora do plano); qualquer exclusão com vínculo financeiro.

**Git:** 7 commits locais no `krakion-app` ainda **não enviados** ao GitHub (de `927bd25` a `5a7811b`). Push só
quando o Felipe pedir. Nunca no `master` (a VPS faz `git pull` dele), exceto a página `frontend/public/privacidade.html`,
que foi para o master e a VPS a pedido (exigência do Google para o OAuth).
