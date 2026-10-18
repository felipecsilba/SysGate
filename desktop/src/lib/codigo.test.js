import { test } from 'node:test'
import assert from 'node:assert/strict'
import { highlightCode } from './codigo.js'

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
