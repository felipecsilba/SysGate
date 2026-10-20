# Fórmula vs Script — o que cada linguagem aceita

Duas linguagens diferentes convivem no mesmo sistema Betha. Confirmado
empiricamente nesta base (contagem de ocorrências reais, não suposição):

| Recurso | Formulas/ (2.035 arquivos) | Scripts/ (5.393 arquivos) | Conclusão |
|---|---|---|---|
| `def funcao(args) { ... }` (declarar função) | 0 usos reais (13 "hits" eram falso-positivo, texto solto tipo `def Valor_A`) | 1.203 usos | **Só Script.** Fórmula não declara função reutilizável — todo padrão repetido precisa ser copiado e ajustado a cada arquivo. |
| `.find { }`, `.collectEntries { }` (closures Groovy) | 0 usos reais | 334 usos (`.find`) | **Só Script.** |
| `Dados.tributos.v2.*` (fonte de dados / API) | 0 usos reais (4 "hits" estavam em linha comentada com `//`) | 4.932 usos | **Só Script.** Fórmula busca dado por funções específicas (`CamposAdicionais.valor(...)`, `tabelasCalculos.getValor(...)`, `UtilitariosImoveis.*`), não pela árvore `Dados.tributos.v2`. |
| `percorrer(lista) { item -> ... }` | Usado (sobre listas já em memória: `receitas`, `parcelas`, `imoveisEnglob`, etc.) | Usado (inclusive sobre resultado de `fonte.busca(...)`) | **As duas aceitam**, mas em Fórmula só itera sobre coleções que o próprio motor de cálculo já fornece como contexto — não dá pra buscar uma fonte nova dentro da Fórmula e depois percorrer o resultado. |
| `se (...) { } senao { }` | Padrão principal | Também aceito | **As duas aceitam.** |
| `Utilitarios.*`, `CamposAdicionais.*`, `Numeros.*`, `Datas.*`, `Caracteres.*` | Uso nativo | Também aceito | **As duas aceitam** — são funções utilitárias globais, não específicas de uma linguagem. |

## Atualização de 21/08/2026 — o corpus não é o limite da linguagem

Os snippets que o **próprio editor de fórmulas** oferece (campo `scaffolds` do
catálogo, ver `Dicionario de Formulas/`) provam que Fórmula aceita mais do que
a base usa:

```groovy
percorrer(de:0, ate:9){        // laço numérico com a variável `indice`
  se (indice == 5){
    suspender("Parou no indice 5")
  }
  imprimir indice              // `imprimir` funciona — 0 usos em Formulas/
}
```

Ou seja: **`imprimir` e `percorrer(de:, ate:)` são aceitos em Fórmula**, mesmo
com zero ocorrências nos 2.035 arquivos. A tabela acima continua válida pro que
ela afirma (`def`, `.find{}` e `Dados.tributos.*` seguem sendo só de Script —
isso foi verificado), mas **"0 usos no corpus" nunca provou "não existe"**.
Quando a pergunta for "isso funciona em fórmula?", a fonte é o catálogo do
editor, não a contagem.

## Regra prática pra biblioteca de funções

- Qualquer coisa em `_BIBLIOTECA/Funcoes Prontas/` que use `def`, `.find{}` ou
  `Dados.tributos.*` é **Script-only** — nunca colar numa Fórmula
  (Calculo/Acrescimos/Compensatorios/ITBI/etc.).
- Pra Fórmula, "função reutilizável" não existe — o que a biblioteca pode
  oferecer é um **modelo/checklist pra copiar e ajustar** (como
  `Calculo de Acrescimos (Juros Multa Correcao).txt`), não uma função de
  verdade.
- Ao adicionar um novo item na biblioteca, testar essa tabela antes de
  marcar o arquivo como "Fórmula", "Script" ou "Ambas" no README —
  não assumir por semelhança de sintaxe.
