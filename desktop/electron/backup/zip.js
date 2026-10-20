import fs from 'node:fs'
import { promisify } from 'node:util'
import zlib from 'node:zlib'

// Zip mínimo, sem dependência: deflate, nomes em UTF-8 (bit 11), um arquivo por vez (nunca a pasta inteira na memória).
// Sem zip64: limites do formato clássico checados (4 GB por arquivo/no total, 65.535 entradas) — a biblioteca cabe folgada.

const deflateRaw = promisify(zlib.deflateRaw)
const LIMITE = 0xffffffff
const MAX_ENTRADAS = 0xffff

// Caminhos com mais de 260 caracteres (há alguns em _RASCUNHOS-TESTES) exigem o prefixo \\?\ no Windows
export function caminhoLongo(p) {
  if (process.platform !== 'win32' || p.startsWith('\\\\?\\') || p.length < 240) return p
  return '\\\\?\\' + p.replace(/\//g, '\\')
}

function dataDos(d) {
  const ano = Math.max(d.getFullYear(), 1980)
  return {
    hora: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    data: ((ano - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  }
}

// arquivos: [{ caminho, nome (caminho dentro do zip, com /), data? }]
export async function criarZip(destino, arquivos, { aoProgresso } = {}) {
  if (arquivos.length > MAX_ENTRADAS) throw new Error(`Pasta com ${arquivos.length} arquivos: o zip aceita até ${MAX_ENTRADAS}.`)
  const saida = await fs.promises.open(destino, 'w')
  const central = []
  let posicao = 0
  const escrever = async buf => { await saida.write(buf, 0, buf.length, posicao); posicao += buf.length }
  try {
    for (let i = 0; i < arquivos.length; i++) {
      const a = arquivos[i]
      const dados = await fs.promises.readFile(caminhoLongo(a.caminho))
      const comprimido = await deflateRaw(dados)
      if (dados.length > LIMITE || posicao + comprimido.length > LIMITE) throw new Error('O zip passaria de 4 GB — formato sem zip64.')
      const nome = Buffer.from(a.nome, 'utf8')
      const crc = zlib.crc32(dados) >>> 0
      const { hora, data } = dataDos(a.data ?? new Date())

      const local = Buffer.alloc(30)
      local.writeUInt32LE(0x04034b50, 0)
      local.writeUInt16LE(20, 4) // versão necessária
      local.writeUInt16LE(0x0800, 6) // nome em UTF-8
      local.writeUInt16LE(8, 8) // deflate
      local.writeUInt16LE(hora, 10)
      local.writeUInt16LE(data, 12)
      local.writeUInt32LE(crc, 14)
      local.writeUInt32LE(comprimido.length, 18)
      local.writeUInt32LE(dados.length, 22)
      local.writeUInt16LE(nome.length, 26)
      local.writeUInt16LE(0, 28)
      const deslocamento = posicao
      await escrever(local)
      await escrever(nome)
      await escrever(comprimido)

      const c = Buffer.alloc(46)
      c.writeUInt32LE(0x02014b50, 0)
      c.writeUInt16LE(20, 4) // feito por
      c.writeUInt16LE(20, 6)
      c.writeUInt16LE(0x0800, 8)
      c.writeUInt16LE(8, 10)
      c.writeUInt16LE(hora, 12)
      c.writeUInt16LE(data, 14)
      c.writeUInt32LE(crc, 16)
      c.writeUInt32LE(comprimido.length, 20)
      c.writeUInt32LE(dados.length, 24)
      c.writeUInt16LE(nome.length, 28)
      c.writeUInt32LE(deslocamento, 42)
      central.push(c, nome)
      aoProgresso?.({ feitos: i + 1, total: arquivos.length })
    }
    const inicioCentral = posicao
    for (const b of central) await escrever(b)
    const fim = Buffer.alloc(22)
    fim.writeUInt32LE(0x06054b50, 0)
    fim.writeUInt16LE(arquivos.length, 8)
    fim.writeUInt16LE(arquivos.length, 10)
    fim.writeUInt32LE(posicao - inicioCentral, 12)
    fim.writeUInt32LE(inicioCentral, 16)
    await escrever(fim)
    return { entradas: arquivos.length, tamanho: posicao }
  } finally {
    await saida.close()
  }
}

// Lê o zip inteiro para a memória — para testes e para restaurar pastas pequenas
export function lerZip(caminho) {
  const buf = fs.readFileSync(caminhoLongo(caminho))
  let fim = buf.length - 22
  while (fim >= 0 && buf.readUInt32LE(fim) !== 0x06054b50) fim--
  if (fim < 0) throw new Error('Arquivo zip inválido (fim do diretório não encontrado).')
  const total = buf.readUInt16LE(fim + 10)
  let p = buf.readUInt32LE(fim + 16)
  const entradas = []
  for (let i = 0; i < total; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Arquivo zip inválido (diretório central).')
    const metodo = buf.readUInt16LE(p + 10)
    const tamComp = buf.readUInt32LE(p + 20)
    const lenNome = buf.readUInt16LE(p + 28)
    const lenExtra = buf.readUInt16LE(p + 30)
    const lenComent = buf.readUInt16LE(p + 32)
    const local = buf.readUInt32LE(p + 42)
    const nome = buf.toString('utf8', p + 46, p + 46 + lenNome)
    const inicioDados = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    const bruto = buf.subarray(inicioDados, inicioDados + tamComp)
    entradas.push({ nome, conteudo: metodo === 8 ? zlib.inflateRawSync(bruto) : Buffer.from(bruto) })
    p += 46 + lenNome + lenExtra + lenComent
  }
  return entradas
}
