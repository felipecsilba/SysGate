require('dotenv').config()
const express = require('express')
const cors = require('cors')

const municipiosRouter = require('./routes/municipios')
const endpointsRouter = require('./routes/endpoints')
const proxyRouter = require('./routes/proxy')
const requisicoesRouter = require('./routes/requisicoes')
const scriptsRouter = require('./routes/scripts')
const sistemasRouter = require('./routes/sistemas')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Rotas
app.use('/api/municipios', municipiosRouter)
app.use('/api/endpoints', endpointsRouter)
app.use('/api/proxy', proxyRouter)
app.use('/api/requisicoes', requisicoesRouter)
app.use('/api/scripts', scriptsRouter)
app.use('/api/sistemas', sistemasRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err)
  res.status(500).json({ error: 'Erro interno do servidor', detail: err.message })
})

app.listen(PORT, () => {
  console.log(`🚀 SysGate Backend rodando em http://localhost:${PORT}`)
  console.log(`   Banco de dados: ${process.env.DATABASE_URL}`)
})
