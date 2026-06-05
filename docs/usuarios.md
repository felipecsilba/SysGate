# Módulo Usuários e Perfil

Gerencia contas de usuário do sistema, incluindo dados pessoais, funções, permissões, recuperação de senha e a tela "Meu Perfil".

---

## Modelos do banco

### Usuario

```prisma
model Usuario {
  id                Int       @id @default(autoincrement())
  login             String    @unique
  nome              String
  senhaHash         String
  role              String    @default("operador")   // "admin" | "operador"
  ativo             Boolean   @default(false)
  email             String?                           // para recuperação de senha
  funcao            String?                           // label exibido: "Suporte" | "Analista de Implantação" | "Gerente" | "Administrador"
  ultimoLogin       DateTime?                         // atualizado no POST /login com sucesso
  recuperacaoToken  String?                           // token hex 64 chars para reset de senha
  recuperacaoExpira DateTime?                         // expira 1h após geração
  filaFiltro        String?                           // JSON: { verticais, sistemas, status } para sub-aba Fila em Chamados
  criadoEm         DateTime  @default(now())
  atualizadoEm     DateTime  @updatedAt
  municipios       Municipio[]
  scripts          Script[]
  notas            Nota[]
  notasCompartilhadas NotaCompartilhamento[]
}
```

**Campos importantes:**
- `login` — identificador único, imutável após criação. Não pode ser alterado via API.
- `role` — controla permissões: `admin` tem acesso total; `operador` tem acesso restrito.
- `funcao` — label de exibição apenas (não é permissão). Valores: `Suporte`, `Analista de Implantação`, `Gerente`, `Administrador`.
- `email` — usado exclusivamente para envio do link de recuperação de senha (SMTP).
- `ultimoLogin` — atualizado automaticamente a cada login bem-sucedido em `POST /auth/login`.
- `recuperacaoToken` / `recuperacaoExpira` — gerados em `POST /auth/esqueci-senha`, limpos após uso em `POST /auth/redefinir-senha`.

---

## API utilizada

### Autenticação — rotas públicas relacionadas ao perfil

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/login | Login — atualiza `ultimoLogin` no sucesso |
| GET | /api/auth/me | Retorna dados do usuário logado incl. `email`, `funcao`, `ultimoLogin` |
| POST | /api/auth/esqueci-senha | Gera token de recuperação, envia email (se SMTP configurado). Rate limit 5/15min. Sempre retorna sucesso genérico (evita enumeração) |
| POST | /api/auth/redefinir-senha | Valida token + expiry, atualiza `senhaHash`, limpa campos de recuperação |

### Usuários — rotas protegidas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/usuarios | Admin: lista todos; não-admin: retorna só o próprio registro |
| POST | /api/usuarios | Cria usuário inativo — somente admin |
| PUT | /api/usuarios/:id | Admin: atualiza nome/role/ativo/email/funcao; não-admin: só nome, email, funcao, filaFiltro do próprio id |
| PATCH | /api/usuarios/:id/senha | Admin: redefine qualquer senha; não-admin: só a própria |
| DELETE | /api/usuarios/:id | Remove — somente admin (impede auto-exclusão e remoção do último admin) |

---

## Comportamentos importantes

### Recuperação de senha (fluxo completo)

1. Usuário clica "Esqueci minha senha" na tela de login → `ModalEsqueceuSenha` abre
2. Informa login ou email → `POST /api/auth/esqueci-senha`
3. Backend gera `crypto.randomBytes(32).toString('hex')` (64 chars), salva em `recuperacaoToken` + `recuperacaoExpira = now + 1h`
4. Se SMTP configurado no `.env`, envia email com link `APP_URL/redefinir-senha?token=xxx`
5. Usuário acessa `/redefinir-senha?token=xxx` → página pública `RedefinirSenha.jsx`
6. Informa nova senha → `POST /api/auth/redefinir-senha` → backend valida token e expiry, atualiza senha, limpa token
7. Frontend exibe tela de sucesso com link para login

**SMTP:** configurado via variáveis de ambiente. Se `SMTP_HOST` ou `SMTP_USER` estiver vazio, o backend pula o envio silenciosamente (sem erro).

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
APP_URL=http://localhost:3000
```

### Permissões de admin (toggleAdmin)

- Em `Usuarios.jsx` (somente admin), cada linha de usuário tem botão "Tornar Admin" / "Revogar Admin"
- Alterna `role` entre `admin` e `operador` via `PUT /api/usuarios/:id`
- Não aparece na linha do próprio usuário logado (evita auto-rebaixamento acidental)

### Isolamento não-admin

- `GET /api/usuarios` retorna array com apenas o próprio registro para não-admin
- `PUT /api/usuarios/:id` aceita apenas o próprio id para não-admin (outros → 403)
- Tela `/usuarios` redireciona não-admin automaticamente para `/perfil`

---

## Estado React — MeuPerfil.jsx

| State | Tipo | Descrição |
|-------|------|-----------|
| `perfil` | object\|null | Dados do usuário carregados via `authApi.me()` |
| `form` | object | `{ nome, email, funcao }` — campos editáveis |
| `salvandoDados` | boolean | Loading do botão Salvar informações |
| `erroDados` | string | Mensagem de erro ao salvar dados pessoais |
| `sucesso` | string | Mensagem de sucesso temporária (3s) |
| `senhaAberta` | boolean | Toggle do formulário inline de senha |
| `novaSenha` | string | Campo da nova senha |
| `mostrarSenha` | boolean | Toggle mostrar/ocultar senha |
| `salvandoSenha` | boolean | Loading do botão Confirmar senha |
| `erroSenha` | string | Mensagem de erro ao salvar senha |
| `sucessoSenha` | boolean | Feedback de senha alterada (4s) |

---

## Componentes e páginas

| Arquivo | Descrição |
|---------|-----------|
| `pages/MeuPerfil.jsx` | Tela `/perfil` — identidade (avatar com iniciais, nome, badges), informações pessoais, segurança inline, atividades. Full-width. Acessível a todos os usuários. |
| `pages/RedefinirSenha.jsx` | Rota pública `/redefinir-senha?token=...` — formulário de nova senha; tela de sucesso pós-reset. |
| `pages/Usuarios.jsx` | Admin: CRUD completo + toggleAdmin. Não-admin: redireciona para `/perfil`. |
| `pages/Login.jsx` | `ModalEsqueceuSenha` — campo loginOuEmail, chamada `authApi.esquecerSenha()`, tela de confirmação. |

---

## Avatar com iniciais

- Cor determinística por hash do nome: `AVATAR_COLORS[hash % 10]` — mesma cor sempre para o mesmo nome
- Iniciais: primeira letra do primeiro e último nome (ou só primeira letra se nome único)
- Ícone câmera decorativo no canto inferior direito do avatar (sem funcionalidade de upload)

---

## Variáveis de ambiente (backend)

Além das variáveis base, o módulo usa:

```env
SMTP_HOST=           # Ex: smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false    # true para porta 465
SMTP_USER=           # Ex: conta@gmail.com
SMTP_PASS=           # Senha de app ou senha SMTP
SMTP_FROM=           # Ex: "Krakion <noreply@krakion.com>"
APP_URL=http://localhost:3000  # URL base para o link de reset
```
