// Gera o .ico do app a partir do PNG 256px (formato PNG-dentro-de-ICO, aceito desde o Windows Vista).
const ASSINATURA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export function pngParaIco(png) {
  if (png.length < 24 || !png.subarray(0, 8).equals(ASSINATURA_PNG)) {
    throw new Error('O arquivo de origem não é um PNG')
  }
  const largura = png.readUInt32BE(16)
  const altura = png.readUInt32BE(20)

  const cab = Buffer.alloc(22)
  cab.writeUInt16LE(0, 0) // reservado
  cab.writeUInt16LE(1, 2) // tipo: ícone
  cab.writeUInt16LE(1, 4) // quantidade de imagens
  cab[6] = largura >= 256 ? 0 : largura // 0 = 256
  cab[7] = altura >= 256 ? 0 : altura
  cab[8] = 0 // paleta
  cab[9] = 0 // reservado
  cab.writeUInt16LE(1, 10) // planos
  cab.writeUInt16LE(32, 12) // bits por pixel
  cab.writeUInt32LE(png.length, 14)
  cab.writeUInt32LE(22, 18) // offset dos dados
  return Buffer.concat([cab, png])
}
