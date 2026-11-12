// Ajustes rápidos: atalhos de correção de migração que travam o estímulo da Migração Espelho.
// Cada ajuste = script de exportação (CSV, uma coluna por campo — montarScriptBackup) + leitura do resultado.
import { lerBackup } from './espelho.js'

export const AJUSTES = [
  {
    id: 'receitas-duplicadas',
    rotulo: 'Receitas duplicadas',
    // Salvar um crédito pela tela re-salva as receitas dele; receita repetida → 422 "Já existe uma receita com a descrição informada."
    porque: 'Salvar um crédito tributário re-salva as receitas dele. Se outra receita tiver a mesma descrição, a Betha recusa com 422 "Já existe uma receita com a descrição informada." e o estímulo do crédito falha.',
    tipo: { campo: 'classificacao', rotulo: 'classificação' },
    cadastro: {
      rotulo: 'Receitas',
      fonte: 'Dados.tributos.v2.receitas',
      arquivo: 'receitas.csv',
      // Campos de primeiro nível da fonte (os atos são objetos e ficam de fora)
      campos: [
        { nome: 'id', descricao: 'Id da receita' },
        { nome: 'descricao', descricao: 'Descrição' },
        { nome: 'abreviatura', descricao: 'Abreviatura' },
        { nome: 'classificacao', enum: true, descricao: 'IMPOSTO, TAXA, MULTA_INFRACAO…' },
        { nome: 'inscDividaAtiva', enum: true, descricao: 'SIM / NAO' },
        { nome: 'codigoTCE', descricao: 'Código TCE' },
        { nome: 'cobrancaCompartilhada', descricao: 'Cobrança compartilhada' },
        { nome: 'naoContabilizavel', descricao: 'Não contabilizável' },
        { nome: 'templateId', descricao: 'Identificador do cadastro único' },
      ],
    },
  },
  // Limpeza da procuradoria: a base do município que não veio do cadastro único (em Ruropolis, 3.733 logradouros contra
  // 874 no tributos, todos "Rua" com o CEP genérico da cidade). As de outras cidades são "Padrões do sistema" — ficam.
  {
    id: 'procuradoria-logradouros',
    rotulo: 'Limpar logradouros (procuradoria)',
    porque: 'A procuradoria deve ter só o que chega pelo cadastro único. Logradouros do município criados por outra migração viram duplicado quando o tributos for estimulado. Logradouros de outras cidades são padrão do sistema e não entram.',
    exclusao: { sistema: /procur/i, path: '/api/logradouros', recurso: 'logradouros', prefixo: 'EXCLLOG', rotuloItem: 'logradouro(s)' },
    cadastro: {
      rotulo: 'Logradouros da procuradoria',
      fonte: 'Dados.procuradoria.v2.logradouros',
      metodo: 'buscar',
      filtro: { campo: 'idMunicipio', constante: 'ID_MUNICIPIO', valor: '4320', descricao: 'Município na procuradoria (Rurópolis = 4320). As outras cidades são os padrões do sistema.' },
      arquivo: 'logradouros_procuradoria.csv',
      campos: [
        { nome: 'id', descricao: 'Id do logradouro na procuradoria' },
        { nome: 'nome', descricao: 'Nome' },
        { nome: 'tipoLogradouroDescricao', descricao: 'Tipo (Rua, Avenida…)' },
        { nome: 'cep', descricao: 'CEP' },
        { nome: 'idMunicipio', descricao: 'Município' },
        { nome: 'idTipoLogradouro', descricao: 'Id do tipo' },
        { nome: 'epigrafe', descricao: 'Epígrafe' },
        { nome: 'extensao', descricao: 'Extensão' },
        { nome: 'lei', descricao: 'Lei' },
        { nome: 'zonaFiscal', descricao: 'Zona fiscal' },
      ],
    },
  },
  // Bairros da procuradoria: digitação de outra migração (AEROPOROT, AERORPOTO, CENGTRO, CETRO…), de Rurópolis e de
  // outras cidades misturados na mesma faixa de ids. O município vem num objeto: municipio { id, nome }.
  {
    id: 'procuradoria-bairros',
    rotulo: 'Limpar bairros (procuradoria)',
    porque: 'A procuradoria deve ter só o que chega pelo cadastro único. Bairros criados por outra migração (variações de digitação do mesmo bairro) viram duplicado quando o tributos for estimulado.',
    exclusao: { sistema: /procur/i, path: '/api/bairros', recurso: 'bairros', prefixo: 'EXCLBAI', rotuloItem: 'bairro(s)' },
    cadastro: {
      rotulo: 'Bairros da procuradoria',
      fonte: 'Dados.procuradoria.v2.bairros',
      metodo: 'buscar',
      filtro: { campo: 'idMunicipio', caminho: 'municipio?.id', constante: 'ID_MUNICIPIO', valor: '4320', descricao: 'Município na procuradoria (Rurópolis = 4320).' },
      arquivo: 'bairros_procuradoria.csv',
      campos: [
        { nome: 'id', descricao: 'Id do bairro na procuradoria' },
        { nome: 'nome', descricao: 'Nome' },
        { nome: 'idMunicipio', caminho: 'municipio?.id', descricao: 'Id do município' },
        { nome: 'municipio', caminho: 'municipio?.nome', descricao: 'Nome do município' },
        // zonaRural fica de fora: em bairros de outras cidades vem fora do formato { valor } e o script quebra
        // ("A propriedade valor não existe"), e não serve para a exclusão
      ],
    },
  },
]

export const ajustePorId = id => AJUSTES.find(a => a.id === id)

// Guarda contra colar a saída sem filtro: só fica o que bate com o filtro do script (ex.: idMunicipio = 4320)
export function separarPorFiltro(registros, filtro) {
  if (!filtro) return { dentro: registros, fora: 0 }
  const dentro = registros.filter(r => String(r[filtro.campo] ?? '') === filtro.valor)
  return { dentro, fora: registros.length - dentro.length }
}

// DELETE pela Service Layer: { idIntegracao, <recurso>: { idGerado: { id } } }, 50 por lote. Id vazio, zero ou repetido fica fora.
export function lotesExcluir(registros, { recurso, prefixo }, tamanho = 50) {
  const ids = [...new Set(registros.map(r => Number(r.id)).filter(n => Number.isInteger(n) && n > 0))]
  const lotes = []
  for (let i = 0; i < ids.length; i += tamanho) {
    const parte = ids.slice(i, i + tamanho)
    lotes.push({ indice: lotes.length + 1, ids: parte, body: parte.map(id => ({ idIntegracao: `${prefixo}${id}`, [recurso]: { idGerado: { id } } })) })
  }
  return lotes
}

const comparavel = t => String(t ?? '').normalize('NFC').replace(/\s+/g, ' ').trim().toUpperCase()

// 'municipio?.id' → o.municipio?.id (mesmo caminho usado no script)
const ler = (o, caminho) => caminho.split(/\??\./).reduce((v, k) => v?.[k], o)

// Aceita o CSV do script ou a saída do console do Studio ("hh:mm:ss - {json}" por linha, enum como { valor, descricao }).
// Os dois viram registros planos com texto em cada campo do cadastro (enum pelo valor, nulo como "").
export function lerRegistros(texto, cadastro) {
  const linhas = String(texto || '').replace(/^\uFEFF/, '').split(/\r?\n/)
    .map(l => l.replace(/^\s*\d{2}:\d{2}:\d{2}\s*-\s*/, '').trim()).filter(Boolean)
  if (!linhas.length || !linhas[0].startsWith('{')) return { ...lerBackup(texto, cadastro), formato: 'csv' }
  const registros = []
  for (const l of linhas) {
    let o
    try { o = JSON.parse(l) } catch { continue } // avisos do console ("Não há eventos…") e linha cortada
    registros.push(Object.fromEntries(cadastro.campos.map(c => {
      const v = c.caminho ? ler(o, c.caminho) : c.enum ? o[c.nome]?.valor : o[c.nome]
      return [c.nome, v == null ? '' : String(v)]
    })))
  }
  const faltando = ['id', 'descricao'].filter(c => cadastro.campos.some(x => x.nome === c) && !registros.some(r => r[c] !== ''))
  return { registros, faltando, formato: 'console' }
}

// Grupos de registros com o mesmo valor (sem diferença de caixa/espaços). Valor vazio não conta.
// Padrão: compara sem olhar o tipo — é o que a Betha valida (422 em Ruropolis entre receitas TAXA × IMPOSTO).
// mesmoTipo: só dentro da mesma classificação. Ordem: descrição antes de abreviatura, depois tipo e valor.
export function duplicadas(registros, { tipo = 'classificacao', campos = ['descricao', 'abreviatura'], mesmoTipo = false } = {}) {
  const grupos = []
  for (const campo of campos) {
    const porChave = new Map()
    for (const r of registros) {
      const valor = comparavel(r[campo])
      if (!valor) continue
      const chave = mesmoTipo ? `${r[tipo] ?? ''}|${valor}` : valor
      if (!porChave.has(chave)) porChave.set(chave, [])
      porChave.get(chave).push(r)
    }
    const doCampo = [...porChave.values()].filter(l => l.length > 1)
      .map(l => ({ campo, tipo: [...new Set(l.map(r => r[tipo] ?? ''))].sort().join(', '), valor: String(l[0][campo]).trim(), registros: l }))
      .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.valor.localeCompare(b.valor))
    grupos.push(...doCampo)
  }
  return grupos
}

// ---- Correção das receitas duplicadas (Service Layer, token de migração) ----------------------
// Em cada grupo de descrição repetida, a receita SEM template (fora do cadastro único, em geral da migração)
// ganha "." no fim da descrição — só quando o grupo tem uma COM template; senão vai para revisão manual.
// Excluir ficou de fora por decisão do Felipe (2026-10-29).
export const PATH_RECEITAS = '/api/receitas'
const LOTE_RECEITAS = 50

export function alvosCorrecao(registros) {
  const descricoes = new Set(registros.map(r => comparavel(r.descricao)))
  const alvos = []
  const revisar = []
  for (const g of duplicadas(registros, { campos: ['descricao'] })) {
    const comTemplate = g.registros.filter(r => r.templateId)
    const semTemplate = g.registros.filter(r => !r.templateId)
    if (!comTemplate.length || !semTemplate.length) { revisar.push(g); continue }
    for (const r of semTemplate) {
      const nova = `${String(r.descricao).trim()}.`
      alvos.push({ ...r, nova, conflito: descricoes.has(comparavel(nova)) })
    }
  }
  return { alvos, revisar }
}

// Obrigatórios do PATCH /api/receitas: idGerado, descricao, abreviatura, classificacao, inscDividaAtiva
export function lotesPatchReceitas(alvos, tamanho = LOTE_RECEITAS) {
  const lotes = []
  for (let i = 0; i < alvos.length; i += tamanho) {
    const parte = alvos.slice(i, i + tamanho)
    lotes.push({
      indice: lotes.length + 1,
      ids: parte.map(a => Number(a.id)),
      body: parte.map(a => {
        const receitas = { idGerado: { id: Number(a.id) }, descricao: a.nova }
        for (const c of ['abreviatura', 'classificacao', 'inscDividaAtiva']) if (a[c]) receitas[c] = a[c]
        return { idIntegracao: `AJREC${a.id}`, receitas }
      }),
    })
  }
  return lotes
}
