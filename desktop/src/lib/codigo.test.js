import { test } from 'node:test'
import assert from 'node:assert/strict'
import { highlightCode, highlightXml, BFC_SCRIPT } from './codigo.js'

test('escapa HTML antes de colorir (conteúdo nunca vira marcação)', () => {
  const html = highlightCode('<img src=x onerror=alert(1)> "<b>"')
  assert.ok(!html.includes('<img'))
  assert.ok(!html.includes('<b>'))
  assert.ok(html.includes('&lt;img'))
})

test('pinta palavra-chave, string, número e comentário', () => {
  const html = highlightCode('if (x) return "a" // fim\n42')
  assert.match(html, /color:#569cd6">if</)
  assert.match(html, /color:#ce9178">"a"</)
  assert.match(html, /color:#6a9955">\/\/ fim</)
  assert.match(html, /color:#b5cea8">42</)
})

test('highlightCode aceita palavras extras (BFC-Script) sem mudar o padrão', () => {
  assert.match(highlightCode('se (x) { retornar 1 }', BFC_SCRIPT), /color:#569cd6">se</)
  assert.doesNotMatch(highlightCode('se (x)'), /color:#569cd6">se</)
})

test('highlightXml colore tag e atributo e nunca deixa marcação passar', () => {
  const html = highlightXml('<band height="20"><![CDATA[$F{nome}]]><script>x</script><!-- c --></band>')
  assert.match(html, /color:#569cd6">band</)
  assert.match(html, /color:#9cdcfe">height</)
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('&lt;<span style="color:#569cd6">script</span>&gt;x'))
})
