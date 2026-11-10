import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buscar, vizinhos } from './consulta.mjs'
import { formatarNo, formatarBusca, formatarResumo } from './formatar.mjs'

const g = {
  versao: 1, hash: 'h', naoResolvidas: [],
  nos: [
    { id: 'area:debitos', tipo: 'area', rotulo: 'Débitos, Créditos e Guias' },
    { id: 'area:itbi', tipo: 'area', rotulo: 'ITBI e Transferências' },
    { id: 'conhecimento:itbi/caso', tipo: 'conhecimento', rotulo: 'A dívida não foi junto', arquivo: '_CONHECIMENTO/ITBI/caso.md' },
    { id: 'endpoint:debitos', tipo: 'endpoint', rotulo: 'Debitos', metodos: ['POST'] },
    { id: 'endpoint:imoveis', tipo: 'endpoint', rotulo: 'imóveis', metodos: ['DELETE', 'POST'] },
    { id: 'fonte:debitos', tipo: 'fonte', rotulo: 'Débitos', confirmado: true, usos: 900, operacoes: [{}, {}] },
    { id: 'fonte:debitosProtocolo', tipo: 'fonte', rotulo: 'Protocolo de débito', confirmado: true, usos: 3, operacoes: [{}] },
    { id: 'template:Exporta_Debitos', tipo: 'template', rotulo: 'Exporta Débitos Completo', arquivo: '_BIBLIOTECA/Templates/E.txt', status: 'validado', validadoEm: '2026-10-05', notas: ['Gera o .jsonl da Checagem'] },
  ],
  arestas: [
    { de: 'conhecimento:itbi/caso', tipo: 'documenta', para: 'template:Exporta_Debitos', origem: 'inferida' },
    { de: 'conhecimento:itbi/caso', tipo: 'pertence', para: 'area:itbi', origem: 'inferida' },
    { de: 'endpoint:debitos', tipo: 'depende', para: 'endpoint:imoveis', origem: 'inferida', via: 'idImovel' },
    { de: 'endpoint:debitos', tipo: 'pertence', para: 'area:debitos', origem: 'inferida' },
    { de: 'fonte:debitos', tipo: 'mapeia', para: 'endpoint:debitos', origem: 'inferida' },
    { de: 'fonte:debitos', tipo: 'pertence', para: 'area:debitos', origem: 'inferida' },
    { de: 'template:Exporta_Debitos', tipo: 'pertence', para: 'area:debitos', origem: 'inferida' },
    { de: 'template:Exporta_Debitos', tipo: 'usa-fonte', para: 'fonte:debitos', origem: 'inferida' },
  ],
}

test('buscar: sem acento; nome exato primeiro, depois começo, depois contém; no empate, peça concreta antes de área', () => {
  assert.deepEqual(buscar(g, 'débitos').map(r => r.id), ['fonte:debitos', 'endpoint:debitos', 'area:debitos', 'fonte:debitosProtocolo', 'template:Exporta_Debitos'])
})

test('buscar: várias palavras precisam todas aparecer; filtro por tipo e por área', () => {
  assert.deepEqual(buscar(g, 'exporta debitos').map(r => r.id), ['template:Exporta_Debitos'])
  assert.deepEqual(buscar(g, 'debitos', { tipo: 'fonte' }).map(r => r.id), ['fonte:debitos', 'fonte:debitosProtocolo'])
  assert.deepEqual(buscar(g, 'debitos', { area: 'debitos' }).map(r => r.id), ['fonte:debitos', 'endpoint:debitos', 'template:Exporta_Debitos'])
})

test('vizinhos: saída e entrada; filtro por tipo de aresta; profundidade sem atravessar área', () => {
  const v1 = vizinhos(g, 'fonte:debitos')
  assert.deepEqual(v1.map(v => `${v.direcao} ${v.aresta} ${v.id}`), [
    'saida mapeia endpoint:debitos', 'saida pertence area:debitos', 'entrada usa-fonte template:Exporta_Debitos',
  ])
  assert.deepEqual(vizinhos(g, 'template:Exporta_Debitos', { profundidade: 2 }).map(v => `${v.nivel} ${v.id}`), [
    '1 fonte:debitos', '1 area:debitos', '1 conhecimento:itbi/caso',
    '2 endpoint:debitos', '2 area:itbi',
  ])
  assert.deepEqual(vizinhos(g, 'fonte:debitos', { aresta: 'mapeia', profundidade: 3 }).map(v => v.id), ['endpoint:debitos'])
})

test('formatarNo: cabeçalho, detalhes, notas e vizinhos agrupados', () => {
  const txt = formatarNo(g, 'template:Exporta_Debitos')
  assert.equal(txt, [
    'template:Exporta_Debitos — Exporta Débitos Completo',
    '  validado em 2026-10-05 · _BIBLIOTECA/Templates/E.txt',
    '  ⚠ Gera o .jsonl da Checagem',
    '  usa-fonte → fonte:debitos',
    '  pertence → area:debitos',
    '  ← documenta: conhecimento:itbi/caso',
  ].join('\n'))
})

test('formatarNo: grupo grande é cortado com +N; id desconhecido avisa', () => {
  const muitos = { ...g, nos: [...g.nos], arestas: [...g.arestas] }
  for (let i = 0; i < 15; i++) {
    muitos.nos.push({ id: `fonte:x${String(i).padStart(2, '0')}`, tipo: 'fonte', rotulo: 'x' })
    muitos.arestas.push({ de: `fonte:x${String(i).padStart(2, '0')}`, tipo: 'pertence', para: 'area:itbi', origem: 'inferida' })
  }
  const linhas = formatarNo(muitos, 'area:itbi').split('\n')
  assert.ok(linhas.some(l => l.startsWith('  ← pertence · fonte (15): ') && l.endsWith(' +3')))
  assert.equal(formatarNo(g, 'fonte:nada'), 'fonte:nada não existe no grafo. Tente: grafo.mjs busca <termo>')
})

test('formatarBusca e formatarResumo', () => {
  assert.equal(formatarBusca(buscar(g, 'exporta')), 'template:Exporta_Debitos — Exporta Débitos Completo [validado 2026-10-05]')
  assert.equal(formatarBusca([]), 'Nada encontrado.')
  assert.equal(formatarBusca([{ id: 'template:A', tipo: 'template', rotulo: 'A', status: 'validado' }]), 'template:A — A [validado, sem data]')
  assert.equal(formatarBusca([{ id: 'template:B', tipo: 'template', rotulo: 'B', status: 'nao-validado' }]), 'template:B — B [NÃO validado no Studio]')
  assert.equal(formatarBusca([{ id: 'fonte:guiasEmitidas', tipo: 'fonte', rotulo: 'guiasEmitidas', status: 'so-producao', usos: 8 }]), 'fonte:guiasEmitidas — guiasEmitidas [só produção]')
  assert.equal(formatarNo({ nos: [{ id: 'template:B', tipo: 'template', rotulo: 'B', status: 'nao-validado', arquivo: 'b.txt' }], arestas: [] }, 'template:B'),
    'template:B — B\n  NÃO validado no Studio · b.txt')
  assert.match(formatarResumo(g), /^8 nós: 2 area, 1 conhecimento, 2 endpoint, 2 fonte, 1 template\n8 arestas: 1 depende, 1 documenta, 1 mapeia, 4 pertence, 1 usa-fonte/)
})
