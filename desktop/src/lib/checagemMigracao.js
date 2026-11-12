// Checagem de migração: verificações por cadastro do tributos, sobre o .jsonl exportado no Studio.
// Cada verificação nasceu de um erro real do salvar pela tela (Migração Espelho), que roda as validações da Betha
// que a API de migração pula. Tudo roda na tela: o arquivo não sai da máquina e nada é gravado.
import { cadastroPorId } from './espelho.js'

const desembrulhar = v => (v && typeof v === 'object' && !Array.isArray(v) && 'valor' in v ? v.valor : v)
const ehSim = v => v === true || ['SIM', 'S', 'TRUE'].includes(String(desembrulhar(v) ?? '').toUpperCase())
const pegar = (o, caminho) => caminho.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o)

// Dígitos verificadores de CPF (11) e CNPJ (14). Sequência repetida (999…) é inválida. Vazio → null (não avalia).
export function cpfCnpjValido(valor) {
  const d = String(valor ?? '').replace(/\D/g, '')
  if (!d) return null
  if (d.length !== 11 && d.length !== 14) return false
  if (/^(\d)\1+$/.test(d)) return false
  const digito = (base, pesos) => {
    const soma = pesos.reduce((s, p, i) => s + Number(base[i]) * p, 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  if (d.length === 11) {
    const d1 = (() => { const s = [...d.slice(0, 9)].reduce((t, n, i) => t + Number(n) * (10 - i), 0); const r = (s * 10) % 11; return r === 10 ? 0 : r })()
    const d2 = (() => { const s = [...d.slice(0, 10)].reduce((t, n, i) => t + Number(n) * (11 - i), 0); const r = (s * 10) % 11; return r === 10 ? 0 : r })()
    return d1 === Number(d[9]) && d2 === Number(d[10])
  }
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const p2 = [6, ...p1]
  return digito(d, p1) === Number(d[12]) && digito(d, p2) === Number(d[13])
}

// Aceita o JSONL do script, a saída do console do Studio ("hh:mm:ss - {…}") e o backup da Migração Espelho
// ({ salvoEm, registro }). Um registro por id — o último vale (o backup pode ter o mesmo id mais de uma vez).
export function lerRegistrosMigracao(texto) {
  const porId = new Map()
  let descartadas = 0
  for (const bruta of String(texto || '').replace(/^﻿/, '').split(/\r?\n/)) {
    const linha = bruta.replace(/^\s*\d{2}:\d{2}:\d{2}\s*-\s*/, '').trim()
    if (!linha) continue
    let o
    try { o = JSON.parse(linha) } catch { descartadas++; continue }
    const registro = o && typeof o === 'object' && o.registro && 'salvoEm' in o ? o.registro : o
    if (registro?.id == null) { descartadas++; continue }
    porId.set(String(registro.id), registro)
  }
  return { registros: [...porId.values()], descartadas }
}

const enderecos = r => (Array.isArray(r.enderecos) ? r.enderecos : [])
const chaveEndereco = e => [pegar(e, 'logradouro.id'), e.numero ?? '', e.complemento ?? '', pegar(e, 'bairro.id')].join('|')
const soDigitos = v => String(v ?? '').replace(/\D/g, '')

// Grupos de endereços idênticos (mesmo logradouro, número, complemento e bairro) do contribuinte
function gruposRepetidos(r) {
  const porChave = new Map()
  for (const e of enderecos(r)) {
    const k = chaveEndereco(e)
    if (!porChave.has(k)) porChave.set(k, [])
    porChave.get(k).push(e)
  }
  return [...porChave.values()].filter(g => g.length > 1)
}

// Dos idênticos, fica o principal (se houver) de menor id; os outros saem
function aExcluir(grupo) {
  const ordenados = [...grupo].sort((a, b) => Number(a.id) - Number(b.id))
  const fica = ordenados.find(e => ehSim(e.principal)) ?? ordenados[0]
  return ordenados.filter(e => e !== fica)
}

// Correção pela Service Layer (token de migração) — não espelha sozinha: depois, reestimular pela Migração Espelho.
// montar(casos) → { itens: [{ alvo, caso, descricao, corpo }], semCorrecao: [casos que precisam de decisão na tela] }
const EXCLUIR_ENDERECOS_REPETIDOS = {
  tipo: 'api',
  rotulo: 'Excluir os endereços repetidos',
  explicacao: 'Exclui os endereços idênticos a mais (fica o principal de menor id). Só o endereço repetido sai; o contribuinte e o outro endereço ficam como estão.',
  metodo: 'DELETE',
  path: '/api/pessoasEnderecos',
  recurso: 'pessoasEnderecos',
  prefixo: 'CHKEND',
  montar(casos, { soPrincipais = false } = {}) {
    const itens = []
    const semCorrecao = []
    for (const caso of casos) {
      const grupos = gruposRepetidos(caso.registro).filter(g => !soPrincipais || g.every(e => ehSim(e.principal)))
      const excluir = grupos.flatMap(aExcluir)
      if (!excluir.length) { semCorrecao.push(caso); continue }
      for (const e of excluir) {
        itens.push({ alvo: Number(e.id), caso: caso.id, descricao: `${caso.nome}: excluir o endereço ${e.id} (${pegar(e, 'logradouro.nome') ?? ''}, ${e.numero ?? 's/n'})`, corpo: { idGerado: { id: Number(e.id) } } })
      }
    }
    return { itens, semCorrecao }
  },
}

const VERIFICACOES_CONTRIBUINTES = [
  {
    id: 'endereco-principal-repetido',
    nome: 'Mais de um endereço principal',
    severidade: 'erro',
    porque: 'A Betha aceita um só endereço principal por contribuinte. Com dois ou mais, salvar o contribuinte pela tela volta 422 "Somente um endereço pode ser definido como principal." e o cadastro não espelha nos outros sistemas.',
    comoCorrigir: 'Se os endereços são idênticos, exclua o repetido. Se são diferentes, deixe só um marcado como principal (na tela).',
    avaliar(r) {
      const principais = enderecos(r).filter(e => ehSim(e.principal))
      if (principais.length < 2) return null
      const identicos = new Set(principais.map(chaveEndereco)).size === 1
      return `${principais.length} endereços principais${identicos ? ', idênticos' : ''}`
    },
    // Só os grupos todos principais (idênticos): principais diferentes entre si pedem decisão na tela
    correcao: { ...EXCLUIR_ENDERECOS_REPETIDOS, montar: casos => EXCLUIR_ENDERECOS_REPETIDOS.montar(casos, { soPrincipais: true }) },
  },
  {
    id: 'logradouro-outro-municipio',
    nome: 'Logradouro de outro município',
    severidade: 'erro',
    porque: 'O município do endereço tem que ser o mesmo do logradouro. Diferente, salvar pela tela volta 422 "O município informado no Cadastro de Logradouros, difere o município informado para o endereço da pessoa."',
    comoCorrigir: 'Confira qual lado está certo: o município do logradouro (no cadastro de logradouros) ou o do endereço. Quando é sempre o mesmo logradouro, corrigir o cadastro dele resolve todos de uma vez.',
    avaliar(r) {
      const errados = enderecos(r).filter(e => {
        const doLogradouro = pegar(e, 'logradouro.municipio.id')
        const doEndereco = pegar(e, 'municipio.id')
        return doLogradouro != null && doEndereco != null && String(doLogradouro) !== String(doEndereco)
      })
      if (!errados.length) return null
      return errados.map(e => `${pegar(e, 'logradouro.nome')} (${pegar(e, 'logradouro.municipio.nome')}) × endereço em ${pegar(e, 'municipio.nome')}`).join(' · ')
    },
    correcao: {
      tipo: 'api',
      rotulo: 'Mudar o município do logradouro',
      explicacao: 'Um PATCH por logradouro, para o município dos endereços que o usam — só quando todos esses endereços estão no mesmo município. Confira antes se o logradouro é mesmo daquela cidade.',
      metodo: 'PATCH',
      path: '/api/logradouros',
      recurso: 'logradouros',
      prefixo: 'CHKLOG',
      montar(casos) {
        const porLogradouro = new Map() // id → { logradouro, municipios: Map(id → nome), casos: Set }
        for (const caso of casos) {
          for (const e of enderecos(caso.registro)) {
            const lm = pegar(e, 'logradouro.municipio.id')
            const em = pegar(e, 'municipio.id')
            if (lm == null || em == null || String(lm) === String(em)) continue
            const id = Number(pegar(e, 'logradouro.id'))
            if (!porLogradouro.has(id)) porLogradouro.set(id, { logradouro: e.logradouro, municipios: new Map(), casos: new Set() })
            const g = porLogradouro.get(id)
            g.municipios.set(String(em), pegar(e, 'municipio.nome'))
            g.casos.add(caso)
          }
        }
        const itens = []
        const semCorrecao = new Set()
        for (const [id, g] of porLogradouro) {
          if (g.municipios.size !== 1) { g.casos.forEach(c => semCorrecao.add(c)); continue }
          const [[para, paraNome]] = g.municipios
          itens.push({
            alvo: id, caso: [...g.casos][0].id, contribuintes: g.casos.size,
            de: pegar(g.logradouro, 'municipio.nome'), para: paraNome,
            descricao: `${g.logradouro.nome}: município ${pegar(g.logradouro, 'municipio.nome')} → ${paraNome} (${g.casos.size} contribuinte(s))`,
            corpo: { idGerado: { id }, idMunicipio: Number(para), nome: g.logradouro.nome },
          })
        }
        return { itens, semCorrecao: [...semCorrecao] }
      },
    },
  },
  {
    id: 'cpf-cnpj-invalido',
    nome: 'CPF/CNPJ inválido',
    severidade: 'erro',
    porque: 'Salvar pela tela valida o CPF/CNPJ (dígitos verificadores) e volta 422 "CPF inválido.". Cadastros fictícios da migração (999.999.999-99) caem aqui.',
    comoCorrigir: 'Corrija o documento ou, se o cadastro é fictício, decida se ele precisa existir nos outros sistemas.',
    avaliar(r) {
      return cpfCnpjValido(r.cpfCnpj) === false ? String(r.cpfCnpj) : null
    },
    correcao: { tipo: 'prefeitura', explicacao: 'Documento de pessoa só a prefeitura corrige. Exporte a lista e repasse ao responsável.' },
  },
  {
    id: 'sem-endereco',
    nome: 'Sem endereço',
    severidade: 'alerta',
    porque: 'Não trava o salvar, mas sem endereço a procuradoria não consegue notificar nem executar o devedor.',
    comoCorrigir: 'Cadastrar o endereço do contribuinte (tela ou recadastramento).',
    avaliar(r) {
      return enderecos(r).length ? null : 'nenhum endereço cadastrado'
    },
    correcao: { tipo: 'prefeitura', explicacao: 'Endereço de pessoa vem da prefeitura (recadastramento). Exporte a lista e repasse.' },
  },
  {
    id: 'cpf-cnpj-vazio',
    nome: 'CPF/CNPJ vazio',
    severidade: 'alerta',
    porque: 'Não trava o salvar, mas devedor sem documento não vira execução fiscal e não é identificado nos outros sistemas.',
    comoCorrigir: 'Cadastrar o CPF/CNPJ do contribuinte.',
    avaliar(r) {
      return soDigitos(r.cpfCnpj) ? null : 'sem CPF/CNPJ'
    },
    correcao: { tipo: 'prefeitura', explicacao: 'Documento de pessoa só a prefeitura corrige. Exporte a lista e repasse.' },
  },
  {
    id: 'cpf-cnpj-repetido',
    nome: 'CPF/CNPJ repetido',
    severidade: 'alerta',
    porque: 'Não trava o salvar, mas é a mesma pessoa cadastrada mais de uma vez: débitos e dívidas ficam divididos entre os cadastros.',
    comoCorrigir: 'Unificar os cadastros (decisão da prefeitura: qual fica e para onde vão débitos e imóveis).',
    // Precisa ver a base toda: quem mais usa o mesmo documento
    preparar(registros) {
      const porDocumento = new Map()
      for (const r of registros) {
        const d = soDigitos(r.cpfCnpj)
        if (!d) continue
        if (!porDocumento.has(d)) porDocumento.set(d, [])
        porDocumento.get(d).push(r.id)
      }
      return { porDocumento }
    },
    avaliar(r, { porDocumento }) {
      const outros = (porDocumento.get(soDigitos(r.cpfCnpj)) ?? []).filter(id => id !== r.id)
      return outros.length ? `mesmo documento de ${outros.join(', ')}` : null
    },
    correcao: { tipo: 'prefeitura', explicacao: 'Unificar pessoas é decisão da prefeitura. Exporte a lista e repasse.' },
  },
  {
    id: 'endereco-repetido',
    nome: 'Endereço repetido',
    severidade: 'alerta',
    porque: 'Não trava o salvar (quando a cópia não é principal), mas é o mesmo endereço duas vezes — sobra da migração.',
    comoCorrigir: 'Excluir o endereço repetido.',
    // Grupos com algum endereço não principal; os todos principais já são o erro "Mais de um endereço principal"
    avaliar(r) {
      const grupos = gruposRepetidos(r).filter(g => !g.every(e => ehSim(e.principal)))
      return grupos.length ? grupos.map(g => `${g.length}× ${pegar(g[0], 'logradouro.nome') ?? ''}, ${g[0].numero ?? 's/n'}`).join(' · ') : null
    },
    correcao: EXCLUIR_ENDERECOS_REPETIDOS,
  },
]

export const CHECAGENS_MIGRACAO = [
  {
    id: 'contribuintes',
    rotulo: 'Contribuintes',
    arquivo: 'contribuintes_migracao.jsonl',
    // O CSV dos casos sai no formato do backup da Migração Espelho → carrega direto no Estímulo depois de corrigir
    cadastroEspelho: cadastroPorId('contribuintes'),
    verificacoes: VERIFICACOES_CONTRIBUINTES,
  },
]

export const checagemPorId = id => CHECAGENS_MIGRACAO.find(c => c.id === id)

// Uma linha por verificação, na ordem da checagem: { verificacao, casos: [{ id, nome, detalhe, registro }] }
export function checarMigracao(registros, checagem) {
  return checagem.verificacoes.map(verificacao => {
    const contexto = verificacao.preparar ? verificacao.preparar(registros) : {}
    return {
      verificacao,
      casos: registros
        .map(registro => ({ registro, detalhe: verificacao.avaliar(registro, contexto) }))
        .filter(x => x.detalhe != null)
        .map(({ registro, detalhe }) => ({ id: registro.id, nome: registro.nome, detalhe, registro })),
    }
  })
}

// Itens da correção → lotes da Service Layer: { idIntegracao (só letras e números), <recurso>: corpo }, 50 por lote
export function montarLotesCorrecao(itens, correcao, tamanho = 50) {
  const lotes = []
  for (let i = 0; i < itens.length; i += tamanho) {
    const parte = itens.slice(i, i + tamanho)
    lotes.push({
      indice: lotes.length + 1,
      ids: parte.map(it => it.alvo),
      body: parte.map(it => ({ idIntegracao: `${correcao.prefixo}${it.alvo}`, [correcao.recurso]: it.corpo })),
    })
  }
  return lotes
}

const celulaCsv = v => String(v ?? '').replace(/;/g, ',').replace(/\s*[\r\n]+\s*/g, ' ').trim()

// Colunas do backup do Estímulo (Migração Espelho) + verificacao e detalhe no fim.
// idTemplate: o script do Studio manda idTemplate; o backup da tela, templateId.
export function csvCasos(casos, verificacao, cadastroEspelho = cadastroPorId('contribuintes')) {
  const colunas = cadastroEspelho.campos.map(c => c.nome)
  const valor = (r, c) => (c === 'idTemplate' ? r.idTemplate ?? r.templateId : r[c])
  const linhas = [[...colunas, 'verificacao', 'detalhe']]
  for (const caso of casos) linhas.push([...colunas.map(c => valor(caso.registro, c)), verificacao.nome, caso.detalhe])
  return linhas.map(l => l.map(celulaCsv).join(';')).join('\r\n') + '\r\n'
}

// Lista para repassar à prefeitura: o que está errado e o que corrigir, sem ids internos que ela não usa
export function csvPrefeitura(casos, verificacao) {
  const linhas = [['codigo', 'nome', 'cpfCnpj', 'problema', 'detalhe', 'como corrigir']]
  for (const c of casos) linhas.push([c.registro.codigo, c.nome, c.registro.cpfCnpj, verificacao.nome, c.detalhe, verificacao.comoCorrigir])
  return linhas.map(l => l.map(celulaCsv).join(';')).join('\r\n') + '\r\n'
}

// Script do Studio (tributos): contribuinte + endereços + município de cada logradouro, um JSON por linha.
// Sem ".valor" em enum (principal): em exportação ampla o enum pode vir fora do formato e o script quebra —
// vai inteiro e o App desembrulha.
export function montarScriptExportacao(checagem) {
  if (checagem.id !== 'contribuintes') return ''
  return `// ---------------------------------------------------------------------------
// Checagem de migração — Contribuintes: exportação
//
// Um JSON por linha: o contribuinte, os endereços dele e o município de cada
// logradouro. Carregue o .jsonl em Checagem → Migração → Contribuintes.
//
// Fontes:
//   Dados.tributos.v2.logradouros            (município de cada logradouro)
//   Dados.tributos.v2.contribuintes.enderecos (endereços, em lote)
//   Dados.tributos.v2.contribuintes
// Gerado pelo Krakion App (Checagem de migração)
// ---------------------------------------------------------------------------

NOME_ARQUIVO = "${checagem.arquivo}"

// 1) Município de cada logradouro — a fonte de endereços não traz
municipioDoLogradouro = [:]
percorrer (Dados.tributos.v2.logradouros.busca(campos: "id, municipio.id, municipio.nome")) { l ->
  municipioDoLogradouro[l.id] = [id: l.municipio?.id, nome: l.municipio?.nome]
}

// 2) Endereços agrupados por contribuinte
enderecosDe = [:]
percorrer (Dados.tributos.v2.contribuintes.enderecos.busca(campos: "id, idContribuinte, principal, numero, complemento, cep, logradouro.id, logradouro.nome, bairro.id, bairro.nome, municipio.id, municipio.nome")) { e ->
  if (enderecosDe[e.idContribuinte] == null) enderecosDe[e.idContribuinte] = []
  enderecosDe[e.idContribuinte] << [
    id: e.id,
    principal: e.principal,
    numero: e.numero,
    complemento: e.complemento,
    cep: e.cep,
    logradouro: [id: e.logradouro?.id, nome: e.logradouro?.nome, municipio: municipioDoLogradouro[e.logradouro?.id]],
    bairro: [id: e.bairro?.id, nome: e.bairro?.nome],
    municipio: [id: e.municipio?.id, nome: e.municipio?.nome]
  ]
}

// 3) Contribuintes, cada um com os seus endereços
arquivo = Arquivo.novo(NOME_ARQUIVO, 'txt', [encoding: 'utf-8'])
total = 0
percorrer (Dados.tributos.v2.contribuintes.busca(campos: "id, idTemplate, codigo, nome, cpfCnpj, inscricaoMunicipal")) { c ->
  registro = [
    id: c.id,
    idTemplate: c.idTemplate,
    codigo: c.codigo,
    nome: c.nome,
    cpfCnpj: c.cpfCnpj,
    inscricaoMunicipal: c.inscricaoMunicipal,
    enderecos: enderecosDe[c.id] ?: []
  ]
  arquivo.escrever(JSON.escrever(registro).replace("\\r", " ").replace("\\n", " "))
  arquivo.novaLinha()
  total = total + 1
}

mensagem = "Contribuintes exportados: " + total
imprimir mensagem

// O Studio já entrega o resultado zipado — não zipar aqui
Resultado.arquivo(arquivo)
`
}
