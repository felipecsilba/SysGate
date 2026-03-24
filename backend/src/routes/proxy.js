const express = require('express')
const axios = require('axios')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

const HISTORICO_MAX = 200

async function salvarRequisicao(data) {
  try {
    await prisma.requisicao.create({ data })
    // Mantém apenas as últimas 20 por município
    const todas = await prisma.requisicao.findMany({
      where: { municipioId: data.municipioId },
      orderBy: { criadoEm: 'desc' },
      select: { id: true },
    })
    if (todas.length > HISTORICO_MAX) {
      const idsParaRemover = todas.slice(HISTORICO_MAX).map((r) => r.id)
      await prisma.requisicao.deleteMany({ where: { id: { in: idsParaRemover } } })
    }
  } catch (err) {
    console.error('Erro ao salvar histórico:', err.message)
  }
}

// POST /api/proxy/executar
// Body: { municipioId, sistemaId, endpointId?, path, metodo, body?, queryParams?, headersExtras? }
router.post('/executar', async (req, res) => {
  const { municipioId, sistemaId, endpointId, path: apiPath, metodo, body, queryParams, headersExtras, tipo } = req.body

  if (!municipioId || !sistemaId || !apiPath || !metodo) {
    return res.status(400).json({ error: 'Campos obrigatórios: municipioId, sistemaId, path, metodo' })
  }

  // Verifica que o município pertence ao usuário logado (impede uso indevido de tokens alheios)
  const municipioDoUsuario = await prisma.municipio.findFirst({
    where: { id: Number(municipioId), usuarioId: req.usuario.id },
    select: { id: true },
  })
  if (!municipioDoUsuario) {
    return res.status(403).json({ error: 'Acesso negado: este município não pertence ao seu usuário.' })
  }

  // Carrega vínculo município+sistema (contém token e ambiente)
  const vinculo = await prisma.municipioSistema.findUnique({
    where: { municipioId_sistemaId: { municipioId: Number(municipioId), sistemaId: Number(sistemaId) } },
    include: { sistema: true, municipio: true },
  })
  if (!vinculo) {
    return res.status(404).json({
      error: 'Token não configurado para este sistema neste município. Configure em Municípios → Tokens.',
    })
  }
  if (!vinculo.token || vinculo.token.trim() === '') {
    return res.status(400).json({
      error: 'Token configurado está vazio. Edite o token em Municípios → Tokens.',
    })
  }

  const url = `${vinculo.sistema.urlBase}${apiPath}`
  const headers = {
    'Authorization': `Bearer ${vinculo.token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(headersExtras || {}),
  }

  const inicio = Date.now()
  let statusCode = null
  let resposta = null

  try {
    const axiosResponse = await axios({
      method: metodo.toLowerCase(),
      url,
      headers,
      params: queryParams || {},
      data: body || undefined,
      validateStatus: () => true, // nunca lança exceção por status HTTP
      timeout: 30000,
    })

    statusCode = axiosResponse.status
    resposta = axiosResponse.data

    const duracaoMs = Date.now() - inicio

    // Extrai o ID gerado pela API na resposta (tenta campos comuns)
    let idGerado = null
    if (Array.isArray(resposta)) {
      const ids = resposta
        .map((item) => item?.id ?? item?.idGerado ?? item?.idEconomico ?? item?.idLote)
        .filter((v) => v != null)
        .map(String)
      idGerado = ids.length > 0 ? ids.join(',') : null
    } else {
      idGerado =
        resposta?.id?.toString() ||
        resposta?.idGerado?.toString() ||
        resposta?.idEconomico?.toString() ||
        null
    }

    await salvarRequisicao({
      municipioId: Number(municipioId),
      sistemaId: sistemaId ? Number(sistemaId) : null,
      endpointId: endpointId ? Number(endpointId) : null,
      metodo: metodo.toUpperCase(),
      url,
      headers: JSON.stringify(headers),
      body: body ? JSON.stringify(body) : null,
      statusCode,
      resposta: JSON.stringify(resposta),
      duracaoMs,
      tipo: tipo || 'individual',
      idGerado,
    })

    return res.json({
      statusCode,
      duracaoMs,
      url,
      metodo: metodo.toUpperCase(),
      headers: {
        'content-type': axiosResponse.headers['content-type'],
        'x-total-count': axiosResponse.headers['x-total-count'],
        'x-ratelimit-remaining': axiosResponse.headers['x-ratelimit-remaining'],
      },
      data: resposta,
    })
  } catch (err) {
    const duracaoMs = Date.now() - inicio
    const errMsg = err.message

    await salvarRequisicao({
      municipioId: Number(municipioId),
      sistemaId: sistemaId ? Number(sistemaId) : null,
      endpointId: endpointId ? Number(endpointId) : null,
      metodo: metodo.toUpperCase(),
      url,
      headers: JSON.stringify(headers),
      body: body ? JSON.stringify(body) : null,
      statusCode: err.response?.status || 0,
      resposta: JSON.stringify({ error: errMsg }),
      duracaoMs,
      tipo: tipo || 'individual',
      idGerado: null,
    })

    return res.status(502).json({
      error: 'Erro ao chamar a API',
      detail: errMsg,
      url,
    })
  }
})

module.exports = router
