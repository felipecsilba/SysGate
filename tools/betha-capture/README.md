# betha-capture

Escuta o Chrome via DevTools Protocol e grava cada chamada de API que a tela do
Betha faz — método, URL, JSON enviado, JSON de resposta, status e duração.

Serve para descobrir o payload real de cada cadastro (contribuinte, crédito
tributário, receitas, lançamento, inscrição em dívida) e alimentar o catálogo do
módulo Checagem com os campos que a spec Swagger chama de opcionais mas que o
sistema preenche por conta própria.

## Uso

1. `1-abrir-chrome.cmd` — abre um Chrome separado (perfil próprio, porta de
   depuração 9222) já em `tributos.betha.cloud`. O Chrome normal segue intacto.
   Nesse perfil é preciso logar no Betha uma vez.
2. `2-escutar.cmd` — deixa a janela aberta. Cada chamada capturada vira uma
   linha no console e um arquivo em `capturas/`.
3. Usar o Betha normalmente. Salvar um cadastro gera os arquivos.

## Saída

`capturas/NNN-METODO-path.json` por chamada, mais `index.log` com uma linha por
captura. A pasta `capturas/` está no `.gitignore` — pode conter dados do
município.

## Variáveis de ambiente

| Var | Default | Efeito |
|---|---|---|
| `CDP_PORT` | 9222 | Porta de depuração do Chrome |
| `CAP_DIR` | `./capturas` | Pasta de saída |
| `CAP_HOSTS` | `betha` | Substrings de host a capturar (vírgula separa) |
| `CAP_GET` | `1` no .cmd | Capturar GET também (a tela relê o registro salvo) |
| `CAP_TOKEN` | off | `1` grava o `Authorization` inteiro. Por padrão sai mascarado |

Só captura XHR/fetch — imagem, CSS, JS e fonte ficam de fora. `OPTIONS` é ignorado.

## Requisitos

Node ≥ 22 (usa `WebSocket` e `fetch` globais) e Chrome instalado no caminho
padrão. Zero dependências npm.

## Ruído

Telemetria e heartbeats de sessão (google-analytics, `sessions/api/verify`,
`login-session-verifier`, avisos, licenças) são descartados por padrão — eram
centenas de linhas por sessão. `set CAP_TUDO=1` desliga o filtro.
