import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Biblioteca de extensões: lê a pasta biblioteca/ na raiz do repositório (somente leitura).
// A pasta é a fonte da verdade — nada vai para o banco. Estrutura esperada:
//   Scripts/<categoria>/<Município - …>.txt
//   Formulas/<área>/<Município - [id -] TIPO - Descrição - Ano>.txt
//   Relatorios/<Município - Nome>/ (jrxml + fonte_dinamica.txt + parametros.txt + relatorio_info.txt)

export const PASTA_PADRAO = fileURLToPath(new URL('../../biblioteca', import.meta.url))

const TIPOS = [
  { tipo: 'script', pasta: 'Scripts' },
  { tipo: 'formula', pasta: 'Formulas' },
  { tipo: 'relatorio', pasta: 'Relatorios' },
]

const semExtensao = n => n.replace(/\.(txt|groovy|bfc)$/i, '')

// Nome do arquivo/pasta → { municipio, nome, detalhe }
export function interpretarNome(tipo, base) {
  const partes = semExtensao(base).split(' - ')
  const municipio = partes.length > 1 ? partes.shift() : null
  if (tipo === 'formula') {
    // [id -] TIPO_FORMULA - Descrição - Ano
    if (/^\d{10,}$/.test(partes[0])) partes.shift()
    const ano = /^\d{4}$/.test(partes.at(-1)) ? partes.pop() : null
    const codigo = /^[A-Z0-9_]+$/.test(partes[0]) && partes.length > 1 ? partes.shift() : null
    return { municipio, nome: partes.join(' - '), detalhe: [codigo, ano].filter(Boolean).join(' · ') || null, ano, codigo }
  }
  // Crítica: ÁREA - {'identificador'_ 'CRIACAO', …} - Nome
  const iDict = partes.findIndex(p => p.startsWith('{'))
  if (iDict >= 0) {
    const evento = /'identificador'_ '([^']+)'/.exec(partes[iDict])?.[1]
    const area = partes.slice(0, iDict).join(' - ')
    return { municipio, nome: partes.slice(iDict + 1).join(' - ') || area, detalhe: [area, evento].filter(Boolean).join(' · ') || null }
  }
  return { municipio, nome: partes.join(' - '), detalhe: null }
}

// Cabeçalho "// Chave : Valor" que a extração grava no topo das fórmulas
export function lerCabecalho(texto) {
  const meta = []
  for (const linha of texto.split(/\r?\n/).slice(0, 30)) {
    const m = /^\/\/\s*([^:]{2,30}?)\s*:\s*(.*)$/.exec(linha)
    if (!m) { if (meta.length) break; continue }
    if (m[2].trim() && m[2].trim() !== 'None') meta.push([m[1].trim(), m[2].trim()])
  }
  return meta
}

// Garante que o caminho pedido pela tela fica DENTRO da pasta da biblioteca
export function resolverDentro(raiz, relativo) {
  const base = path.resolve(raiz)
  const alvo = path.resolve(base, String(relativo ?? ''))
  if (alvo !== base && !alvo.startsWith(base + path.sep)) throw new Error('Caminho fora da biblioteca')
  return alvo
}

const lerDir = async p => {
  try { return await fs.promises.readdir(p, { withFileTypes: true }) } catch { return [] }
}

/** Índice leve: só nomes (nenhum arquivo é aberto). */
export async function indexar(raiz) {
  if (!fs.existsSync(raiz)) return { raiz, existe: false, itens: [] }
  const itens = []
  for (const { tipo, pasta } of TIPOS) {
    const dir = path.join(raiz, pasta)
    if (tipo === 'relatorio') {
      for (const e of await lerDir(dir)) {
        if (!e.isDirectory()) continue
        itens.push({ id: `${pasta}/${e.name}`, tipo, grupo: null, ...interpretarNome(tipo, e.name) })
      }
      continue
    }
    for (const g of await lerDir(dir)) {
      if (!g.isDirectory()) continue
      for (const e of await lerDir(path.join(dir, g.name))) {
        if (!e.isFile() || !/\.(txt|groovy|bfc)$/i.test(e.name)) continue
        itens.push({ id: `${pasta}/${g.name}/${e.name}`, tipo, grupo: g.name, ...interpretarNome(tipo, e.name) })
      }
    }
  }
  return { raiz, existe: true, itens }
}

const ORDEM_RELATORIO = [/^fonte_dinamica\.txt$/i, /\.jrxml$/i, /^parametros\.txt$/i, /^relatorio_info\.txt$/i]
const ROTULO_RELATORIO = n => (/^fonte_dinamica/i.test(n) ? 'Fonte dinâmica' : /\.jrxml$/i.test(n) ? 'Layout (jrxml)' : /^parametros/i.test(n) ? 'Parâmetros' : /^relatorio_info/i.test(n) ? 'Informações' : n)
const LIMITE_LEITURA = 5 * 1024 * 1024

/** Conteúdo de um item: script/fórmula = um arquivo; relatório = os arquivos da pasta. */
export async function lerItem(raiz, id) {
  const alvo = resolverDentro(raiz, id)
  const st = await fs.promises.stat(alvo)
  const ler = async (p, nome) => {
    const s = await fs.promises.stat(p)
    const texto = s.size > LIMITE_LEITURA ? null : await fs.promises.readFile(p, 'utf8')
    return { nome, rotulo: ROTULO_RELATORIO(nome), tamanho: s.size, texto, grande: texto === null }
  }
  if (st.isFile()) {
    const arq = await ler(alvo, path.basename(alvo))
    return { id, arquivos: [arq], meta: arq.texto ? lerCabecalho(arq.texto) : [] }
  }
  const nomes = (await lerDir(alvo)).filter(e => e.isFile()).map(e => e.name)
  const peso = n => { const i = ORDEM_RELATORIO.findIndex(r => r.test(n)); return i < 0 ? 99 : i }
  nomes.sort((a, b) => peso(a) - peso(b) || a.localeCompare(b))
  const arquivos = await Promise.all(nomes.map(n => ler(path.join(alvo, n), n)))
  return { id, arquivos, meta: [] }
}

const normalizar = t => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Busca no conteúdo (sem acento nem caixa). Devolve id + a primeira linha que bateu, até `limite` itens. */
export async function buscarConteudo(raiz, ids, termo, { limite = 300 } = {}) {
  const t = normalizar(termo).trim()
  if (t.length < 3) return { achados: [], lidos: 0, cortado: false }
  const achados = []
  let lidos = 0
  for (const id of ids) {
    if (achados.length >= limite) return { achados, lidos, cortado: true }
    let alvo
    try { alvo = resolverDentro(raiz, id) } catch { continue }
    let arquivos = [alvo]
    try {
      if ((await fs.promises.stat(alvo)).isDirectory()) {
        arquivos = (await lerDir(alvo)).filter(e => e.isFile()).map(e => path.join(alvo, e.name))
      }
    } catch { continue }
    for (const arq of arquivos) {
      let texto
      try { texto = await fs.promises.readFile(arq, 'utf8') } catch { continue }
      lidos++
      const linhas = texto.split(/\r?\n/)
      const i = linhas.findIndex(l => normalizar(l).includes(t))
      if (i >= 0) {
        achados.push({ id, arquivo: path.basename(arq), linha: i + 1, trecho: linhas[i].trim().slice(0, 200) })
        break
      }
    }
  }
  return { achados, lidos, cortado: false }
}
