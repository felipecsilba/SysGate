// Autenticação do PORTAL EXTERNO — trilho paralelo sobre o modelo Solicitante.
// Externos NUNCA entram no modelo Usuario: o JWT carrega { sid, tipo: 'externo' }
// e é rejeitado pelo middleware interno (autenticar.js). Ver krakion-analise-fable5.md (Fase 2).

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const rateLimit = require('express-rate-limit')
const { autenticarExterno } = require('../middleware/autenticar')
const { hashToken, captchaValido, criarTransporter } = require('../lib/authUtils')

const router = express.Router()
const prisma = require('../lib/prisma')

// Campos do solicitante expostos ao próprio dono da conta — nunca credenciais
const SELECT_CONTA = { id: true, nome: true, cargo: true, email: true, telefone: true, municipio: true, contaAtiva: true }

// Rate limiters — mesmos parâmetros do auth interno
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
})

const registroRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de cadastro. Aguarde 15 minutos.' },
})

const recuperacaoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
})

// POST /api/portal/auth/registrar — cria conta de solicitante (aguarda aprovação da equipe)
router.post('/registrar', registroRateLimit, async (req, res) => {
  try {
    const { nome, email, senha, cargo, telefone, municipio, hcaptchaToken } = req.body

    if (!nome?.trim() || !email?.trim() || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
    }
    if (senha.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' })
    }
    if (!(await captchaValido(hcaptchaToken))) {
      return res.status(400).json({ error: 'CAPTCHA inválido. Tente novamente.' })
    }

    const emailNorm = email.trim()
    const senhaHash = await bcrypt.hash(senha, 10)
    const existente = await prisma.solicitante.findUnique({ where: { email: emailNorm } })

    if (existente?.senhaHash) {
      return res.status(409).json({ error: 'Este email já possui uma conta no portal' })
    }

    if (existente) {
      // Solicitante já cadastrado pela equipe (sem conta) — só vincula credenciais
      await prisma.solicitante.update({
        where: { id: existente.id },
        data: { senhaHash, contaAtiva: false },
      })
    } else {
      await prisma.solicitante.create({
        data: {
          nome: nome.trim(),
          email: emailNorm,
          senhaHash,
          cargo: cargo?.trim() || null,
          telefone: telefone?.trim() || null,
          municipio: municipio?.trim() || null,
          contaAtiva: false,
        },
      })
    }

    res.status(201).json({
      ok: true,
      mensagem: 'Conta criada com sucesso! Aguarde a aprovação da equipe para acessar o portal.',
    })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Este email já possui uma conta no portal' })
    }
    console.error('Erro no registro do portal:', err)
    res.status(500).json({ error: 'Erro ao criar conta' })
  }
})

// POST /api/portal/auth/login
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { email, senha, hcaptchaToken, lembrar } = req.body
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }

    // Verificação hCaptcha (quando token fornecido e secret configurado)
    if (process.env.HCAPTCHA_SECRET && hcaptchaToken) {
      if (!(await captchaValido(hcaptchaToken))) {
        return res.status(400).json({ error: 'CAPTCHA inválido. Tente novamente.' })
      }
    }

    const solicitante = await prisma.solicitante.findUnique({ where: { email: String(email).trim() } })

    // Lockout — mesmo padrão do login interno
    if (solicitante?.bloqueadoAte && solicitante.bloqueadoAte > new Date()) {
      const minutosRestantes = Math.ceil((solicitante.bloqueadoAte - new Date()) / 60000)
      return res.status(429).json({
        error: `Conta bloqueada temporariamente. Tente novamente em ${minutosRestantes} minuto(s).`,
      })
    }

    const credenciaisValidas = solicitante?.senhaHash && await bcrypt.compare(senha, solicitante.senhaHash)

    if (!credenciaisValidas) {
      if (solicitante?.senhaHash) {
        const novasTentativas = (solicitante.tentativasLogin || 0) + 1
        await prisma.solicitante.update({
          where: { id: solicitante.id },
          data: {
            tentativasLogin: novasTentativas,
            ...(novasTentativas >= 5 && { bloqueadoAte: new Date(Date.now() + 15 * 60 * 1000) }),
          },
        })
      }
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    if (!solicitante.contaAtiva) {
      return res.status(401).json({ error: 'Conta aguardando aprovação da equipe.' })
    }

    await prisma.solicitante.update({
      where: { id: solicitante.id },
      data: { tentativasLogin: 0, bloqueadoAte: null },
    })

    const expiresIn = lembrar ? '30d' : (process.env.JWT_EXPIRES_IN || '8h')
    const token = jwt.sign(
      { sid: solicitante.id, nome: solicitante.nome, email: solicitante.email, tipo: 'externo' },
      process.env.JWT_SECRET,
      { expiresIn }
    )

    res.json({
      token,
      solicitante: {
        id: solicitante.id,
        nome: solicitante.nome,
        email: solicitante.email,
        cargo: solicitante.cargo,
        municipio: solicitante.municipio,
      },
    })
  } catch (err) {
    console.error('Erro no login do portal:', err)
    res.status(500).json({ error: 'Erro ao realizar login' })
  }
})

// POST /api/portal/auth/logout
router.post('/logout', (req, res) => {
  res.json({ ok: true })
})

// GET /api/portal/auth/me
router.get('/me', autenticarExterno, async (req, res) => {
  try {
    const solicitante = await prisma.solicitante.findUnique({
      where: { id: req.solicitante.sid },
      select: SELECT_CONTA,
    })
    if (!solicitante) return res.status(404).json({ error: 'Conta não encontrada' })
    res.json(solicitante)
  } catch (err) {
    console.error('Erro no /me do portal:', err)
    res.status(500).json({ error: 'Erro ao buscar conta' })
  }
})

// POST /api/portal/auth/esqueci-senha — sempre retorna resposta genérica (não vaza existência)
router.post('/esqueci-senha', recuperacaoRateLimit, async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' })
    }

    const MSG_PADRAO = { ok: true, mensagem: 'Se o email existir em nosso sistema, um link de recuperação foi enviado.' }

    const solicitante = await prisma.solicitante.findUnique({ where: { email: String(email).trim() } })
    if (!solicitante?.senhaHash) return res.json(MSG_PADRAO)

    // Armazena apenas o hash SHA-256; o token puro só viaja no email
    const token = crypto.randomBytes(32).toString('hex')
    const expira = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await prisma.solicitante.update({
      where: { id: solicitante.id },
      data: { recuperacaoTokenHash: hashToken(token), recuperacaoExpira: expira },
    })

    const transporter = criarTransporter()
    if (transporter) {
      const appUrl = process.env.APP_URL || 'http://localhost:3000'
      const link = `${appUrl}/portal/redefinir-senha?token=${token}`
      const remetente = process.env.SMTP_FROM || process.env.SMTP_USER
      await transporter.sendMail({
        from: remetente,
        to: solicitante.email,
        subject: 'Redefinição de senha — Portal de Atendimento',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#4f46e5">Redefinição de senha</h2>
            <p>Olá, <strong>${solicitante.nome}</strong>!</p>
            <p>Você solicitou a redefinição de senha do Portal de Atendimento. Clique no botão abaixo para criar uma nova senha:</p>
            <p style="margin:24px 0">
              <a href="${link}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
                Redefinir minha senha
              </a>
            </p>
            <p style="color:#888;font-size:13px">Este link expira em <strong>1 hora</strong>.</p>
            <p style="color:#888;font-size:13px">Se você não solicitou isso, ignore este email.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#aaa;font-size:11px">Portal de Atendimento — Krakion Labs</p>
          </div>
        `,
      })
    }

    res.json(MSG_PADRAO)
  } catch (err) {
    console.error('Erro no esqueci-senha do portal:', err)
    res.status(500).json({ error: 'Erro ao processar solicitação' })
  }
})

// POST /api/portal/auth/redefinir-senha — valida token e redefine senha
router.post('/redefinir-senha', recuperacaoRateLimit, async (req, res) => {
  try {
    const { token, novaSenha } = req.body
    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' })
    }
    if (novaSenha.length < 8) {
      return res.status(400).json({ error: 'Nova senha deve ter no mínimo 8 caracteres' })
    }

    const solicitante = await prisma.solicitante.findFirst({
      where: {
        recuperacaoTokenHash: hashToken(token),
        recuperacaoExpira: { gt: new Date() },
      },
    })

    if (!solicitante) {
      return res.status(400).json({ error: 'Link de recuperação inválido ou expirado. Solicite um novo.' })
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10)
    await prisma.solicitante.update({
      where: { id: solicitante.id },
      data: {
        senhaHash,
        recuperacaoTokenHash: null,
        recuperacaoExpira: null,
        tentativasLogin: 0,
        bloqueadoAte: null,
      },
    })

    res.json({ ok: true, mensagem: 'Senha redefinida com sucesso! Faça login com a nova senha.' })
  } catch (err) {
    console.error('Erro no redefinir-senha do portal:', err)
    res.status(500).json({ error: 'Erro ao redefinir senha' })
  }
})

module.exports = router
