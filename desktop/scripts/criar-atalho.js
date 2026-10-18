// Cria os atalhos "Krakion App" na Área de Trabalho e no Menu Iniciar.
// Abre o Electron direto com a interface compilada (dist/) — sem terminal, sem Vite.
// Uso: npm run atalho   (compila a interface antes)
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import electron from 'electron'
import { pngParaIco } from './icone.js'

const NOME = 'Krakion App'
const RAIZ = path.resolve(import.meta.dirname, '..')

if (process.platform !== 'win32') {
  console.error('Atalhos só no Windows por enquanto.')
  process.exit(1)
}
if (!fs.existsSync(path.join(RAIZ, 'dist', 'index.html'))) {
  console.error('Interface não compilada. Rode "npm run atalho" (ele compila antes).')
  process.exit(1)
}

const icone = path.join(RAIZ, 'build', 'icone.ico')
fs.mkdirSync(path.dirname(icone), { recursive: true })
fs.writeFileSync(icone, pngParaIco(fs.readFileSync(path.join(RAIZ, 'public', 'favicon.png'))))

// Valores entram por variável de ambiente — nada de interpolar caminho dentro do script PowerShell
const ps = `
$shell = New-Object -ComObject WScript.Shell
foreach ($pasta in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
  $lnk = $shell.CreateShortcut((Join-Path $pasta ($env:K_NOME + '.lnk')))
  $lnk.TargetPath = $env:K_ALVO
  $lnk.Arguments = '"' + $env:K_RAIZ + '"'
  $lnk.WorkingDirectory = $env:K_RAIZ
  $lnk.IconLocation = $env:K_ICONE + ',0'
  $lnk.Description = 'Krakion App - ferramenta local do implantador'
  $lnk.Save()
  Write-Output $lnk.FullName
}`

const env = { ...process.env, K_NOME: NOME, K_ALVO: electron, K_RAIZ: RAIZ, K_ICONE: icone }
const saida = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { env, encoding: 'utf8' })
console.log('Atalhos criados:\n' + saida.trim().split(/\r?\n/).map(l => '  ' + l).join('\n'))
