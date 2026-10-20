# _CONHECIMENTO — base dos especialistas

Aqui mora o que os **especialistas** (`.claude/agents/`) sabem. Os agentes são
finos de propósito: eles sabem o *método* e sabem *onde procurar*. O conteúdo
fica aqui, em arquivo, porque:

- prompt de agente não escala — a central de ajuda inteira de uma área não cabe;
- arquivo dá pra atualizar em pedaço, sem reescrever o agente;
- arquivo dá pra auditar: quando o agente errar, dá pra ver de onde tirou.

---

## Estrutura por área

Toda área segue o mesmo esqueleto. O `00-INDICE.md` é obrigatório — é a
primeira coisa que o agente lê.

```
_CONHECIMENTO/<Area>/
  00-INDICE.md      o que existe nesta área e onde. Mapa, não conteúdo.
  conceitos/        o que é cada coisa: telas, fluxo, regra de negócio
  campos/           dicionário campo a campo, com domínio de valores
  configuracoes/    parâmetros do sistema que mudam o comportamento da área
  fontes/           quais fontes de dados servem a área (aponta pro fonte.py)
  formulas/         tipos de fórmula da área e o que cada uma faz
  casos/            "sintoma → causa provável → como checar" (troubleshooting)
  melhorias/        changelog: o que mudou, e a partir de quando
```

Pasta vazia é normal no começo. O que ainda não existe fica registrado como
pendência no `00-INDICE.md` — assim o agente sabe a diferença entre
"não existe" e "não sei".

---

## `_COMUM/` — o que não é de uma área só

Cadastro que várias áreas usam ao mesmo tempo mora em `_COMUM/`, não duplicado
dentro de cada uma. Hoje: **Benefícios fiscais** (ITBI + IPTU + econômicos) e o
**Mapa do sistema** (menus e módulos). Candidatos futuros: Motivos,
Indexadores, Atos, Endereços, Campos adicionais, Contribuintes.

## Áreas previstas

| Área | Estado |
|---|---|
| `ITBI-Transferencias/` | 🟢 fechada na essência — corpus + ajuda + Swagger + tela |
| `Registro-Bancario/` | 🟡 iniciada — 1 caso confirmado (guias do Fly não registram no BB) |
| `Imoveis/` | ⬜ a fazer |
| `Economicos/` | ⬜ a fazer |
| `Divida-Ativa/` | ⬜ a fazer |
| `Arrecadacao/` | ⬜ a fazer |
| `Receitas-Diversas/` | ⬜ a fazer |

O especialista de **implantação** vem por último: ele não tem conhecimento
próprio, ele roteia pros outros e faz as perguntas certas antes de decidir.

---

## Custo importa tanto quanto conteúdo

O especialista é usado no meio de um chamado. Se ele demora e gasta muito, não
serve — por melhor que seja a resposta.

Por isso todo arquivo de `casos/` **abre com uma "Resposta rápida"**: as causas
mais prováveis, onde olhar, e a pergunta a fazer. O detalhamento vem depois,
pra quem precisar. O agente lê o topo e para.

E toda contagem sobre o corpus é feita **uma vez**, gravada no documento, e
citada depois. Refazer varredura a cada pergunta é o principal desperdício —
foi o que aconteceu no primeiro uso real, em 21/08/2026.

## Três regras de conteúdo

1. **Toda afirmação tem procedência.** Cada arquivo diz na abertura de onde
   veio: central de ajuda, tela do sistema, contagem no corpus, ou o Felipe
   falou. Sem procedência, é suposição — e suposição já quebrou este projeto
   antes (ver `../CONTEXTO.md`, "Lições aprendidas").

2. **Nome de campo, sigla de receita e número de tabela NÃO são portáveis
   entre municípios.** Quando um arquivo cita um desses, ele precisa dizer de
   qual município saiu. O especialista nunca copia esses valores de um
   município pra outro sem avisar.

3. **Na dúvida, não afirmar.** "Confirme na tela" vale mais que um chute que
   parece certo.

---

## Como alimentar

Ver `_PROTOCOLO-DE-INGESTAO.md`.
