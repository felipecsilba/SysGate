const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const { PrismaClient } = require('@prisma/client')
const autenticar = require('../middleware/autenticar')

const router = express.Router()
const prisma = new PrismaClient()

// Rate limiter específico para login: 10 tentativas / 15min por IP
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
})

// POST /api/auth/login
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { login, senha, hcaptchaToken } = req.body
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
      // Incrementar contador de falhas (se o usuário existir)
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

    // Login bem-sucedido — resetar contador
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tentativasLogin: 0, bloqueadoAte: null },
    })

    const token = jwt.sign(
      { id: usuario.id, login: usuario.login, nome: usuario.nome, role: usuario.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
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
      select: { id: true, login: true, nome: true, role: true, criadoEm: true },
    })
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' })
    res.json(usuario)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
