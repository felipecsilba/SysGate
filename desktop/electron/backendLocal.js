import { spawn } from 'node:child_process'
import path from 'node:path'

export const PORTA_BACKEND = Number(process.env.KRAKION_PORTA_BACKEND) || 3101
const BACKEND = path.resolve(import.meta.dirname, '../../backend')

let filho = null

// Sobe o backend do Krakion apontando para o banco embutido.
// A env explícita vence o backend/.env (dotenv não sobrescreve variáveis já definidas).
// `node` do PATH: o Node do Electron não tem o engine do Prisma compilado para ele.
export function iniciar({ databaseUrl, jwtSecret }) {
  filho = spawn('node', ['src/index.js'], {
    cwd: BACKEND,
    windowsHide: true, // aberto por atalho, sem isso aparece uma janela de console
    env: {
      ...process.env,
      PORT: String(PORTA_BACKEND),
      HOST: '127.0.0.1', // só esta máquina — nunca exposto na rede local
      DATABASE_URL: databaseUrl,
      JWT_SECRET: jwtSecret,
      KRAKION_DESKTOP: '1',
    },
  })
  const log = d => String(d).trimEnd().split('\n').forEach(l => console.log('[backend]', l))
  filho.stdout.on('data', log)
  filho.stderr.on('data', log)
  filho.on('exit', codigo => {
    console.log('[backend] encerrado, código', codigo)
    filho = null
  })
}

export function parar() {
  return new Promise(resolve => {
    if (!filho) return resolve()
    filho.once('exit', () => resolve())
    filho.kill()
  })
}
