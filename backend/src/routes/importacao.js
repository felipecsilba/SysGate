const express = require('express')
const { exigirAdmin } = require('../middleware/autenticar')
const { entrar, buscarTudo } = require('../lib/clienteKrakionWeb')
const {
  casarPorNome, prepararEndpoint, prepararTokens, resumir, planejarPorChave, prepararNota, prepararConhecimento,
  chaveRegra, chaveNotaChecagem, prepararRegra, prepararNotaChecagem, prepararFonte, camposMarcados,
} = require('../lib/importacaoWeb')

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
    const { url, tokenRemoto, sistemas: comSistemas, municipios: comMunicipios, notas: comNotas, conhecimento: comConhecimento, checagem: comChecagem } = req.body
    if (!tokenRemoto) return res.status(400).json({ error: 'Conecte ao Krakion web antes de importar.' })
    if (!comSistemas && !comMunicipios && !comNotas && !comConhecimento && !comChecagem) return res.status(400).json({ error: 'Escolha o que importar.' })

    const remoto = await buscarTudo(url, tokenRemoto, { checagemCompleta: !!comChecagem })
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

      // Notas e conhecimento: o usuário local vira dono/autor. Reimportar não duplica e
      // não sobrescreve o que foi editado aqui depois da última mudança na VPS.
      const copiar = async (lista, modelo, onde, preparar, chaveR) => {
        const locais = await tx[modelo].findMany({ where: onde, select: { id: true, titulo: true, criadoEm: true, atualizadoEm: true } })
        for (const { remoto, localId, acao } of planejarPorChave(lista, locais)) {
          if (acao === 'manter') continue
          const dados = preparar(remoto)
          if (acao === 'criar') await tx[modelo].create({ data: dados })
          else await tx[modelo].update({ where: { id: localId }, data: dados })
          r[chaveR][acao === 'criar' ? 0 : 1]++
        }
      }
      if (comNotas) {
        r.notas = [0, 0] // [novas, atualizadas]
        await copiar(remoto.notas, 'nota', { usuarioId }, n => prepararNota(n, usuarioId), 'notas')
      }
      if (comConhecimento) {
        r.conhecimento = [0, 0]
        await copiar(remoto.conhecimento, 'conhecimento', {}, c => prepararConhecimento(c, usuarioId), 'conhecimento')
      }

      // Checagem: dados globais por sistema. Casam por chave natural e a VPS vence; nada local é apagado.
      if (comChecagem) {
        r.checagem = { regras: 0, notas: 0, fontes: 0, campos: 0, sistemasIgnorados: 0 }
        for (const c of remoto.checagem) {
          const sistemaId = mapaSistemas.get(c.sistemaId)
          if (!sistemaId) {
            if (c.regras.length || c.notas.length || c.fontes.length) r.checagem.sistemasIgnorados++
            continue
          }

          const regrasLocais = new Map((await tx.regraChecagem.findMany({ where: { sistemaId } })).map(l => [chaveRegra(l), l.id]))
          for (const regra of c.regras) {
            const dados = prepararRegra(regra, sistemaId)
            const id = regrasLocais.get(chaveRegra(regra))
            if (id) await tx.regraChecagem.update({ where: { id }, data: dados })
            else await tx.regraChecagem.create({ data: dados })
            r.checagem.regras++
          }

          const notasLocais = new Map((await tx.notaChecagem.findMany({ where: { sistemaId } })).map(l => [chaveNotaChecagem(l), l.id]))
          for (const nota of c.notas) {
            const dados = prepararNotaChecagem(nota, sistemaId)
            const id = notasLocais.get(chaveNotaChecagem(nota))
            if (id) await tx.notaChecagem.update({ where: { id }, data: dados })
            else await tx.notaChecagem.create({ data: dados })
            r.checagem.notas++
          }

          for (const fonte of c.fontes) {
            const dados = prepararFonte(fonte, sistemaId)
            await tx.fonteDados.upsert({
              where: { sistemaId_nome_path_operacao: { sistemaId, nome: dados.nome, path: dados.path, operacao: dados.operacao } },
              update: dados,
              create: dados,
            })
            r.checagem.fontes++
          }

          for (const { path, resposta } of c.campos) {
            for (const dados of camposMarcados(resposta, path, sistemaId)) {
              await tx.campoChecagem.upsert({
                where: { sistemaId_path_campo: { sistemaId, path, campo: dados.campo } },
                update: dados,
                create: dados,
              })
              r.checagem.campos++
            }
          }
        }
      }
      return r
    }, { timeout: 300000, maxWait: 10000 })

    res.json(resultado)
  } catch (e) {
    responderErro(res, e)
  }
})

module.exports = router
