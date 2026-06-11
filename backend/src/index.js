require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const autenticar = require('./middleware/autenticar')
const authRouter = require('./routes/auth')
const municipiosRouter = require('./routes/municipios')
const endpointsRouter = require('./routes/endpoints')
const proxyRouter = require('./routes/proxy')
const requisicoesRouter = require('./routes/requisicoes')
const scriptsRouter = require('./routes/scripts')
const sistemasRouter = require('./routes/sistemas')
const usuariosRouter = require('./routes/usuarios')
const relatoriosRouter = require('./routes/relatorios')
const portfolioRouter = require('./routes/portfolio')
const catalogoRouter = require('./routes/catalogo')
const chamadosRouter = require('./routes/chamados')
const solicitantesRouter = require('./routes/solicitantes')
const notasRouter = require('./routes/notas')
const conhecimentoRouter = require('./routes/conhecimento')
const portalAuthRouter = require('./routes/portalAuth')
const portalChamadosRouter = require('./routes/portalChamados')

const app = express()
const PORT = process.env.PORT || 3001

// Segurança — headers HTTP
app.use(helmet())

// Confia no proxy reverso (Nginx) para ler o IP real do cliente via X-Real-IP / X-Forwarded-For
app.set('trust proxy', 1)

// Rate limiter global: 50000 req / 15min por IP real
const limiterGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
})
app.use(limiterGeral)

app.use(cors())

// Limite de payload: 1 MB global; apenas a rota de upload de anexos aceita mais.
// Anexo de 5 MB binário vira ~6.7 MB em base64, então a rota de anexos usa 8 MB.
const jsonGlobal = express.json({ limit: '1mb' })
const jsonAnexo = express.json({ limit: '8mb' })
app.use((req, res, next) => {
  if (req.method === 'POST' && /^\/api\/(portal\/)?chamados\/\d+\/anexos\/?$/.test(req.path)) {
    return jsonAnexo(req, res, next)
  }
  return jsonGlobal(req, res, next)
})

// Rotas PÚBLICAS (antes do middleware global de autenticação)
app.use('/api/auth', authRouter)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// PORTAL EXTERNO — trilho de autenticação paralelo (Solicitante).
// Montado antes do `autenticar` interno: /portal/auth tem rotas públicas próprias
// e /portal/chamados se protege com autenticarExterno (tokens internos são rejeitados lá).
app.use('/api/portal/auth', portalAuthRouter)
app.use('/api/portal/chamados', portalChamadosRouter)

// Middleware global — protege todas as rotas abaixo
app.use(autenticar)

// Rotas PROTEGIDAS
app.use('/api/municipios', municipiosRouter)
app.use('/api/endpoints', endpointsRouter)
app.use('/api/proxy', proxyRouter)
app.use('/api/requisicoes', requisicoesRouter)
app.use('/api/scripts', scriptsRouter)
app.use('/api/relatorios', relatoriosRouter)
app.use('/api/sistemas', sistemasRouter)
app.use('/api/usuarios', usuariosRouter)
app.use('/api/portfolio', portfolioRouter)
app.use('/api/catalogo', catalogoRouter)
app.use('/api/chamados', chamadosRouter)
app.use('/api/solicitantes', solicitantesRouter)
app.use('/api/notas', notasRouter)
app.use('/api/conhecimento', conhecimentoRouter)

// Error handler global
app.use((err, req, res, next) => {
  // Erros com status definido (ex.: payload grande do body-parser → 413) preservam o código
  const status = err.status || err.statusCode || 500
  if (status === 413) {
    return res.status(413).json({ error: 'Payload muito grande. Limite excedido.' })
  }
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: err.message || 'Requisição inválida' })
  }
  console.error('Erro não tratado:', err)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

app.listen(PORT, () => {
  console.log(`🚀 Krakion Backend rodando em http://localhost:${PORT}`)
  // Mascara a credencial da connection string (Postgres) antes de logar
  console.log(`   Banco de dados: ${(process.env.DATABASE_URL || '').replace(/:\/\/([^:@/]+):[^@/]+@/, '://$1:****@')}`)
})
