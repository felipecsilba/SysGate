# Krakion App — Importar do Krakion web

Parte da documentação do Krakion App. Índice e "Retomar aqui": `docs/desktop.md`.

## Importar do Krakion web (Configurações → Importar dados)

Copia da VPS para o banco local, cada parte opcional: **sistemas + endpoints**, **municípios + tokens**, **notas**, **conhecimento** e **checagem** (regras, notas, catálogo de fontes, campos marcados). Depois disso o app não depende da VPS; nada sincroniza de volta (fase futura). Plano: `docs/plans/2026-10-17-desktop-importacao-tokens.md`.

- Quem fala com a VPS é o **backend local** (`routes/importacao.js` → `lib/clienteKrakionWeb.js`): a tela não chama a VPS (o CORS de lá bloquearia) e a senha só vai do PC para a VPS. A rota só existe com `KRAKION_DESKTOP=1` e para admin (na VPS → 404).
- 2 chamadas stateless: `POST /api/importacao/conectar { url, login, senha }` → `{ url, tokenRemoto, usuarioRemoto, resumo }`; `POST /api/importacao/executar { url, tokenRemoto, sistemas, municipios, notas, conhecimento, checagem }` → busca de novo e grava numa `$transaction` (timeout 300 s).
- **Reimportar não duplica** (`lib/importacaoWeb.js`, testado): sistema e município casam por nome normalizado (sem acento/caixa); endpoints de cada sistema importado são substituídos pelos da VPS; token faz upsert por município × sistema; sem município ativo local, herda o ativo da VPS. Mesmo nome → a VPS vence.
- **Checagem na importação (2026-10-18)**: opção "Checagem" traz, por sistema casado, as regras (`RegraChecagem`, chave `frente + cadastro + nome` — a mesma do seed), as notas (`NotaChecagem`, chave `path + tipo + texto`), o catálogo de fontes (`FonteDados`, 418 fontes — um `GET /fontes/:id` por fonte, no máximo 8 simultâneos via `emParalelo`) e os campos marcados (`CampoChecagem` — só dos cadastros com `marcacoes > 0` em `/cadastros`, que conta apenas os marcados como obrigatórios; uma marcação só de "não obrigatório" num cadastro sem nenhuma outra fica de fora). Tudo casa por chave natural, a VPS vence e nada local é apagado. Usa só rotas que a VPS já tem — não exige deploy. Testado contra a VPS real (2026-10-18): 12 regras, 21 notas, 418 fontes, 8 campos em ~5 s; reimportar não duplica.
- **Notas e Conhecimento** (2026-10-18): `executar` aceita também `notas` e `conhecimento`. Notas = as do usuário na VPS + as compartilhadas com ele; artigos = toda a base. O usuário local vira dono/autor. Sem nome único → casam por **título + `criadoEm`** (a importação grava as datas da VPS); `planejarPorChave` decide criar / atualizar (VPS mais nova) / **manter** (editado aqui depois) — reimportar não duplica nem apaga edição local. Resultado vem como `notas: [novas, atualizadas]`.
- Erro de credencial da VPS volta como **400**, nunca 401 — 401 faria o app deslogar a sessão local.
- Fora: specs Swagger (a API não expõe o conteúdo; endpoints bastam), histórico de requisições, endpoints sem sistema (informados no resumo).
- A tela lembra endereço e login em `localStorage` (`krakion-desktop-importacao`), nunca a senha.
- Teste de ponta a ponta sem tocar na VPS real: um segundo banco embutido + backend em modo web (sem `KRAKION_DESKTOP`) faz o papel de "VPS falsa". Atenção: `POST /api/endpoints` e `/importar` ignoram `sistemaId` — para simular endpoints vinculados, ajuste no banco.
