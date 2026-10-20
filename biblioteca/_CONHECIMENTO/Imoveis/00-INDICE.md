# Imóveis — índice

Área criada em 2026-10-20 a partir de um caso real. A análise empírica de IPTU (fórmulas) citada no `CONTEXTO.md`
ainda não foi escrita aqui.

## O que existe

| Arquivo | O que responde |
|---|---|
| `casos/Excluir imovel por API (migrado errado).md` | Por que o DELETE do imóvel diz "em uso" e a ordem que libera (proprietários → movimentações → reprocessar inscrição → imóvel) |

## Ferramentas

- `_BIBLIOTECA/Templates/Levantamento_Vinculos_Imoveis_BASE.txt`: ids dos filhos e trava financeira de uma lista de imóveis (JSONL)
- `_BIBLIOTECA/Templates/Varredura_Vinculos_Imovel_BASE.txt`: pergunta a 29 fontes se têm algo de **um** imóvel; serve quando a receita não basta

## Pendências (o que ainda não se sabe)

- Excluir imóvel **com** movimento financeiro (débito, dívida, lançamento).
- Econômicos, transferências, imagens, informações complementares e origem do imóvel: se travam, como excluir.
- `conceitos/`, `campos/`, `configuracoes/`, `fontes/`, `formulas/`: vazios.
