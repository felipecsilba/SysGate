# biblioteca/ dentro do Krakion

Esta pasta era `Desktop/Scripts Formulas e Relatorios`. Veio para dentro do
Krakion em 2026-10-19, com a estrutura intacta, por dois motivos: proteger o
conhecimento com o git e preparar a ida do Krakion App para outras máquinas.

O `README.md` e o `CONTEXTO.md` desta pasta continuam valendo. Todos os
caminhos que eles citam são relativos a `biblioteca/`.

## O que está no git e o que não está

| Parte | No git? | Por quê |
|---|---|---|
| `CONTEXTO.md`, `README.md`, este arquivo | sim | É o handoff da base |
| `_BIBLIOTECA/` | sim | Templates, funções prontas, dicionários: trabalho autoral |
| `_CONHECIMENTO/` | sim | O que os agentes leem |
| `FontesDeDados/` (scripts, `.md`, `catalogo_v2.json`, `mapa_bfc_rest.json`, `nomes_bfc.json`) | sim | `fonte.py` e o Gerador do Desktop precisam deles |
| `FontesDeDados/raw/`, `swagger/*.json`, `_obsoleto/`, `fontes_catalog_completo.json` | não | Brutos grandes e regeneráveis (pipeline no `CONTEXTO.md`) |
| `Formulas/`, `Scripts/`, `Relatorios/`, `Municipios/`, `_RASCUNHOS-TESTES/`, PDFs e `.jrxml` soltos na raiz | não | ~450 MB de material de prefeitura. O repositório vai para o GitHub e a VPS faz `git pull` em cada deploy |

**O corpus fora do git não tem proteção contra exclusão.** Ele precisa de
backup próprio: um zip da pasta guardado fora desta máquina (Drive ou HD
externo). Para levar a outra máquina, clone o repositório e copie o corpus
para cá por esse mesmo zip.

## Quem lê esta pasta

- **Krakion App** (`desktop/electron/biblioteca.js`): o padrão é `biblioteca/`
  na raiz do repositório. Configurações → pasta da Biblioteca troca isso.
  Biblioteca, Municípios (escreve em `Municipios/<cidade>/Legislacao/`) e o
  Gerador de Extensões (`FontesDeDados/`) usam essa pasta.
- **Agentes** (`.claude/agents/` na raiz do Krakion): leem `_CONHECIMENTO/`,
  `_BIBLIOTECA/` e rodam `FontesDeDados/fonte.py`.

## Regras

- Não renomeie `Formulas/`, `Scripts/`, `Relatorios/`, `Municipios/` nem
  `FontesDeDados/`. O app e os scripts Python dependem desses nomes.
- Template ou script BFC novo vai para `_BIBLIOTECA/Templates/` com um
  `README - <nome>.md`. Não vai para `docs/` do Krakion.
- Conhecimento novo de uma área entra pelo `_CONHECIMENTO/_PROTOCOLO-DE-INGESTAO.md`.
