import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enviarEmRajada } from './rajada.js'

const lote = n => ({ indice: n, ids: [n], body: [{ idIntegracao: `X${n}` }] })
const semEspera = async () => {}

test('enviarEmRajada: manda todos os lotes antes de consultar e consulta em rodadas até sair da fila', async () => {
  const log = []
  const filaRestante = { L1: 2, L2: 1, L3: 0 } // quantas consultas cada lote ainda fica na fila
  const r = await enviarEmRajada([lote(1), lote(2), lote(3)], {
    enviarLote: async l => { log.push(`envia ${l.indice}`); return { status: 'fila', idLote: `L${l.indice}` } },
    consultarLote: async (l, idLote) => {
      log.push(`consulta ${idLote}`)
      if (filaRestante[idLote]-- > 0) return { status: 'fila' }
      return { status: 'ok', erros: [] }
    },
    aoMudar: (l, ret) => log.push(`${l.indice}:${ret.status}`),
    esperar: semEspera,
  })
  assert.deepEqual(r.pendentes, [])
  // os 3 envios vêm antes de qualquer consulta
  assert.deepEqual(log.slice(0, 6), ['envia 1', '1:fila', 'envia 2', '2:fila', 'envia 3', '3:fila'])
  assert.ok(log.includes('3:ok') && log.includes('2:ok') && log.includes('1:ok'))
  assert.ok(log.indexOf('3:ok') < log.indexOf('1:ok')) // o que sai antes não espera os outros
})

test('enviarEmRajada: lote recusado no envio não é consultado', async () => {
  const consultas = []
  const r = await enviarEmRajada([lote(1), lote(2)], {
    enviarLote: async l => (l.indice === 1 ? { status: 'erro', mensagem: 'HTTP 400' } : { status: 'fila', idLote: 'L2' }),
    consultarLote: async (l, idLote) => { consultas.push(idLote); return { status: 'ok', erros: [] } },
    aoMudar: () => {},
    esperar: semEspera,
  })
  assert.deepEqual(consultas, ['L2'])
  assert.deepEqual(r.pendentes, [])
})

test('enviarEmRajada: parar ou estourar o limite devolve o que ainda está na fila', async () => {
  let agora = 0
  const r = await enviarEmRajada([lote(1)], {
    enviarLote: async () => ({ status: 'fila', idLote: 'L1' }),
    consultarLote: async () => { agora += 60000; return { status: 'fila' } },
    aoMudar: () => {},
    esperar: semEspera,
    limiteMs: 120000,
    relogio: () => agora,
  })
  assert.deepEqual(r.pendentes.map(p => p.idLote), ['L1'])

  let parou = false
  const r2 = await enviarEmRajada([lote(1), lote(2)], {
    enviarLote: async l => { parou = l.indice === 1; return { status: 'fila', idLote: `L${l.indice}` } },
    consultarLote: async () => ({ status: 'ok', erros: [] }),
    aoMudar: () => {},
    esperar: semEspera,
    parar: () => parou,
  })
  assert.deepEqual(r2.pendentes.map(p => p.idLote), ['L1']) // parou depois do 1º envio: o 2º nem foi
})

test('enviarEmRajada: paralelo manda vários lotes ao mesmo tempo, sem passar do limite', async () => {
  let emVoo = 0
  let maximo = 0
  const r = await enviarEmRajada([1, 2, 3, 4, 5, 6, 7].map(lote), {
    paralelo: 3,
    enviarLote: async l => {
      emVoo++; maximo = Math.max(maximo, emVoo)
      await new Promise(res => setTimeout(res, 5))
      emVoo--
      return { status: 'fila', idLote: `L${l.indice}` }
    },
    consultarLote: async () => ({ status: 'ok', erros: [] }),
    aoMudar: () => {},
    esperar: semEspera,
  })
  assert.equal(maximo, 3)
  assert.deepEqual(r.pendentes, [])
})
