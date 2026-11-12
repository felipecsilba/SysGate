# Imóveis — índice

Área criada em 2026-10-20 a partir de um caso real. A análise empírica de IPTU (fórmulas) citada no `CONTEXTO.md`
ainda não foi escrita aqui.

## O que existe

| Arquivo | O que responde |
|---|---|
| `casos/Excluir imovel por API (migrado errado).md` | Por que o DELETE do imóvel diz "em uso" e a ordem que libera (proprietários → movimentações → reprocessar inscrição → imóvel) |
| `conceitos/Campos adicionais de imovel - leitura em relatorio.md` | Um registro por ano; como ler o último valor sem baixar o histórico; onde fica o valor por tipo; filtrar imóveis por campo adicional no servidor; opções de lista = campos filhos (Congonhas, 09/11/2026) |

## Ferramentas

- `_BIBLIOTECA/Templates/Levantamento_Vinculos_Imoveis_BASE.txt`: ids dos filhos e trava financeira de uma lista de imóveis (JSONL)
- `_BIBLIOTECA/Templates/Varredura_Vinculos_Imovel_BASE.txt`: pergunta a 29 fontes se têm algo de **um** imóvel; serve quando a receita não basta
- `_BIBLIOTECA/Templates/Relatorio_Imoveis_por_Uso_BASE.txt` + `.jrxml`: relatório PDF de imóveis agrupados por campo de lista (uso), com área, venal, subtotais e resumo

## Pendências (o que ainda não se sabe)

- Excluir imóvel **com** movimento financeiro (débito, dívida, lançamento).
- Econômicos, transferências, imagens, informações complementares e origem do imóvel: se travam, como excluir.
- `campos/`, `configuracoes/`, `fontes/`, `formulas/`: vazios.
