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

const app = express()
const PORT = process.env.PORT || 3001

// Segurança — headers HTTP
app.use(helmet())

// Rate limiter global: 200 req / 15min por IP
const limiterGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
})
app.use(limiterGeral)

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Rotas PÚBLICAS (antes do middleware global de autenticação)
app.use('/api/auth', authRouter)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

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

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err)
  res.status(500).json({ error: 'Erro interno do servidor', detail: err.message })
})

app.listen(PORT, () => {
  console.log(`🚀 SysGate Backend rodando em http://localhost:${PORT}`)
  console.log(`   Banco de dados: ${process.env.DATABASE_URL}`)
})
