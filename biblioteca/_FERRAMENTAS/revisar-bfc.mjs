#!/usr/bin/env node
// Revisor de BFC-Script. Uso: node biblioteca/_FERRAMENTAS/revisar-bfc.mjs <arquivo>... [--formula] [--json] [--resumo]
// Arquivo dentro de Formulas/ é tratado como fórmula automaticamente. Sai com 1 se houver erro.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { revisar } from './lib/regras.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const flag = f => args.includes(`--${f}`)
const arquivos = args.filter(a => !a.startsWith('--'))

if (!arquivos.length) {
  console.log('Uso: node biblioteca/_FERRAMENTAS/revisar-bfc.mjs <arquivo>... [--formula] [--json] [--resumo]')
  process.exit(0)
}

let fontesConhecidas = [], operacoesRest = []
try {
  const g = JSON.parse(fs.readFileSync(path.join(AQUI, '..', '_GRAFO', 'grafo.json'), 'utf8'))
  const fontes = g.nos.filter(n => n.tipo === 'fonte' && n.status !== 'fora-do-catalogo')
  fontesConhecidas = fontes.map(n => n.id)
  operacoesRest = [...new Set(fontes.flatMap(n => (n.operacoes || []).map(o => o.operacao)))]
} catch { /* sem grafo: as regras fonte-desconhecida e metodo-rest ficam desligadas */ }

let erros = 0
const porRegra = {}
const saida = []
for (const arq of arquivos) {
  const formula = flag('formula') || /[\\/]Formulas[\\/]/.test(path.resolve(arq))
  const achados = revisar(fs.readFileSync(arq, 'utf8'), { formula, fontesConhecidas, operacoesRest })
  erros += achados.filter(a => a.nivel === 'erro').length
  for (const a of achados) porRegra[`${a.nivel} ${a.regra}`] = (porRegra[`${a.nivel} ${a.regra}`] || 0) + 1
  saida.push({ arquivo: arq, achados })
}

if (flag('json')) console.log(JSON.stringify(saida, null, 1))
else if (flag('resumo')) {
  const com = saida.filter(s => s.achados.length).length
  console.log(`${arquivos.length} arquivos · ${com} com achados · ${erros} erros`)
  for (const [k, v] of Object.entries(porRegra).sort((a, b) => b[1] - a[1])) console.log(`  ${v}\t${k}`)
} else {
  for (const s of saida) {
    if (arquivos.length > 1) console.log(`${s.arquivo}${s.achados.length ? '' : ' — limpo'}`)
    else if (!s.achados.length) console.log('Limpo: nenhuma armadilha conhecida.')
    for (const a of s.achados) console.log(`${arquivos.length > 1 ? '  ' : ''}L${a.linha} [${a.nivel}] ${a.regra}: ${a.trecho} — ${a.msg}`)
  }
}
process.exitCode = erros ? 1 : 0
