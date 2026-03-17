const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const { PrismaClient } = require('@prisma/client')
const autenticar = require('../middleware/autenticar')

const router = express.Router()
const prisma = new PrismaClient()

// Armazenamento de OTPs em memória: phone → { code, expires, envios }
const otpStore = new Map()

// Rate limiter específico para login: 10 tentativas / 15min por IP
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
})

// Rate limiter para solicitação de código SMS: 5 req / 10min por IP
const smsRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas solicitações de código. Aguarde 10 minutos.' },
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

    // Login bem-sucedido — resetar contador
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tentativasLogin: 0, bloqueadoAte: null },
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
      select: { id: true, login: true, nome: true, role: true, criadoEm: true },
    })
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' })
    res.json(usuario)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/solicitar-codigo — envia OTP por SMS via Twilio
router.post('/solicitar-codigo', smsRateLimit, async (req, res) => {
  try {
    const { telefone } = req.body
    if (!telefone) {
      return res.status(400).json({ error: 'Número de telefone é obrigatório' })
    }

    // Validação básica formato E.164: +55XXXXXXXXXXX
    const telRegex = /^\+[1-9]\d{7,14}$/
    if (!telRegex.test(telefone)) {
      return res.status(400).json({ error: 'Formato inválido. Use o formato internacional: +5511999999999' })
    }

    // Limitar envios por número: máx 3 a cada 10min
    const existente = otpStore.get(telefone)
    if (existente && existente.envios >= 3 && existente.expires > Date.now()) {
      return res.status(429).json({ error: 'Muitos códigos solicitados para este número. Aguarde 10 minutos.' })
    }

    // Gerar código 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutos
    const envios = (existente?.envios || 0) + 1

    otpStore.set(telefone, { codigo, expires, envios })

    // Enviar SMS via Twilio (se configurado)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      await twilio.messages.create({
        body: `Seu código de verificação Krakion Labs: ${codigo}. Válido por 10 minutos.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: telefone,
      })
    } else {
      // Modo desenvolvimento: logar no console
      console.log(`[DEV] OTP para ${telefone}: ${codigo}`)
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Erro ao enviar SMS:', err.message)
    res.status(500).json({ error: 'Falha ao enviar código. Verifique o número e tente novamente.' })
  }
})

// POST /api/auth/registrar — verifica OTP e cria conta
router.post('/registrar', async (req, res) => {
  try {
    const { nome, login, senha, telefone, codigo } = req.body

    if (!nome || !login || !senha || !telefone || !codigo) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }
    if (senha.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' })
    }

    // Verificar OTP
    const otp = otpStore.get(telefone)
    if (!otp || otp.expires < Date.now()) {
      return res.status(400).json({ error: 'Código expirado. Solicite um novo.' })
    }
    if (otp.codigo !== codigo) {
      return res.status(400).json({ error: 'Código incorreto.' })
    }

    // Criar usuário (ativo: false — aguarda aprovação do admin)
    const senhaHash = await bcrypt.hash(senha, 10)
    await prisma.usuario.create({
      data: { login, senhaHash, nome, role: 'operador', ativo: false },
    })

    // Remover OTP usado
    otpStore.delete(telefone)

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

module.exports = router
