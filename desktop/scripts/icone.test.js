import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pngParaIco } from './icone.js'

// PNG mínimo: assinatura + IHDR com largura/altura
function pngFalso(lado) {
  const b = Buffer.alloc(40)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0)
  b.writeUInt32BE(lado, 16)
  b.writeUInt32BE(lado, 20)
  return b
}

test('ICO com uma imagem PNG embutida', () => {
  const png = pngFalso(256)
  const ico = pngParaIco(png)
  assert.equal(ico.readUInt16LE(0), 0) // reservado
  assert.equal(ico.readUInt16LE(2), 1) // tipo ícone
  assert.equal(ico.readUInt16LE(4), 1) // 1 imagem
  assert.equal(ico[6], 0) // 256 é gravado como 0
  assert.equal(ico.readUInt32LE(14), png.length)
  assert.equal(ico.readUInt32LE(18), 22) // dados logo após o cabeçalho
  assert.deepEqual(ico.subarray(22), png)
})

test('lado menor que 256 é gravado como está', () => {
  assert.equal(pngParaIco(pngFalso(64))[6], 64)
})

test('rejeita o que não é PNG', () => {
  assert.throws(() => pngParaIco(Buffer.from('nao sou png')), /PNG/)
})
