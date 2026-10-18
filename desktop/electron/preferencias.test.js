import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fonteDoTema, lerPreferencias, salvarPreferencias } from './preferencias.js'

test('fonteDoTema traduz a preferência do app para o nativeTheme do Electron', () => {
  assert.equal(fonteDoTema('escuro'), 'dark')
  assert.equal(fonteDoTema('claro'), 'light')
  assert.equal(fonteDoTema('sistema'), 'system')
  assert.equal(fonteDoTema('qualquer'), 'system')
  assert.equal(fonteDoTema(undefined), 'system')
})

test('preferências persistem em arquivo e começam vazias', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pref-'))
  assert.deepEqual(lerPreferencias(dir), {})
  salvarPreferencias(dir, { tema: 'escuro' })
  assert.deepEqual(lerPreferencias(dir), { tema: 'escuro' })
  salvarPreferencias(dir, { outra: 1 })
  assert.deepEqual(lerPreferencias(dir), { tema: 'escuro', outra: 1 }) // mescla, não sobrescreve
  fs.rmSync(dir, { recursive: true })
})
