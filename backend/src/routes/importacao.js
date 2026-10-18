const express = require('express')
const { exigirAdmin } = require('../middleware/autenticar')
const { entrar, buscarTudo } = require('../lib/clienteKrakionWeb')
const { casarPorNome, prepararEndpoint, prepararTokens, resumir } = require('../lib/importacaoWeb')

const router = express.Router()
const prisma = require('../lib/prisma')

// Só existe no Krakion Desktop (backend local iniciado pelo app) e só para admin.
// Na VPS a env não existe → 404, como se a rota não existisse.
router.use((req, res, next) => {
  if (process.env.KRAKION_DESKTOP !== '1') return res.status(404).json({ error: 'Não encontrado' })
  next()
}, exigirAdmin)

// Erros da VPS: 401 de lá vira 400 aqui — senão o app entenderia que a sessão LOCAL caiu
function responderErro(res, e) {
  const status = e.status === 401 ? 400 : (e.status || 500)
  if (status >= 500 && !e.status) console.error('[importacao]', e)
  res.status(status).json({ error: e.status ? e.message : 'Falha na importação. Veja o log do app.' })
}

// POST /api/importacao/conectar — entra na VPS e devolve o resumo do que dá para importar
router.post('/conectar', async (req, res) => {
  try {
    const { url, login, senha } = req.body
    if (!login || !senha) return res.status(400).json({ error: 'Informe login e senha do Krakion web.' })
    const sessao = await entrar(url, login, senha)
    const dados = await buscarTudo(sessao.base, sessao.token)
    res.json({ url: sessao.base, tokenRemoto: sessao.token, usuarioRemoto: sessao.usuario, resumo: resumir(dados) })
  } catch (e) {
    responderErro(res, e)
  }
})

// POST /api/importacao/executar — busca de novo na VPS e grava tudo numa transação
router.post('/executar', async (req, res) => {
  try {
    const { url, tokenRemoto, sistemas: comSistemas, municipios: comMunicipios } = req.body
    if (!tokenRemoto) return res.status(400).json({ error: 'Conecte ao Krakion web antes de importar.' })
    if (!comSistemas && !comMunicipios) return res.status(400).json({ error: 'Escolha o que importar.' })

    const remoto = await buscarTudo(url, tokenRemoto)
    const usuarioId = req.usuario.id

    const resultado = await prisma.$transaction(async tx => {
      const r = { sistemasCriados: 0, sistemasAtualizados: 0, endpoints: 0, municipiosCriados: 0, municipiosAtualizados: 0, tokens: 0, tokensIgnorados: 0 }
      const mapaSistemas = new Map() // id remoto → id local

      // Sistemas + endpoints (a VPS vence: endpoints do sistema são substituídos)
      const planoSistemas = casarPorNome(remoto.sistemas, await tx.sistema.findMany({ select: { id: true, nome: true } }))
      for (const { remoto: s, localId } of planoSistemas) {
        if (!comSistemas) {
          if (localId) mapaSistemas.set(s.id, localId) // tokens ainda casam com sistemas que já existem
          continue
        }
        const dados = { nome: s.nome, urlBase: s.urlBase, descricao: s.descricao ?? null }
        const local = localId
          ? await tx.sistema.update({ where: { id: localId }, data: dados })
          : await tx.sistema.create({ data: dados })
        localId ? r.sistemasAtualizados++ : r.sistemasCriados++
        mapaSistemas.set(s.id, local.id)

        await tx.endpoint.deleteMany({ where: { sistemaId: local.id } })
        const eps = remoto.endpoints.filter(e => e.sistemaId === s.id).map(e => prepararEndpoint(e, local.id))
        if (eps.length) await tx.endpoint.createMany({ data: eps })
        r.endpoints += eps.length
      }

      // Municípios (do usuário local) + tokens
      if (comMunicipios) {
        const locais = await tx.municipio.findMany({ where: { usuarioId }, select: { id: true, nome: true } })
        const mapaMunicipios = new Map()
        for (const { remoto: m, localId } of casarPorNome(remoto.municipios, locais)) {
          const local = localId
            ? await tx.municipio.update({ where: { id: localId }, data: { nome: m.nome, observacoes: m.observacoes ?? null } })
            : await tx.municipio.create({ data: { nome: m.nome, observacoes: m.observacoes ?? null, ativo: false, usuarioId } })
          localId ? r.municipiosAtualizados++ : r.municipiosCriados++
          mapaMunicipios.set(m.id, local.id)
        }

        const { tokens, ignorados } = prepararTokens(remoto.municipios, mapaSistemas, mapaMunicipios)
        for (const t of tokens) {
          await tx.municipioSistema.upsert({
            where: { municipioId_sistemaId: { municipioId: t.municipioId, sistemaId: t.sistemaId } },
            update: { token: t.token, dataVencimento: t.dataVencimento },
            create: t,
          })
        }
        r.tokens = tokens.length
        r.tokensIgnorados = ignorados

        // Sem município ativo local → herda o ativo da VPS
        const temAtivo = await tx.municipio.count({ where: { usuarioId, ativo: true } })
        const ativoRemoto = remoto.municipios.find(m => m.ativo)
        if (!temAtivo && ativoRemoto && mapaMunicipios.has(ativoRemoto.id)) {
          await tx.municipio.update({ where: { id: mapaMunicipios.get(ativoRemoto.id) }, data: { ativo: true } })
        }
      }
      return r
    }, { timeout: 120000, maxWait: 10000 })

    res.json(resultado)
  } catch (e) {
    responderErro(res, e)
  }
})

module.exports = router
