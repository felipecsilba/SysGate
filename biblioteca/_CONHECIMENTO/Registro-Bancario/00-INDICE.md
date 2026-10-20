# Registro Bancário (cobrança registrada) — índice

Área do **registro bancário de guias**: o boleto com registro no banco, em vez
do modelo FEBRAB da guia simples. Cobre o convênio no Tributos, as tabelas
auxiliares de configuração da API, e os scripts que fazem o registro.

Dois caminhos de registro convivem:

| Caminho | Como dispara | Script típico |
|---|---|---|
| Emissão pelo Tributos | ao emitir a guia, o relatório registra | `<Município> - Guia Registrada BB PIX V2` (relatório / fonte dinâmica) |
| Guias vindas do Fly | agendado, a cada 15 min | `<Município> - Registro Guias Fly BB PIX V2` (script) |

O do Fly não escolhe convênio: ele **compara** o convênio já gravado no número
de baixa com o do parâmetro. O do Tributos pega o convênio da própria guia
emitida. Essa diferença é a origem da maior parte dos problemas da área.

---

## O que existe aqui

```
casos/
  Guias do Livro Eletronico Fly nao registram no BB.md   🟢 causa confirmada (Rurópolis, 25/08/2026)
configuracoes/
  (vazio)
```

## Pendências

- `configuracoes/` — documentar as duas tabelas auxiliares campo a campo
  ("Configuração Registro Pix - BB Negocial" e "Configuração Dados API - BB").
  Hoje o significado de cada `campoN` só está no código dos scripts.
- Onde exatamente, do lado do Livro Eletrônico Fly, o convênio é configurado —
  e se a integração casa por número do convênio ou por código interno. Ficou em
  aberto no caso de Rurópolis (resolveu pelo Cedente antes de precisar disso).
- Equivalentes SICREDI e CAIXA: existem scripts do mesmo desenho no corpus,
  ainda não estudados.

## Procedência

Tudo desta área veio de chamado real trabalhado com o Felipe em 25/08/2026,
com logs de execução e telas dos dois sistemas. Nada foi tirado de central de
ajuda ainda.
