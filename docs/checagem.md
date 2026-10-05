# Checagem de Cadastros — Documentação do Módulo

**Rota da tela:** `/checagem` (Ferramentas → Checagem)
**Backend:** `backend/src/routes/checagem.js`, `backend/src/lib/regrasChecagem.js`, `backend/src/lib/parseEntrada.js`, `backend/src/lib/checagem.js`
**Frontend:** `frontend/src/pages/Checagem/`
**Plano original:** `docs/plans/2026-09-28-checagem-por-regras.md`

---

## O que o módulo responde

Não só *"este JSON bate com a spec?"*, mas *"o que falta neste registro para ele funcionar, e o que acontece se ficar assim?"*.

A spec Swagger da Betha é permissiva: marca como opcionais campos que na prática quebram rotinas (o `POST /api/dividas` tem 59 campos e só 15 `required`). E vários defeitos de migração nem aparecem na spec — uma dívida de receita diversa sem `idReceitaDiversa` é aceita pela API e só falha meses depois, ao montar o parcelamento, com `[E001] erro interno`.

## Duas frentes

Os dois mundos usam nomes diferentes para a mesma coisa. Misturá-los gerava falso positivo, por isso são abas separadas:

| | **Por API** | **Por Fonte** |
|---|---|---|
| entrada | payload de migração `{ idIntegracao, dividas: {...} }` | `.jsonl` exportado de uma fonte do BFC-Script |
| nomes | `idPessoa`, `valorInscrito`, `sistemaOrigem` | `idContribuinte`, `valorTributoInscrito`, `idReceitaDiversa` |
| enums | string | objeto `{ valor, descricao }` |
| valida com | spec Swagger + regras + notas | regras + notas + catálogo da fonte |
| cadastro | path da API (`/api/dividas`) | nome da fonte (`debitos`) |

---

## Frente Por Fonte — o validador de arquivo

### Fluxo

```
Studio BFC-Script            Krakion (navegador)                    Krakion (servidor)
─────────────────            ───────────────────                    ──────────────────
script de exportação  ──►  .jsonl (ex.: 29 MB, 16 mil débitos)
                            │ lê o arquivo na memória da aba
                            │ guarda de cada registro só os caminhos
                            │ que as regras e o laudo usam
                            │ divide em lotes de até 700 KB  ──────►  POST /checagem/verificar (por lote)
                            │                                          motor de regras em memória
                            │ junta os resultados dos lotes  ◄──────  laudo do lote
                            │ perfil de campos (no navegador, sobre o arquivo inteiro)
                            ▼
                         laudo: lista à esquerda, detalhe à direita
```

**Nada é armazenado.** O arquivo vive na memória da aba; o servidor processa cada lote e descarta. A rota `/verificar` só **lê** regras e notas do banco. Recarregar a página, clicar em Limpar ou trocar de arquivo apaga tudo. Isso é intencional: não pesa o banco e não guarda CPF/CNPJ de contribuintes no Krakion.

### Formato de entrada (o padrão)

**Script de exportação:** `docs/scripts-bfc/exporta-debitos-por-credito.groovy` (cópia versionada; configure `ID_CREDITO_TRIBUTARIO` e rode no Studio). Gera um zip com CSV + JSONL.

O formato padrão é **JSONL**: um registro por linha, UTF-8, exatamente como a fonte devolveu (sem achatar). O script de exportação gera um zip com um CSV e um JSONL — **o CSV é só para consulta humana; o Krakion lê o JSONL**.

| Item | O que o Krakion espera |
|---|---|
| Estrutura | um objeto JSON por linha; objetos aninhados preservados (`referente.tipo`) |
| Enums | objeto `{ valor, descricao }` — o motor lê o `valor` |
| Ausência | `null`, `""`, `{}`, `0` em campo de id/código e data `1800-01-01` contam como vazio |
| Linha cortada | ignorada e contada como "ilegível"; o resto é analisado |
| Fonte | não vai no arquivo — o usuário escolhe a fonte na tela |

Colar texto continua funcionando (`parseEntrada.js` aceita array JSON, envelope `{ data: [...] }`, JSONL e o log do Studio com hora na frente: `11:52:01 - {...}`). Só o upload de arquivo tem perfil de campos e concentração das falhas, porque o texto colado não fica inteiro no navegador.

**Arquivo de referência para testes:** `ArquivosTemporarios/debitos_credito_285568.jsonl` (fora do git — contém CPF/CNPJ). 16.451 débitos, 1.635 sem receita vinculada.

### A tela

**Coluna esquerda**
1. Entrada: arrastar o `.jsonl` ou "Carregar .jsonl" (ou colar texto). Barra de progresso por lote.
2. **Resultado**: um quadrado por regra — `OK` verde, `ERRO` vermelho, `ALERTA` âmbar, `N/A` cinza (nenhum registro se enquadrou: não é aprovação) — com a contagem `falhas de alcançados`.
3. Quadrado **Campos do arquivo** (resumo) e **Falta fora do JSON** (notas do cadastro).
4. **Campos**: um quadrado por campo do arquivo, mais os que o catálogo lista e não vieram. Filtros (Todos, Alerta, Parciais, OK, Vazios, Não vieram) e busca por nome/descrição.

**Coluna direita — detalhe do item clicado** (o primeiro erro abre sozinho)

| Item | O que mostra |
|---|---|
| Regra com falha | Consequência (`porque`), Como corrigir (`comoCorrigir`), O que não sabemos, Onde se concentra (situação / ano / crédito dos registros que falharam), recorte do JSON × esperado (3 exemplos), ids afetados em grade com Copiar, onde a regra procura |
| Regra OK | "Tudo certo" + por que a regra existe |
| Campo | preenchimento (% e contagem), regras que olham o campo (atalho), quantidade por valor com a descrição do enum, valores aceitos pela fonte (os presentes destacados), datas (mais antiga/recente + por ano), números (menor/maior; soma só em valor monetário), unicidade em ids (distintos e quantos aparecem em mais de um registro) |
| Campos do arquivo | preenchimento parcial, não vieram, sempre vazios, fora do catálogo |
| Notas | texto das `NotaChecagem` do cadastro |

**Status de campo:** `ok` (100% preenchido), `parcial` (com %), `vazio` (vazio em todos), `alerta` (valor fora do enum do catálogo), `ausente` (catálogo lista, arquivo não traz). É informação, não veredito — campo vazio só vira erro quando uma regra diz que algo quebra sem ele (senão `idObra` vazio em 100% dos débitos de receita diversa viraria falha).

**Zero é ausência só em id/código.** `vlDesconto: 0` é dado; `idReceitaDiversa: 0` é vínculo faltando (bases convertidas usam 0 no lugar de nulo).

---

## Regras (`RegraChecagem`)

```prisma
model RegraChecagem {
  sistemaId    Int
  frente       String   // "api" | "fonte"
  cadastro     String   // "/api/dividas" na frente api; "debitos" na frente fonte
  nome         String
  porque       String   // o que quebra sem isso — exibido como "Consequência"
  onde         String   // JSON: caminhos onde o dado pode estar; basta um preenchido
  quando       String?  // JSON: { caminhos: [...], igualA: [...] } — limita a regra
  esperado     String?  // a FORMA do valor ("<id da receita diversa>"), nunca valor inventado
  naoSabemos   String?  // o que não se sabe sobre a regra
  comoCorrigir String?  // dica de correção exibida no laudo
  severidade   String   // "erro" | "alerta"
  ordem        Int
}
```

**Motor** (`regrasChecagem.js`, puro, 19 testes):
- `vazio()` trata `null`, `undefined`, `""`, `0` e `"0"` como ausência.
- `desembrulhar()` lê enum `{ valor, descricao }` pelo `valor` (comparar com `String()` daria `"[object Object]"`).
- `quando`: o primeiro caminho preenchido precisa casar (sem caixa) com algum valor de `igualA`; senão a regra não se aplica ao registro.

**Regras atuais** — fonte de verdade: `backend/prisma/seed-regras-checagem.js` (idempotente, atualiza por `frente + cadastro + nome`, nunca apaga). Rodar após mudar: `node prisma/seed-regras-checagem.js [sistemaId]` (sem id, pega o sistema "Tributos").

| Frente | Cadastro | Regras |
|---|---|---|
| fonte | `dividas` | receita vinculada (receita diversa), contribuinte, crédito, data de inscrição, valor inscrito, livro/folha (alerta), referente de imóveis, referente de econômicos |
| fonte | `debitos` | vencimento informado, receita vinculada (receita diversa) |
| api | `/api/dividas` | sistema de origem (alerta), data de lançamento (alerta) |

### Como escrever uma regra

1. **Confira os nomes na fonte.** Cada fonte tem seus nomes: `debitos` usa `dtVencimento` e `referente.tipo`/`tipoCadastro`; `dividas` usa `tipoReferente`/`creditoTributario.tipoCadastro`. Regra copiada de outra fonte não se aplica a nada (falha silenciosa: "0 alcançados") ou acusa 100%. Consulte com `python fonte.py ver <fonte>` (catálogo em `Desktop\Scripts Formulas e Relatorios\FontesDeDados\`) ou pelo quadrado do campo na própria tela.
2. **Calibre com um gabarito.** Rode contra um arquivo sabidamente correto (base de teste feita pela tela): regra que acusa o gabarito está errada. Depois, contra um caso que funciona (zero achados) e um que quebra (exatamente os achados certos).
3. **Texto genérico.** `porque`, `naoSabemos` e `comoCorrigir` são lidos em qualquer base — explicam o motivo, nunca citam a base, o contribuinte ou a contagem de onde a regra nasceu. A origem vai em comentário no seed.
4. **Nunca invente valor** em `esperado` nem em `comoCorrigir`. Mostre a forma; se não se sabe o caminho da correção, deixe `comoCorrigir` vazio (a seção some do laudo).
5. **Teste.** `regrasChecagem.test.js` importa `REGRAS` do seed e roda contra fixtures no formato real da fonte.

---

## Notas (`NotaChecagem`)

Observações sobre o cadastro que não cabem numa regra de campo (pré-requisito, dependência, algo inalcançável pelo JSON). Por `path`, com `tipo` ∈ `prerequisito | dependencia | inalcancavel | regra`. Aparecem em "Falta fora do JSON". A rota `/verificar` busca as notas pelos dois nomes do cadastro (`debitos` e `/api/debitos`).

As notas **não têm seed** — vivem só no banco de produção. O mesmo cuidado de texto genérico vale para elas.

## Catálogo de fontes (`FonteDados`)

Importado do `catalogo_v2.json` (`POST /api/checagem/fontes/importar`, admin) — 418 fontes de leitura em produção. Guarda filtros, campos de retorno (com descrição e tipo) e enums (com os valores aceitos). Usado por:
- **Construtor de script** ("Gerar script de exportação", aba Por Fonte): monta o filtro com os campos que a fonte aceita e os valores reais dos enums.
- **Perfil de campos**: descrição de cada campo, campos que não vieram e valores fora do enum. A tela acha a fonte pelo nome do cadastro (`path === '/<cadastro>'`). Fonte fora do catálogo: o perfil mostra só o preenchimento.

---

## Frente Por API — validação contra a spec

Continua valendo o motor antigo (`checagem.js`, 19 testes), em duas camadas, somado às regras e notas da frente `api`:

**Camada 1 — automática (sai do `bodySchema` importado):** valor fora do enum (erro), tipo não convertível (erro), tipo convertível como `"1250.00"` em number (alerta), campo inexistente com sugestão por prefixo/distância de edição (alerta), `required` da spec ausente (erro). **Regra do pai ausente:** objeto pai faltando reporta só o pai, não os filhos.

**Camada 2 — ensinada (`CampoChecagem`, aba Campos):** toggle Obrigatório + observação do que quebra sem o campo. Chaveada por `sistemaId + path + campo`, **nunca por `endpointId`** (reimportar o Swagger recria os endpoints com ids novos). Marcação igual à spec e sem observação é apagada.

A frente Por API ainda usa o laudo antigo (lista expansível), sem o painel de detalhe.

---

## Rotas (`/api/checagem`)

> Qualquer autenticado, salvo indicação. Dados globais — sem isolamento por usuário ou município (é regra do sistema Betha).

| Método | Rota | Descrição |
|---|---|---|
| GET | `/cadastros?sistemaId=` | Cadastros da frente API (endpoints POST/PUT/PATCH, um por path) + nº de marcações |
| GET | `/campos?sistemaId=&path=` | Campos achatados da spec com `obrigatorio` mesclado |
| PUT | `/campos` | Upsert da marcação (toggle + observação) |
| DELETE | `/campos` | Remove a marcação |
| POST | `/validar` | Motor de spec antigo: `{ sistemaId, path, payload }` |
| GET | `/notas?sistemaId=&path=` | Notas do cadastro |
| POST / PUT / DELETE | `/notas`, `/notas/:id` | CRUD de notas |
| GET | `/regras?sistemaId=&frente=&cadastro=` | Regras (com `onde`/`quando` já parseados) |
| POST / PUT / DELETE | `/regras`, `/regras/:id` | CRUD de regras (aceita `comoCorrigir`) |
| POST | `/verificar` | `{ sistemaId, frente, cadastro, texto }` → `{ entrada, regras[], notas[], resumo, spec? }`. Cada regra: severidade (`na` se não alcançou ninguém), `aplicaveis`, `faltam`, textos, até 3 `exemplos` e todos os `ids`. Na frente `api` roda também o motor de spec. **Não grava nada.** |
| POST | `/fontes/importar` | Importa o catálogo de fontes — **admin** |
| GET | `/fontes?sistemaId=&busca=` | Lista enxuta de fontes |
| GET | `/fontes/:id` | Detalhe: filtros (enums com valores), campos de retorno e mapa de `enums` |

O body de `/verificar` está sujeito ao limite global de 1 MB do `express.json` — por isso o upload vai em lotes de 700 KB.

---

## Arquivos

| Arquivo | Papel |
|---|---|
| `backend/src/lib/regrasChecagem.js` | Motor de regras puro — `avaliarRegras`, `vazio`, `desembrulhar`, `pegar` |
| `backend/src/lib/parseEntrada.js` | Parser tolerante (array, envelope, JSONL, log do Studio) |
| `backend/src/lib/checagem.js` | Motor de spec da frente API — `achatarCampos`, `validarPayload` |
| `backend/prisma/seed-regras-checagem.js` | Regras oficiais; exporta `REGRAS` (só conecta ao banco quando executado) |
| `frontend/.../Checagem/index.jsx` | Seletor de frente, sistema e cadastro/fonte |
| `frontend/.../Checagem/AbaPorFonte.jsx` | Entrada, upload em lotes, lista de regras/campos e painel de detalhe |
| `frontend/.../Checagem/arquivoFonte.js` | Lógica pura do upload: `lerJsonl`, `caminhosNecessarios`, `montarLotes`, `mesclarResultados`, `perfilCampos`, `concentracao` |
| `frontend/.../Checagem/DetalheRegra.jsx` | Detalhe de uma regra |
| `frontend/.../Checagem/DetalheCampo.jsx` | Detalhe de um campo + `ESTILO_CAMPO` |
| `frontend/.../Checagem/PainelCampos.jsx` | Resumo de campos (modo `embutido` no detalhe) |
| `frontend/.../Checagem/LaudoRegras.jsx` | Peças compartilhadas: `SEV`, `Trecho`, `ListaIds`, `CONTEXTO`, `Regra` (laudo antigo, usado na frente API) |
| `frontend/.../Checagem/AbaPorApi.jsx` / `AbaCampos.jsx` | Frente API e marcação de campos |
| `frontend/.../Checagem/ConstrutorScript.jsx` | Gerador de script de exportação a partir do catálogo |

## Testes

`npm test` no backend (runner nativo do Node) — 48 testes: `checagem.test.js` (19), `regrasChecagem.test.js` (19, incluindo as regras de `debitos` contra o formato real da fonte) e `parseEntrada.test.js` (10). O frontend não tem runner; `arquivoFonte.js` é puro e foi validado com o arquivo de referência via Node.

## Limitações e fora de escopo

- **Bases muito grandes:** o arquivo inteiro fica na memória da aba (~100–150 MB para 29 MB de JSONL). Com centenas de milhares de registros o navegador pode ficar lento; a saída seria ler o arquivo em partes.
- **Sem histórico de laudos:** por decisão, nada é salvo. Se um dia for preciso, guardar só o resumo (data, base, contagens por regra), nunca registros.
- **Auditoria direto da API REST:** impossível — 358 GETs, 354 deles `/{id}`, sem GET de coleção nem filtro. A varredura de dados só existe em BFC-Script, por isso o fluxo é exportar no Studio e subir o arquivo.
- **Celular:** a sidebar do Krakion cobre a tela em telas estreitas (limitação do layout geral, não do módulo).
