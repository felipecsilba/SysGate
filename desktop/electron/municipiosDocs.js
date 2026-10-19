import fs from 'node:fs'
import path from 'node:path'

// Municípios: legislação e documentos de cada município, guardados como arquivos na pasta da biblioteca:
//   <raiz>/Municipios/<pasta do município>/Legislacao/<Tipo>/<arquivo>
// Na pasta e não no banco (decisão do Felipe): os agentes do Claude Code no VS Code leem os mesmos arquivos.
// Toda escrita fica restrita a Municipios/*/Legislacao — o resto da pasta (metadados etc.) não é tocado.

export const TIPOS = [
  { id: 'codigo-tributario', pasta: 'Codigo Tributario', rotulo: 'Código Tributário', prefixo: 'Código Tributário' },
  { id: 'leis', pasta: 'Leis', rotulo: 'Leis', prefixo: 'Lei' },
  { id: 'decretos', pasta: 'Decretos', rotulo: 'Decretos', prefixo: 'Decreto' },
  { id: 'portarias', pasta: 'Portarias', rotulo: 'Portarias', prefixo: 'Portaria' },
  { id: 'anotacoes', pasta: 'Anotacoes', rotulo: 'Anotações', prefixo: null },
  { id: 'outros', pasta: 'Outros', rotulo: 'Outros', prefixo: null },
]
const PASTA_LEGISLACAO = 'Legislacao'
const LIMITE_TEXTO = 5 * 1024 * 1024

const tipoPorId = id => TIPOS.find(t => t.id === id)
const dirMunicipios = raiz => path.join(raiz, 'Municipios')

// Nome que o Windows aceita: sem \ / : * ? " < > | e sem ponto/espaço no fim
export function limparNome(nome) {
  return String(nome ?? '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '')
}

// "PREFEITURA MUNICIPAL DE CRICIUMA — Criciúma" → { entidade, nome }; pasta nova é só o nome
export function interpretarPastaMunicipio(pasta) {
  const i = pasta.lastIndexOf(' — ')
  return i < 0 ? { entidade: null, nome: pasta } : { entidade: pasta.slice(0, i), nome: pasta.slice(i + 3) }
}

// Documento → nome de arquivo: "Lei 524-2021 - PROREFIS.pdf", "Código Tributário 2015.pdf", "Anotações gerais.md"
export function nomeDocumento({ tipo, numero, ano, assunto, ext }) {
  const t = tipoPorId(tipo)
  const num = limparNome(numero).replace(/\s+/g, '')
  const a = String(ano ?? '').trim()
  const ident = num && a ? `${num}-${a}` : num || a
  const partes = [t?.prefixo, ident].filter(Boolean).join(' ')
  const corpo = [partes, limparNome(assunto)].filter(Boolean).join(' - ')
  return `${limparNome(corpo) || 'Documento'}${ext ? `.${String(ext).replace(/^\./, '').toLowerCase()}` : ''}`
}

// Volta do nome do arquivo para os campos (o que não seguir o padrão vira só assunto)
export function interpretarDocumento(tipo, arquivo) {
  const ext = path.extname(arquivo).slice(1).toLowerCase()
  // " (2)" é só o desempate de nome repetido — não faz parte do assunto
  const base = arquivo.slice(0, arquivo.length - (ext ? ext.length + 1 : 0)).replace(/ \(\d+\)$/, '')
  const t = tipoPorId(tipo)
  if (t?.prefixo && base.startsWith(t.prefixo)) {
    const resto = base.slice(t.prefixo.length).trim()
    const m = /^([^\s-]+?)?(?:-?(\d{4}))?(?:\s+-\s+(.*)|$)/.exec(resto)
    if (m) {
      let [, numero = '', ano = '', assunto = ''] = m
      if (!ano && /^\d{4}$/.test(numero) && t.id === 'codigo-tributario') { ano = numero; numero = '' }
      return { numero, ano, assunto, ext }
    }
  }
  return { numero: '', ano: '', assunto: base, ext }
}

// Caminho relativo (o "id" que a tela usa) → absoluto, só dentro de Municipios/<município>/Legislacao
export function resolverDoc(raiz, id) {
  const base = path.resolve(dirMunicipios(raiz))
  const alvo = path.resolve(base, String(id ?? ''))
  const rel = path.relative(base, alvo).split(path.sep)
  if (alvo.startsWith(base + path.sep) && rel.length >= 3 && rel[1] === PASTA_LEGISLACAO && !rel.includes('..')) return alvo
  throw new Error('Caminho fora da pasta de documentos do município')
}

function pastaDoMunicipio(raiz, pasta) {
  const alvo = path.resolve(dirMunicipios(raiz), String(pasta ?? ''))
  if (path.dirname(alvo) !== path.resolve(dirMunicipios(raiz)) || !pasta) throw new Error('Município inválido')
  return alvo
}

const relDe = (raiz, abs) => path.relative(dirMunicipios(raiz), abs).split(path.sep).join('/')
const lerDir = p => { try { return fs.readdirSync(p, { withFileTypes: true }) } catch { return [] } }

// Só entram os municípios ativados (com pasta Legislacao). As pastas que só têm metadados/ são dos municípios
// de onde vieram scripts e fórmulas — ficam no disco, mas fora da lista.
export function listarMunicipios(raiz) {
  const dir = dirMunicipios(raiz)
  if (!fs.existsSync(dir)) return { existe: false, municipios: [] }
  const municipios = lerDir(dir).filter(e => e.isDirectory() && fs.existsSync(path.join(dir, e.name, PASTA_LEGISLACAO))).map(e => {
    const leg = path.join(dir, e.name, PASTA_LEGISLACAO)
    const documentos = TIPOS.reduce((n, t) => n + lerDir(path.join(leg, t.pasta)).filter(f => f.isFile()).length, 0)
    return { pasta: e.name, ...interpretarPastaMunicipio(e.name), documentos }
  })
  municipios.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return { existe: true, municipios }
}

const semAcento = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Ativa o município: se já existe pasta com esse nome (ex.: a dos metadados), reaproveita; senão cria
export function criarMunicipio(raiz, nome) {
  const limpo = limparNome(nome)
  if (!limpo) throw new Error('Informe o nome do município.')
  const existente = lerDir(dirMunicipios(raiz)).find(e => e.isDirectory() && semAcento(interpretarPastaMunicipio(e.name).nome) === semAcento(limpo))
  const pasta = existente?.name || limpo
  const leg = path.join(dirMunicipios(raiz), pasta, PASTA_LEGISLACAO)
  if (fs.existsSync(leg)) throw new Error(`${interpretarPastaMunicipio(pasta).nome} já está na lista.`)
  fs.mkdirSync(leg, { recursive: true })
  return pasta
}

/**
 * O que mandar para a Lixeira ao remover o município da lista: só a pasta Legislacao (com os documentos);
 * a pasta do município inteira apenas quando ela só tinha a Legislacao (metadados nunca são apagados).
 */
export function alvosParaRemover(raiz, pasta) {
  const dir = pastaDoMunicipio(raiz, pasta)
  const leg = path.join(dir, PASTA_LEGISLACAO)
  if (!fs.existsSync(leg)) throw new Error('Este município não está na lista.')
  const outros = lerDir(dir).filter(e => e.name !== PASTA_LEGISLACAO)
  return [outros.length ? leg : dir]
}

export function listarDocumentos(raiz, pasta) {
  const leg = path.join(pastaDoMunicipio(raiz, pasta), PASTA_LEGISLACAO)
  const docs = []
  for (const t of TIPOS) {
    for (const e of lerDir(path.join(leg, t.pasta))) {
      if (!e.isFile() || e.name.startsWith('.') || e.name.startsWith('~$')) continue
      const abs = path.join(leg, t.pasta, e.name)
      const st = fs.statSync(abs)
      docs.push({ id: relDe(raiz, abs), tipo: t.id, arquivo: e.name, tamanho: st.size, modificado: st.mtimeMs, ...interpretarDocumento(t.id, e.name) })
    }
  }
  return docs
}

// "Lei 1.pdf" já existe → "Lei 1 (2).pdf"
function livre(dir, arquivo) {
  const ext = path.extname(arquivo)
  const base = arquivo.slice(0, arquivo.length - ext.length)
  let nome = arquivo
  for (let i = 2; fs.existsSync(path.join(dir, nome)); i++) nome = `${base} (${i})${ext}`
  return nome
}

/** Copia arquivos para o tipo; com um arquivo só e dados preenchidos, já grava com o nome padronizado. */
export function anexar(raiz, pasta, tipo, origens, meta = {}) {
  const t = tipoPorId(tipo)
  if (!t) throw new Error('Tipo inválido')
  const dir = path.join(pastaDoMunicipio(raiz, pasta), PASTA_LEGISLACAO, t.pasta)
  fs.mkdirSync(dir, { recursive: true })
  const temMeta = origens.length === 1 && (meta.numero || meta.ano || meta.assunto)
  return origens.map(origem => {
    const original = path.basename(origem)
    const desejado = temMeta ? nomeDocumento({ tipo, ...meta, ext: path.extname(original) }) : limparNome(original)
    const nome = livre(dir, desejado)
    fs.copyFileSync(origem, path.join(dir, nome))
    return relDe(raiz, path.join(dir, nome))
  })
}

/** Lê o conteúdo de texto (md, txt, csv…) até 5 MB. */
export function lerTexto(raiz, id) {
  const abs = resolverDoc(raiz, id)
  const st = fs.statSync(abs)
  if (st.size > LIMITE_TEXTO) return { grande: true, tamanho: st.size }
  return { texto: fs.readFileSync(abs, 'utf8'), tamanho: st.size }
}

/** Cria (sem id) ou regrava uma anotação em Markdown. */
export function salvarTexto(raiz, { id, pasta, tipo = 'anotacoes', titulo, texto }) {
  if (id) {
    const abs = resolverDoc(raiz, id)
    fs.writeFileSync(abs, String(texto ?? ''), 'utf8')
    return id
  }
  const t = tipoPorId(tipo)
  const dir = path.join(pastaDoMunicipio(raiz, pasta), PASTA_LEGISLACAO, t.pasta)
  fs.mkdirSync(dir, { recursive: true })
  const nome = livre(dir, `${limparNome(titulo) || 'Anotação'}.md`)
  fs.writeFileSync(path.join(dir, nome), String(texto ?? ''), 'utf8')
  return relDe(raiz, path.join(dir, nome))
}

/** Renomeia pelos campos (número, ano, assunto) e/ou muda o tipo; mantém a extensão. */
export function renomear(raiz, id, { tipo, numero, ano, assunto }) {
  const abs = resolverDoc(raiz, id)
  const rel = path.relative(dirMunicipios(raiz), abs).split(path.sep)
  const tipoAtual = TIPOS.find(t => t.pasta === rel[2])
  const novoTipo = tipoPorId(tipo) || tipoAtual
  const dir = path.join(dirMunicipios(raiz), rel[0], PASTA_LEGISLACAO, novoTipo.pasta)
  fs.mkdirSync(dir, { recursive: true })
  const desejado = nomeDocumento({ tipo: novoTipo.id, numero, ano, assunto, ext: path.extname(abs) })
  if (path.join(dir, desejado) === abs) return id
  const nome = livre(dir, desejado)
  fs.renameSync(abs, path.join(dir, nome))
  return relDe(raiz, path.join(dir, nome))
}
