# Fontes brutas — ITBI e Transferências

Registro do que foi ingerido, de onde e quando. Quando a síntese estiver
errada, o conserto é voltar aqui.

| Data | Origem | Cobertura | Situação |
|---|---|---|---|
| 2026-08-20 | https://arrecadacao.ajuda.betha.cloud/tributos/ajuda/executando#transferência-de-imóveis | Seção "Movimentação cadastral → Transferência de imóveis" e "Solicitação de transferência de imóvel" (pág. 5–26 de 102 do PDF) | ✅ processado |

## Sobre o acesso

**A central de ajuda é pública e legível por link** — confirmado em
2026-08-20 lendo `/tributos/ajuda/executando` direto. Não precisa salvar PDF.

Índice da página `executando` (102 páginas no total, só uma parte processada):

1. **Emissão** — guias · livros da dívida ativa · termos de abertura/encerramento
2. **Movimentação cadastral** — transferência de imóveis ✅ · solicitação de
   transferência de imóvel ✅
3. **Movimentação financeira** — manutenção de pagamento · cálculos · notas
   avulsas · baixa automática/estorno · baixa manual/estorno
4. **Processos** — inscrição em dívida

Os itens sem ✅ pertencem a outras áreas (Arrecadação, Dívida Ativa) e ficam
pra quando essas áreas entrarem na fila.

## Guardar o PDF

O PDF que o Felipe extraiu da central cobre exatamente a parte já processada.
Como a página é pública e re-consultável pelo link, ele não é necessário como
backup — mas se for salvo, o lugar é esta pasta.

## Pendente de ingestão

- **Swagger das APIs do sistema Tributos** — o Felipe vai adicionar. Trará
  GET/POST/PUT/PATCH/DELETE de tudo. Impacto grande: hoje o `catalogo_v2.json`
  tem 574 fontes e a conclusão registrada é que **não existe escrita de
  transferência**; o Swagger pode mudar isso. Ver
  `../../ITBI-Transferencias/fontes/Mapa de Fontes - Transferencias e ITBI.md`.

---

## Ingestões posteriores

| Data | Origem | Cobertura | Situação |
|---|---|---|---|
| 2026-08-20 | Print da tela `Utilitários > Central de configurações > Transferência de imóveis` (Felipe) | Guia Transferências completa, com valores de um ambiente real e a lista de 10 motivos | ✅ processado |
| 2026-08-20 | https://tributos.betha.cloud/service-layer-tributos/docs | Swagger do Service Layer — 716 rotas, 77 tags, 1.070 schemas. Salvo em `FontesDeDados/swagger/tributos-openapi.json` | ✅ processado (parte de transferências) |

O Swagger **também é público** — a URL devolve o JSON cru, sem login.
| 2026-08-20 | Prints da tela: menu `Administrando` (Módulo Imobiliário) e `Cadastros auxiliares > Benefícios fiscais` (PM Viseu) | Estrutura de menus + os 4 tipos de benefício + 5 benefícios reais | ✅ processado → `_COMUM/` |

## Decisões do Felipe em 20/08/2026
- **Críticas de transferência não detalhadas**: despriorizadas ("hoje não são importantes").
- **Página de melhorias**: adiada ("veremos em outro momento").
- **Benefício por motivo**: confirmado que vem de `Administrando > Cadastros auxiliares > Benefícios fiscais`, vinculado ao motivo na config de transferências.
