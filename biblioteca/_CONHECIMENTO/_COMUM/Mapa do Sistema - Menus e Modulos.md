# Mapa do sistema — menus e módulos

> **Origem:** print da tela (Felipe, 2026-08-20, PM Viseu — Módulo
> Imobiliário) + tags do Swagger + central de ajuda
> **Estado:** parcial — só o menu **Administrando** do Módulo Imobiliário foi
> capturado inteiro

Serve de **recorte para as áreas de especialista**: cada bloco de menu tende a
virar (ou compor) uma área em `_CONHECIMENTO/`.

Estrutura de topo: `Visão geral` · `Configurando` · `Administrando` ·
`Executando`, com seletor de **entidade** (a prefeitura) e de **módulo**
(ex.: Módulo Imobiliário).

---

## Administrando — capturado

| Bloco | Itens |
|---|---|
| **Pessoas** | Contribuintes · Construtoras · Imobiliárias · Engenheiros/Arquitetos · **Cartórios** |
| **Financeiro** | Agências · Bancos · **Indexadores** · Limites de arrecadação · Convênios |
| **Documentos** | Documentos |
| **Imóveis** | Imóveis · **Englobamento** · Desmembramentos · Remembramentos · Geoprocessamento · Contribuições de melhoria · Obras |
| **Taxas** | Receitas diversas |
| **Lançamentos** | Requerimento/Manutenção de lançamento · Antecipação/Prorrogação de vencimentos |
| **Cadastros auxiliares** | Naturezas de texto jurídico · Fontes de divulgação · Atos · Feriados · Unidades de medida · Endereços · **Benefícios fiscais** · **Motivos** · Materiais e serviços |

## Executando — pela central de ajuda

| Bloco | Itens |
|---|---|
| **Emissão** | Guias · Livros da dívida ativa · Termos de abertura/encerramento do livro |
| **Movimentação cadastral** | **Transferência de imóveis** · **Solicitação de transferência de imóvel** |
| **Movimentação financeira** | Manutenção de pagamento · Cálculos · Notas avulsas · Baixa automática/estorno · Baixa manual/estorno |
| **Processos** | Inscrição em dívida |

## Utilitários

`Central de configurações` — uma entrada por área. Lista real vista na tela:
Acréscimos · Arquivo · Arrecadação · Contribuições de melhoria · Cupons de
desconto · Documentos · Dívidas ativas · Econômicos · Endereços ·
Encerramento mensal · Geoprocessamento · Imóveis · Integração de lançamentos ·
Integrações contábeis · Junta comercial · Nota Nacional · Notas avulsas ·
Obras · Prestação de contas · Permissão de confirmação de processos ·
Receitas diversas · Taxas de expediente · **Transferência de imóveis** ·
Transparência Cloud · Homologação do Tributos Cloud

Outros itens do menu Utilitários: Gerenciador de acessos · Gerenciador de
templates · Gerenciador de extensões · Cadastro único · Assinaturas ·
Gerenciador de relatórios · **Gerenciador de Scripts**

> A lista da Central de configurações é o melhor índice de áreas que existe —
> ela enumera tudo que é parametrizável.

## Configurando

Não capturado ainda.

---

## Como isso vira o roadmap de especialistas

| Área candidata | Menus que a compõem |
|---|---|
| **ITBI-Transferencias** ✅ | Executando > Movimentação cadastral · Config > Transferência de imóveis · Cadastros aux. > Motivos, Cartórios |
| **Imoveis** | Administrando > Imóveis (7 itens) · Config > Imóveis, Geoprocessamento · Emissão de guias de IPTU |
| **Economicos** | Config > Econômicos, Junta comercial, Nota Nacional · alvarás, atividades |
| **Divida-Ativa** | Executando > Processos > Inscrição em dívida · Emissão > Livros · Config > Dívidas ativas |
| **Arrecadacao** | Executando > Movimentação financeira (5 itens) · Config > Arrecadação, Cupons de desconto · Financeiro (bancos, convênios) |
| **Receitas-Diversas** | Administrando > Taxas > Receitas diversas · Config > Receitas diversas, Taxas de expediente |
| **_COMUM** | Benefícios fiscais ✅ · Motivos · Indexadores · Atos · Endereços · Campos adicionais · Contribuintes |

---

## A fazer

- [ ] Capturar os menus **Configurando** e **Executando** direto da tela
- [ ] Conferir se outros módulos (Mobiliário/Econômico?) têm menu próprio —
      o seletor mostrava "MÓDULO IMOBILIÁRIO", então há outros
