// Helpers de autenticação compartilhados entre o auth interno (routes/auth.js)
// e o auth do portal externo (routes/portalAuth.js).

const crypto = require('crypto')
const nodemailer = require('nodemailer')

// Hash SHA-256 — usado para armazenar tokens de recuperação sem texto puro no banco
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Verifica hCaptcha. Retorna true se o captcha estiver desabilitado (sem secret).
async function captchaValido(hcaptchaToken) {
  if (!process.env.HCAPTCHA_SECRET) return true
  if (!hcaptchaToken) return false
  const params = new URLSearchParams({
    secret: process.env.HCAPTCHA_SECRET,
    response: hcaptchaToken,
  })
  const r = await fetch('https://hcaptcha.com/siteverify', { method: 'POST', body: params })
  const data = await r.json()
  return !!data.success
}

// Cria transporter nodemailer — retorna null se SMTP não estiver configurado
function criarTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

module.exports = { hashToken, captchaValido, criarTransporter }
