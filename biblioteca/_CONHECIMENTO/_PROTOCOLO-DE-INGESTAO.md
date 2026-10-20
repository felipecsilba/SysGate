# Protocolo de ingestão

Como transformar documentação bruta em conhecimento que um especialista usa.

---

## Entradas aceitas

| Origem | Como chega | Observação |
|---|---|---|
| Central de ajuda (link) | Felipe passa a URL, eu leio | **Só funciona se a página for pública.** Se pedir login, cai pro plano B |
| Central de ajuda (arquivo) | Felipe salva em `_CONHECIMENTO/_bruto/<area>/` | Plano B: PDF, HTML salvo ou `.md` |
| Tela do sistema | Print colado no chat | Melhor fonte pra campo e configuração que a ajuda não documenta |
| Página de melhorias | Link ou colado | Vira `melhorias/`, sempre com data |
| O que o Felipe sabe | Ele fala, eu registro | Marcar como tal — é fonte de verdade, mas é oral |

## Regra de retenção do bruto

O bruto **fica**. `_CONHECIMENTO/_bruto/` guarda o original de tudo que foi
processado, com a data e a URL. Motivo: quando a síntese estiver errada, o
conserto é reler o original, não adivinhar o que ele dizia.

---

## O que eu faço com o material

1. **Leio inteiro antes de escrever.** Sem resumir por cima.
2. **Separo em quatro tipos**, porque misturá-los é o que gera código que não
   roda (mesma lição do `FontesDeDados`):
   - *conceito* — o que é, pra que serve, quando usar
   - *campo* — nome, tipo, domínio de valores, obrigatoriedade, onde aparece
   - *configuração* — o que muda o comportamento e onde se configura
   - *procedimento* — o passo a passo de uma rotina
3. **Cruzo com o que a base já mostra.** Se a ajuda diz uma coisa e os 34
   municípios fazem outra, isso é achado — vai documentado, não escondido.
4. **Marco o que ficou em aberto** no `00-INDICE.md` da área.

---

## Formato dos arquivos

Markdown, com cabeçalho de procedência obrigatório:

```markdown
# <Título>

> **Origem:** central de ajuda Betha — <URL> (lido em AAAA-MM-DD)
> **Confirmado em:** tela do sistema / corpus de N municípios / não confirmado
> **Vale para:** todos os municípios / só <município>

<conteúdo>
```

Quando um trecho valer só pra um município, marcar inline:
`(só Criciúma)`, `(confirmado em 12/33 municípios)`.

---

## Ordem de trabalho por área

1. Estrutura de pastas + `00-INDICE.md` com as pendências listadas
2. O que a base de código já revela (fórmulas, scripts, fontes) — dá pra
   fazer sozinho, sem documentação nenhuma
3. Central de ajuda: conceitos e procedimentos
4. Campos e configurações (é o mais trabalhoso, e o que mais economiza tempo depois)
5. Melhorias/changelog
6. Casos de troubleshooting — nascem do uso, vão sendo acumulados
7. Só então escrever/ajustar o agente da área
