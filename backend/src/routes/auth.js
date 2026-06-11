const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const rateLimit = require('express-rate-limit')
const autenticar = require('../middleware/autenticar')
const { hashToken, captchaValido, criarTransporter } = require('../lib/authUtils')

const router = express.Router()
const prisma = require('../lib/prisma')

// Rate limiter específico para login: 10 tentativas / 15min por IP
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
})

// Rate limiter para recuperação de senha: 5 tentativas / 15min por IP
const recuperacaoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
})

// Rate limiter para auto-cadastro: 5 contas / 15min por IP
const registroRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de cadastro. Aguarde 15 minutos.' },
})

// POST /api/auth/login
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { login, senha, hcaptchaToken, lembrar } = req.body
    if (!login || !senha) {
      return res.status(400).json({ error: 'Login e senha são obrigatórios' })
    }

    // Verificação hCaptcha (quando token fornecido e secret configurado)
    if (process.env.HCAPTCHA_SECRET && hcaptchaToken) {
      const params = new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET,
        response: hcaptchaToken,
      })
      const r = await fetch('https://hcaptcha.com/siteverify', { method: 'POST', body: params })
      const captchaData = await r.json()
      if (!captchaData.success) {
        return res.status(400).json({ error: 'CAPTCHA inválido. Tente novamente.' })
      }
    }

    const usuario = await prisma.usuario.findUnique({ where: { login } })

    // Verificar bloqueio de conta
    if (usuario?.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
      const minutosRestantes = Math.ceil((usuario.bloqueadoAte - new Date()) / 60000)
      return res.status(429).json({
        error: `Conta bloqueada temporariamente. Tente novamente em ${minutosRestantes} minuto(s).`,
      })
    }

    // Validar credenciais
    const credenciaisValidas = usuario && await bcrypt.compare(senha, usuario.senhaHash)

    if (!credenciaisValidas) {
      if (usuario) {
        const novasTentativas = (usuario.tentativasLogin || 0) + 1
        await prisma.usuario.update({
          where: { login },
          data: {
            tentativasLogin: novasTentativas,
            ...(novasTentativas >= 5 && { bloqueadoAte: new Date(Date.now() + 15 * 60 * 1000) }),
          },
        })
      }
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário inativo. Contate o administrador.' })
    }

    // Login bem-sucedido — resetar contador + gravar ultimoLogin
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tentativasLogin: 0, bloqueadoAte: null, ultimoLogin: new Date() },
    })

    const expiresIn = lembrar ? '30d' : (process.env.JWT_EXPIRES_IN || '8h')
    const token = jwt.sign(
      { id: usuario.id, login: usuario.login, nome: usuario.nome, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn }
    )

    res.json({ token, usuario: { id: usuario.id, login: usuario.login, nome: usuario.nome, role: usuario.role } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', autenticar, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true, login: true, nome: true, role: true,
        email: true, funcao: true, ultimoLogin: true,
        filaFiltro: true, criadoEm: true,
      },
    })
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' })
    res.json(usuario)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/registrar — cria conta (aguarda ativação pelo admin)
router.post('/registrar', registroRateLimit, async (req, res) => {
  try {
    const { nome, login, senha, hcaptchaToken } = req.body

    if (!nome || !login || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }
    if (senha.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' })
    }

    // Em produção (com HCAPTCHA_SECRET configurado) o captcha é obrigatório
    if (!(await captchaValido(hcaptchaToken))) {
      return res.status(400).json({ error: 'CAPTCHA inválido. Tente novamente.' })
    }

    const senhaHash = await bcrypt.hash(senha, 10)
    await prisma.usuario.create({
      data: { login, senhaHash, nome, role: 'operador', ativo: false },
    })

    res.status(201).json({
      ok: true,
      mensagem: 'Conta criada com sucesso! Aguarde a ativação pelo administrador para acessar o sistema.',
    })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: `Login "${req.body.login}" já está em uso` })
    }
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/esqueci-senha — solicita link de recuperação
router.post('/esqueci-senha', recuperacaoRateLimit, async (req, res) => {
  try {
    const { loginOuEmail } = req.body
    if (!loginOuEmail) {
      return res.status(400).json({ error: 'Login ou email são obrigatórios' })
    }

    // Busca por login OU email — sempre retorna a mesma resposta para não vazar dados
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { login: loginOuEmail },
          { email: loginOuEmail },
        ],
        ativo: true,
      },
    })

    // Resposta genérica mesmo se não encontrado (evita enumeração)
    const MSG_PADRAO = { ok: true, mensagem: 'Se o login/email existir em nosso sistema, um link de recuperação foi enviado.' }

    // Sem usuário OU sem email: resposta genérica idêntica (não vaza existência da conta)
    if (!usuario || !usuario.email) return res.json(MSG_PADRAO)

    // Gerar token seguro (64 hex chars = 32 bytes). Armazena apenas o hash SHA-256;
    // o token em texto puro vai só no email e nunca toca o banco.
    const token = crypto.randomBytes(32).toString('hex')
    const expira = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { recuperacaoToken: hashToken(token), recuperacaoExpira: expira },
    })

    // Enviar email se SMTP configurado
    const transporter = criarTransporter()
    if (transporter) {
      const appUrl = process.env.APP_URL || 'http://localhost:3000'
      const link = `${appUrl}/redefinir-senha?token=${token}`
      const remetente = process.env.SMTP_FROM || process.env.SMTP_USER
      await transporter.sendMail({
        from: remetente,
        to: usuario.email,
        subject: 'Redefinição de senha — Krakion Labs',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#4f46e5">Redefinição de senha</h2>
            <p>Olá, <strong>${usuario.nome}</strong>!</p>
            <p>Você solicitou a redefinição de senha. Clique no botão abaixo para criar uma nova senha:</p>
            <p style="margin:24px 0">
              <a href="${link}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                Redefinir minha senha
              </a>
            </p>
            <p style="color:#888;font-size:13px">Este link expira em <strong>1 hora</strong>.</p>
            <p style="color:#888;font-size:13px">Se você não solicitou isso, ignore este email.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#aaa;font-size:11px">Krakion Labs — Sistema Interno</p>
          </div>
        `,
      })
    }

    res.json(MSG_PADRAO)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/redefinir-senha — valida token e redefine senha
router.post('/redefinir-senha', recuperacaoRateLimit, async (req, res) => {
  try {
    const { token, novaSenha } = req.body
    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' })
    }
    if (novaSenha.length < 8) {
      return res.status(400).json({ error: 'Nova senha deve ter no mínimo 8 caracteres' })
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        recuperacaoToken: hashToken(token),
        recuperacaoExpira: { gt: new Date() },
        ativo: true,
      },
    })

    if (!usuario) {
      return res.status(400).json({ error: 'Link de recuperação inválido ou expirado. Solicite um novo.' })
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10)
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senhaHash,
        recuperacaoToken: null,
        recuperacaoExpira: null,
        tentativasLogin: 0,
        bloqueadoAte: null,
      },
    })

    res.json({ ok: true, mensagem: 'Senha redefinida com sucesso! Faça login com a nova senha.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
