import fs from 'node:fs'
import path from 'node:path'

// Preferências de interface que o processo main precisa ANTES de abrir a janela
// (ex.: o tema, para a tela de carregamento já nascer escura). <userData>/preferencias.json
function arquivo(userData) {
  return path.join(userData, 'preferencias.json')
}

export function lerPreferencias(userData) {
  try {
    return JSON.parse(fs.readFileSync(arquivo(userData), 'utf8'))
  } catch {
    return {}
  }
}

export function salvarPreferencias(userData, novas) {
  fs.mkdirSync(userData, { recursive: true })
  fs.writeFileSync(arquivo(userData), JSON.stringify({ ...lerPreferencias(userData), ...novas }, null, 2))
}

// Preferência do app ('sistema' | 'claro' | 'escuro') → nativeTheme.themeSource.
// Com isso o prefers-color-scheme de TODAS as páginas (carregando.html inclusive) segue o app.
export function fonteDoTema(preferencia) {
  return { claro: 'light', escuro: 'dark' }[preferencia] ?? 'system'
}
