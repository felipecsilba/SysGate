const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/endpoints — lista todos, opcionalmente filtrados por módulo
router.get('/', async (req, res) => {
  try {
    const { modulo, sistemaId } = req.query
    const where = {}
    if (modulo) where.modulo = modulo
    if (sistemaId) where.sistemaId = Number(sistemaId)
    const endpoints = await prisma.endpoint.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: [{ modulo: 'asc' }, { nome: 'asc' }],
    })
    const parsed = endpoints.map((ep) => ({
      ...ep,
      bodySchema: ep.bodySchema ? JSON.parse(ep.bodySchema) : [],
    }))
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/endpoints/modulos — lista módulos únicos
router.get('/modulos', async (req, res) => {
  try {
    const { sistemaId } = req.query
    const modulos = await prisma.endpoint.findMany({
      where: sistemaId ? { sistemaId: Number(sistemaId) } : undefined,
      select: { modulo: true },
      distinct: ['modulo'],
      orderBy: { modulo: 'asc' },
    })
    res.json(modulos.map((m) => m.modulo))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/endpoints/swagger — DEVE ficar antes de /:id
router.get('/swagger', async (req, res) => {
  try {
    const specs = await prisma.swaggerSpec.findMany({
      orderBy: { criadoEm: 'desc' },
      select: { id: true, nome: true, versao: true, urlBase: true, totalEndpoints: true, criadoEm: true },
    })
    res.json(specs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/endpoints/:id
router.get('/:id', async (req, res) => {
  try {
    const ep = await prisma.endpoint.findUnique({ where: { id: Number(req.params.id) } })
    if (!ep) return res.status(404).json({ error: 'Endpoint não encontrado' })
    res.json({ ...ep, bodySchema: ep.bodySchema ? JSON.parse(ep.bodySchema) : [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/endpoints — cria
router.post('/', async (req, res) => {
  try {
    const { modulo, nome, path, metodo, descricao, bodySchema } = req.body
    if (!modulo || !nome || !path || !metodo) {
      return res.status(400).json({ error: 'Campos obrigatórios: modulo, nome, path, metodo' })
    }
    const ep = await prisma.endpoint.create({
      data: {
        modulo,
        nome,
        path,
        metodo: metodo.toUpperCase(),
        descricao,
        bodySchema: bodySchema ? JSON.stringify(bodySchema) : null,
      },
    })
    res.status(201).json({ ...ep, bodySchema: ep.bodySchema ? JSON.parse(ep.bodySchema) : [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/endpoints/:id
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { modulo, nome, path, metodo, descricao, bodySchema } = req.body
    const ep = await prisma.endpoint.update({
      where: { id },
      data: {
        ...(modulo && { modulo }),
        ...(nome && { nome }),
        ...(path && { path }),
        ...(metodo && { metodo: metodo.toUpperCase() }),
        descricao: descricao !== undefined ? descricao : undefined,
        bodySchema: bodySchema !== undefined ? JSON.stringify(bodySchema) : undefined,
      },
    })
    res.json({ ...ep, bodySchema: ep.bodySchema ? JSON.parse(ep.bodySchema) : [] })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Endpoint não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/endpoints/limpar-tudo — apaga todos endpoints + specs importadas do swagger
router.delete('/limpar-tudo', async (req, res) => {
  try {
    await prisma.requisicao.updateMany({ data: { endpointId: null } })
    const specs = await prisma.swaggerSpec.deleteMany()
    const endpoints = await prisma.endpoint.deleteMany()
    res.json({ ok: true, endpointsDeletados: endpoints.count, specsDeletadas: specs.count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/endpoints/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.requisicao.updateMany({
      where: { endpointId: Number(req.params.id) },
      data: { endpointId: null },
    })
    await prisma.endpoint.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Endpoint não encontrado' })
    res.status(500).json({ error: err.message })
  }
})

// POST /api/endpoints/importar — importa array de endpoints via JSON
router.post('/importar', async (req, res) => {
  try {
    const endpoints = req.body
    if (!Array.isArray(endpoints)) return res.status(400).json({ error: 'Envie um array de endpoints' })

    const criados = []
    for (const ep of endpoints) {
      const { modulo, nome, path, metodo, descricao, bodySchema } = ep
      if (!modulo || !nome || !path || !metodo) continue
      const created = await prisma.endpoint.create({
        data: {
          modulo,
          nome,
          path,
          metodo: metodo.toUpperCase(),
          descricao,
          bodySchema: bodySchema ? JSON.stringify(bodySchema) : null,
        },
      })
      criados.push(created)
    }
    res.status(201).json({ importados: criados.length, endpoints: criados })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── SWAGGER / OPENAPI IMPORT ────────────────────────────────────────────────

/**
 * Resolve uma referência $ref simples dentro da spec.
 * Suporta apenas refs internas: "#/components/schemas/Foo" (OAS3)
 * e "#/definitions/Foo" (Swagger 2).
 */
function resolveRef(spec, ref) {
  if (!ref || !ref.startsWith('#/')) return null
  const parts = ref.replace('#/', '').split('/')
  let cur = spec
  for (const part of parts) {
    if (cur == null) return null
    cur = cur[decodeURIComponent(part)]
  }
  return cur
}

/**
 * Resolve $ref e allOf/anyOf recursivamente (1 nível de profundidade).
 * Retorna um schema "achatado" com { type, properties, required, description }.
 */
function resolveSchema(spec, schema, _depth = 0) {
  if (!schema || _depth > 5) return {}
  if (schema.$ref) return resolveSchema(spec, resolveRef(spec, schema.$ref), _depth + 1)

  // allOf: mescla todas as propriedades (inclui props extras no mesmo nível)
  if (schema.allOf) {
    const base = schema.allOf.reduce((acc, s) => {
      const r = resolveSchema(spec, s, _depth + 1)
      return {
        ...acc,
        type: acc.type || r.type,
        description: acc.description || r.description,
        required: [...(acc.required || []), ...(r.required || [])],
        properties: { ...(acc.properties || {}), ...(r.properties || {}) },
      }
    }, {})
    // Mescla também propriedades declaradas fora do allOf (no mesmo schema)
    return {
      ...base,
      type: base.type || schema.type,
      required: [...(base.required || []), ...(schema.required || [])],
      properties: { ...(base.properties || {}), ...(schema.properties || {}) },
    }
  }

  // anyOf / oneOf: usa o primeiro
  if (schema.anyOf || schema.oneOf) {
    return resolveSchema(spec, (schema.anyOf || schema.oneOf)[0], _depth + 1)
  }

  return schema
}

/**
 * Extrai os campos do body a partir de um schema OpenAPI.
 * Retorna array de { campo, tipo, obrigatorio, descricao, exemplo }.
 */
function extrairCampos(spec, schema) {
  const resolved = resolveSchema(spec, schema)
  if (!resolved) return []

  // Body é array → extrai campos do items (a API espera um array de objetos com esses campos)
  if (resolved.type === 'array' && resolved.items) {
    return extrairCampos(spec, resolved.items)
  }

  // Aceita schemas com properties mesmo sem type: 'object' explícito (válido em OpenAPI)
  const props = resolved.properties || {}
  if (resolved.type && resolved.type !== 'object') return []
  if (!resolved.type && Object.keys(props).length === 0) return []

  const required = resolved.required || []

  return Object.entries(props).map(([campo, def]) => {
    const defR = resolveSchema(spec, def)
    let tipo = defR.type || 'string'
    // array com items
    if (tipo === 'array' && defR.items) {
      const itemsR = resolveSchema(spec, defR.items)
      tipo = `array<${itemsR.type || 'object'}>`
    }
    // objeto aninhado com properties → marca como "object"
    if (!defR.type && defR.properties) tipo = 'object'
    // Para campos object, extrai sub-campos recursivamente (preserva enum de campos aninhados)
    const subFields = (tipo === 'object' && (defR.properties || defR.type === 'object'))
      ? extrairCampos(spec, defR)
      : null
    return {
      campo,
      tipo,
      obrigatorio: required.includes(campo),
      descricao: defR.description || defR.title || '',
      exemplo: defR.example !== undefined ? String(defR.example) : '',
      enum: Array.isArray(defR.enum) ? defR.enum.map(String) : null,
      subFields: subFields?.length ? subFields : null,
    }
  })
}

/**
 * Extrai todos os endpoints de uma spec OpenAPI 3.x ou Swagger 2.x.
 * Retorna array de { modulo, nome, path, metodo, descricao, bodySchema }.
 */
function parsearSwagger(spec) {
  const endpoints = []
  const paths = spec.paths || {}
  const METODOS_HTTP = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

  for (const [pathStr, pathItem] of Object.entries(paths)) {
    for (const metodo of METODOS_HTTP) {
      const op = pathItem[metodo]
      if (!op) continue

      // Módulo: primeira tag ou "Geral"
      const modulo = (op.tags && op.tags[0]) || 'Geral'
      // Nome: summary > operationId > "metodo path"
      const nome = op.summary || op.operationId || `${metodo.toUpperCase()} ${pathStr}`
      const descricao = op.description || op.summary || ''

      // Body schema — OpenAPI 3
      let bodySchema = []
      let bodyExemplo = null
      if (op.requestBody) {
        const content = op.requestBody.content || {}
        const jsonContent = content['application/json'] || content['application/x-www-form-urlencoded'] || Object.values(content)[0]
        if (jsonContent?.schema) {
          bodySchema = extrairCampos(spec, jsonContent.schema)

          // Captura o exemplo completo do body (para pré-preencher o JSON raw)
          if (jsonContent.example !== undefined) {
            bodyExemplo = jsonContent.example
          } else if (jsonContent.examples) {
            const firstEx = Object.values(jsonContent.examples)[0]
            if (firstEx?.value !== undefined) bodyExemplo = firstEx.value
          } else {
            const resolved = resolveSchema(spec, jsonContent.schema)
            if (resolved?.example !== undefined) {
              // Array schema: envolve em array se necessário
              bodyExemplo = resolved.type === 'array' ? resolved.example : resolved.example
            } else if (resolved?.type === 'array' && resolved?.items) {
              const itemsR = resolveSchema(spec, resolved.items)
              if (itemsR?.example !== undefined) bodyExemplo = [itemsR.example]
            }
          }
        }
      }

      // Body schema — Swagger 2 (parameters com in: body)
      if (bodySchema.length === 0 && Array.isArray(op.parameters)) {
        const bodyParam = op.parameters.find((p) => p.in === 'body')
        if (bodyParam?.schema) {
          bodySchema = extrairCampos(spec, bodyParam.schema)
        }
      }

      // Embute o exemplo no início do bodySchema como sentinel
      if (bodyExemplo !== null && bodySchema.length > 0) {
        bodySchema = [{ _exemplo: true, json: bodyExemplo }, ...bodySchema]
      }

      endpoints.push({ modulo, nome, path: pathStr, metodo: metodo.toUpperCase(), descricao, bodySchema })
    }
  }

  return endpoints
}

/**
 * Tenta extrair a URL do spec JSON embutida em uma página HTML do Swagger UI.
 * Cobre padrões comuns: SwaggerUIBundle({url:...}), configUrl, link rel, etc.
 */
function extrairSpecUrlDoHtml(html, paginaUrl) {
  const padroes = [
    // SwaggerUIBundle({ url: "..." })
    /SwaggerUIBundle\s*\(\s*\{[^}]*?url\s*:\s*["']([^"']+)["']/s,
    // url: "..." em qualquer contexto JS
    /[,{]\s*url\s*:\s*["']([^"']*(?:swagger|openapi|api-docs)[^"']*)["']/i,
    // configUrl= em query string
    /configUrl=([^"'&\s]+)/,
    // href para .json
    /href=["']([^"']*\.json[^"']*)["']/i,
    // src para swagger-initializer ou similares que contenham a url
    /["']([^"']*\/swagger\.json[^"']*)["']/i,
    /["']([^"']*\/openapi\.json[^"']*)["']/i,
    /["']([^"']*\/api-docs(?:\.json)?[^"']*)["']/i,
  ]

  for (const padrao of padroes) {
    const match = html.match(padrao)
    if (match) {
      const encontrado = decodeURIComponent(match[1])
      // Se já é absoluto, devolve direto
      if (/^https?:\/\//i.test(encontrado)) return encontrado
      // Caso contrário, resolve relativo à página
      try {
        return new URL(encontrado, paginaUrl).toString()
      } catch {
        return null
      }
    }
  }
  return null
}

// POST /api/endpoints/fetch-swagger
// Body: { url, nome?, headers? }
// O backend faz o fetch server-side (sem CORS) e devolve a spec parseada
// Query: ?preview=true → apenas analisa, não salva
router.post('/fetch-swagger', async (req, res) => {
  const axios = require('axios')
  try {
    const { url, nome, headers: headersExtras, sistemaId } = req.body
    if (!url) return res.status(400).json({ error: 'Campo "url" é obrigatório' })

    const headersBase = {
      Accept: 'application/json, */*',
      'User-Agent': 'SysGate/1.0',
      ...(headersExtras || {}),
    }

    let fetchUrl = url
    let response = await axios.get(fetchUrl, {
      headers: headersBase,
      timeout: 15000,
      validateStatus: () => true,
    })

    // ── Detecta página HTML do Swagger UI e tenta extrair o URL do JSON ──
    const contentType = String(response.headers['content-type'] || '')
    const isHtml = contentType.includes('text/html') ||
      (typeof response.data === 'string' && response.data.trimStart().startsWith('<!'))

    if (response.status === 200 && isHtml) {
      const specUrl = extrairSpecUrlDoHtml(response.data, url)
      if (specUrl) {
        // Faz um segundo fetch para o JSON real
        const r2 = await axios.get(specUrl, {
          headers: headersBase,
          timeout: 15000,
          validateStatus: () => true,
        })
        if (r2.status === 200) {
          fetchUrl = specUrl
          response = r2
        }
      } else {
        return res.status(422).json({
          error:
            'A URL aponta para uma página HTML do Swagger UI, mas não foi possível detectar o URL do swagger.json automaticamente. ' +
            'Abra F12 → Network → recarregue a página → copie o URL da requisição que retorna o JSON e cole aqui.',
        })
      }
    }

    if (response.status !== 200) {
      return res.status(502).json({
        error: `A URL retornou HTTP ${response.status}`,
        url: fetchUrl,
      })
    }

    let spec
    try {
      spec = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    } catch {
      return res.status(422).json({
        error:
          'A resposta não é um JSON válido. Verifique se a URL aponta diretamente para o swagger.json / openapi.json.',
      })
    }

    if (!spec.paths && !spec.swagger && !spec.openapi) {
      return res.status(422).json({ error: 'A URL não retornou um arquivo OpenAPI/Swagger válido' })
    }

    const endpointsParsados = parsearSwagger(spec)

    if (req.query.preview === 'true') {
      return res.json({
        total: endpointsParsados.length,
        endpoints: endpointsParsados,
        info: spec.info || {},
        versao: spec.openapi || spec.swagger,
      })
    }

    const versao = spec.openapi || spec.swagger || '?'
    const urlBase = spec.servers?.[0]?.url ||
      (spec.host ? `${spec.schemes?.[0] || 'https'}://${spec.host}${spec.basePath || ''}` : null)

    const specSalva = await prisma.swaggerSpec.create({
      data: {
        nome: nome || spec.info?.title || 'Swagger importado',
        versao,
        urlBase,
        conteudo: JSON.stringify(spec),
        totalEndpoints: endpointsParsados.length,
        sistemaId: sistemaId ? Number(sistemaId) : null,
      },
    })

    const criados = []
    for (const ep of endpointsParsados) {
      const created = await prisma.endpoint.create({
        data: {
          modulo: ep.modulo,
          nome: ep.nome,
          path: ep.path,
          metodo: ep.metodo,
          descricao: ep.descricao || null,
          bodySchema: ep.bodySchema.length ? JSON.stringify(ep.bodySchema) : null,
          sistemaId: sistemaId ? Number(sistemaId) : null,
        },
      })
      criados.push({ ...created, bodySchema: ep.bodySchema })
    }

    res.status(201).json({ spec: specSalva, importados: criados.length, endpoints: criados })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/endpoints/swagger/:id — remove spec (não remove endpoints gerados)
router.delete('/swagger/:id', async (req, res) => {
  try {
    await prisma.swaggerSpec.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Spec não encontrada' })
    res.status(500).json({ error: err.message })
  }
})

// POST /api/endpoints/importar-swagger
// Body: { nome, spec } — spec é o objeto OpenAPI/Swagger completo
// Query: ?preview=true  → apenas retorna endpoints sem salvar
router.post('/importar-swagger', async (req, res) => {
  try {
    const { nome, spec, sistemaId } = req.body
    if (!spec || typeof spec !== 'object') {
      return res.status(400).json({ error: 'Campo "spec" deve ser o objeto JSON da spec OpenAPI' })
    }

    const endpointsParsados = parsearSwagger(spec)

    if (req.query.preview === 'true') {
      return res.json({ total: endpointsParsados.length, endpoints: endpointsParsados })
    }

    // Detecta versão da spec
    const versao = spec.openapi || spec.swagger || '?'
    // URL base — OpenAPI 3: servers[0].url; Swagger 2: host + basePath
    const urlBase =
      spec.servers?.[0]?.url ||
      (spec.host ? `${spec.schemes?.[0] || 'https'}://${spec.host}${spec.basePath || ''}` : null)

    // Salva a spec bruta
    const specSalva = await prisma.swaggerSpec.create({
      data: {
        nome: nome || spec.info?.title || 'Swagger importado',
        versao,
        urlBase,
        conteudo: JSON.stringify(spec),
        totalEndpoints: endpointsParsados.length,
        sistemaId: sistemaId ? Number(sistemaId) : null,
      },
    })

    // Cria os endpoints no banco
    const criados = []
    for (const ep of endpointsParsados) {
      const created = await prisma.endpoint.create({
        data: {
          modulo: ep.modulo,
          nome: ep.nome,
          path: ep.path,
          metodo: ep.metodo,
          descricao: ep.descricao || null,
          bodySchema: ep.bodySchema.length ? JSON.stringify(ep.bodySchema) : null,
          sistemaId: sistemaId ? Number(sistemaId) : null,
        },
      })
      criados.push({ ...created, bodySchema: ep.bodySchema })
    }

    res.status(201).json({
      spec: specSalva,
      importados: criados.length,
      endpoints: criados,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
