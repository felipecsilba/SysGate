// Abre o Electron em dev. Remove ELECTRON_RUN_AS_NODE, que processos iniciados pelo
// VS Code herdam e que faria o Electron rodar como Node puro (sem janela).
import { spawn } from 'node:child_process'
import electron from 'electron'

const env = { ...process.env, KRAKION_DEV: '1' }
delete env.ELECTRON_RUN_AS_NODE

const filho = spawn(electron, ['.', ...process.argv.slice(2)], { stdio: 'inherit', env })
filho.on('exit', codigo => process.exit(codigo ?? 0))
for (const sinal of ['SIGINT', 'SIGTERM']) process.on(sinal, () => filho.kill(sinal))
