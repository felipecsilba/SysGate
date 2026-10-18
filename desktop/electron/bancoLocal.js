import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { lerConfig, salvarConfig } from './configLocal.js'
import { hashArquivo, precisaAplicarSchema } from './schemaHash.js'

export const PORTA_BANCO = Number(process.env.KRAKION_PORTA_BANCO) || 5433
const USUARIO = 'krakion'
const BANCO = 'krakion'

const BACKEND = path.resolve(import.meta.dirname, '../../backend')
const SCHEMA = path.join(BACKEND, 'prisma', 'schema.prisma')
const PRISMA_CLI = path.join(BACKEND, 'node_modules', 'prisma', 'build', 'index.js')

// Usamos do pacote embedded-postgres só os binários oficiais do Postgres (initdb, pg_ctl).
// O ciclo de vida é controlado por pg_ctl: o stop() da biblioteca no Windows faz
// taskkill /f (sem desligamento limpo) e o gancho de saída dela quebra no Electron.
async function binarios() {
  const so = { win32: 'windows', darwin: 'darwin', linux: 'linux' }[process.platform]
  return import(`@embedded-postgres/${so}-${process.arch}`)
}

let pastaDados = null

function executar(comando, args, { saida = true } = {}) {
  return new Promise((resolve, reject) => {
    const filho = spawn(comando, args, {
      windowsHide: true,
      // pg_ctl start deixa o postgres rodando: com pipes herdados, o Node esperaria por ele
      stdio: saida ? ['ignore', 'pipe', 'pipe'] : 'ignore',
    })
    let texto = ''
    filho.stdout?.on('data', d => { texto += d })
    filho.stderr?.on('data', d => { texto += d })
    filho.on('error', reject)
    filho.on('exit', codigo => resolve({ codigo, texto: texto.trim() }))
  })
}

export function urlBanco(cfg) {
  return `postgresql://${USUARIO}:${cfg.pgSenha}@127.0.0.1:${PORTA_BANCO}/${BANCO}`
}

async function criarCluster(initdb, dir, senha) {
  fs.rmSync(dir, { recursive: true, force: true }) // restos de uma inicialização interrompida
  const arquivoSenha = path.join(path.dirname(dir), '.pgsenha')
  fs.writeFileSync(arquivoSenha, senha)
  try {
    const r = await executar(initdb, [
      `--pgdata=${dir}`, `--username=${USUARIO}`, `--pwfile=${arquivoSenha}`, '--auth=scram-sha-256',
      // Provider builtin (PG 17+): UTF-8 com case mapping Unicode, independente do locale do Windows
      '--encoding=UTF8', '--locale-provider=builtin', '--builtin-locale=C.UTF-8',
    ])
    if (r.codigo !== 0) throw new Error('Falha ao criar o banco local (initdb):\n' + r.texto)
  } finally {
    fs.rmSync(arquivoSenha, { force: true })
  }
}

async function criarBanco(cfg) {
  const cliente = new pg.Client({
    host: '127.0.0.1', port: PORTA_BANCO, user: USUARIO, password: cfg.pgSenha, database: 'postgres',
  })
  await cliente.connect()
  try {
    const existe = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [BANCO])
    if (!existe.rowCount) await cliente.query(`CREATE DATABASE ${BANCO}`)
  } finally {
    await cliente.end()
  }
}

function aplicarSchema(databaseUrl) {
  return new Promise((resolve, reject) => {
    const filho = spawn('node', [PRISMA_CLI, 'db', 'push', '--skip-generate', `--schema=${SCHEMA}`], {
      cwd: BACKEND,
      windowsHide: true,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    })
    let saida = ''
    filho.stdout.on('data', d => { saida += d })
    filho.stderr.on('data', d => { saida += d })
    filho.on('error', reject)
    filho.on('exit', codigo => {
      console.log('[banco] prisma db push:\n' + saida.trim())
      codigo === 0 ? resolve() : reject(new Error('Falha ao aplicar o schema do banco:\n' + saida.trim()))
    })
  })
}

// Liga o Postgres embutido (cria o cluster na 1ª vez) e garante o schema atualizado.
// Devolve { databaseUrl, jwtSecret } para o backend.
export async function iniciar(userData, onStatus = () => {}) {
  const { initdb, pg_ctl } = await binarios()
  const cfg = lerConfig(userData)
  const dir = path.join(userData, 'pgdata')
  const novo = !fs.existsSync(path.join(dir, 'PG_VERSION'))

  if (novo) {
    onStatus('Criando banco local (primeira abertura)…')
    await criarCluster(initdb, dir, cfg.pgSenha)
  }

  // Se o app fechou sem desligar o banco (travou, foi morto), reaproveita o que está rodando
  const rodando = (await executar(pg_ctl, ['status', `--pgdata=${dir}`])).codigo === 0
  if (!rodando) {
    onStatus('Ligando banco local…')
    const r = await executar(pg_ctl, [
      'start', `--pgdata=${dir}`, '--wait', '--timeout=60',
      `--log=${path.join(userData, 'postgres.log')}`,
      `--options=-p ${PORTA_BANCO} -c listen_addresses=127.0.0.1`,
    ], { saida: false })
    if (r.codigo !== 0) {
      throw new Error(`O banco local não iniciou. Veja ${path.join(userData, 'postgres.log')}`)
    }
  }
  pastaDados = dir

  if (novo) await criarBanco(cfg)

  const databaseUrl = urlBanco(cfg)
  const hash = hashArquivo(SCHEMA)
  if (precisaAplicarSchema(hash, cfg.schemaHash)) {
    onStatus('Atualizando estrutura do banco…')
    await aplicarSchema(databaseUrl)
    salvarConfig(userData, { ...cfg, schemaHash: hash })
  }

  return { databaseUrl, jwtSecret: cfg.jwtSecret }
}

// Desligamento limpo (fast: encerra conexões, faz checkpoint, remove o postmaster.pid).
export async function parar() {
  if (!pastaDados) return
  const dir = pastaDados
  pastaDados = null
  const { pg_ctl } = await binarios()
  const r = await executar(pg_ctl, ['stop', `--pgdata=${dir}`, '--mode=fast', '--wait', '--timeout=30'])
  console.log('[banco]', r.codigo === 0 ? 'desligado' : `falha ao desligar (pg_ctl ${r.codigo}): ${r.texto}`)
}
