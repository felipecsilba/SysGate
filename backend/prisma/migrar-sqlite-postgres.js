// Migração de dados SQLite (dev.db) → Postgres, preservando IDs.
//
// Pré-requisitos:
//   1. DATABASE_URL no .env apontando para o Postgres de destino
//   2. `npx prisma db push` já executado (tabelas criadas no Postgres)
//   3. Backend PARADO (evita escrita concorrente nos dois bancos)
//
// Uso:  node prisma/migrar-sqlite-postgres.js [caminho-do-dev.db]
//       (padrão: prisma/dev.db ao lado deste script)
//
// O dev.db é aberto somente-leitura — nada é alterado na origem.
// Idempotência: o script ABORTA se o destino já tiver dados (evita duplicar).

require('dotenv').config()
const path = require('path')
const { DatabaseSync } = require('node:sqlite')
const { PrismaClient, Prisma } = require('@prisma/client')

const SQLITE_PATH = process.argv[2] || path.join(__dirname, 'dev.db')
const pg = new PrismaClient()
const sqlite = new DatabaseSync(SQLITE_PATH, { readOnly: true })

// Ordem respeitando FKs (pai antes de filho)
const ORDEM = [
  'Usuario',
  'Sistema',
  'Municipio',
  'MunicipioSistema',
  'Endpoint',
  'Requisicao',
  'Script',
  'Tag',
  'Relatorio',
  'SwaggerSpec',
  'PortfolioMunicipio',
  'Entidade',
  'EntidadeSistema',
  'Stakeholder',
  'StakeholderSistema',
  'CatalogoVertical',
  'Solicitante',
  'Chamado',
  'ChamadoComentario',
  'ChamadoAnexo',
  'ChamadoHistorico',
  'Nota',
  'NotaCompartilhamento',
  'Conhecimento',
]
// Tabelas pivot implícitas do Prisma (colunas A/B)
const M2M = ['_ScriptToTag', '_RelatorioToTag']
// Tabelas sem coluna id autoincrement (não têm sequence para ajustar)
const SEM_SEQUENCE = new Set(['StakeholderSistema'])
// Tabelas com linhas grandes (base64/specs) — lotes menores no createMany
const LOTE_PEQUENO = new Set(['ChamadoAnexo', 'SwaggerSpec', 'Relatorio', 'Requisicao'])

const models = Object.fromEntries(Prisma.dmmf.datamodel.models.map(m => [m.name, m]))
const lcFirst = s => s.charAt(0).toLowerCase() + s.slice(1)

// SQLite guarda DateTime como epoch-ms e Boolean como 0/1 — converte pelo tipo do schema
function converterLinha(model, row) {
  const out = {}
  for (const f of model.fields) {
    if (f.kind !== 'scalar') continue
    const v = row[f.name]
    if (v === undefined) continue
    if (v === null) { out[f.name] = null; continue }
    if (f.type === 'DateTime') out[f.name] = new Date(typeof v === 'number' ? v : String(v))
    else if (f.type === 'Boolean') out[f.name] = !!v
    else if (f.type === 'Int') out[f.name] = Number(v)
    else out[f.name] = v
  }
  return out
}

async function main() {
  // Trava de segurança: destino precisa estar vazio
  const jaTem = await pg.usuario.count()
  if (jaTem > 0) {
    console.error(`ABORTADO: o Postgres de destino já tem dados (${jaTem} usuários). Limpe o banco antes (drop/create) para migrar.`)
    process.exit(1)
  }

  console.log(`Origem: ${SQLITE_PATH}`)
  console.log(`Destino: ${(process.env.DATABASE_URL || '').replace(/:[^:@/]+@/, ':****@')}\n`)

  // ── Copiar modelos na ordem de FK ──
  for (const nome of ORDEM) {
    const rows = sqlite.prepare(`SELECT * FROM "${nome}"`).all()
    if (rows.length > 0) {
      const dados = rows.map(r => converterLinha(models[nome], r))
      const lote = LOTE_PEQUENO.has(nome) ? 20 : 500
      for (let i = 0; i < dados.length; i += lote) {
        await pg[lcFirst(nome)].createMany({ data: dados.slice(i, i + lote) })
      }
    }
    console.log(`  ${nome}: ${rows.length} linha(s)`)
  }

  // ── Tabelas pivot implícitas (Script↔Tag, Relatorio↔Tag) ──
  for (const t of M2M) {
    const rows = sqlite.prepare(`SELECT * FROM "${t}"`).all()
    for (const r of rows) {
      await pg.$executeRawUnsafe(`INSERT INTO "${t}" ("A","B") VALUES ($1,$2)`, r.A, r.B)
    }
    console.log(`  ${t}: ${rows.length} vínculo(s)`)
  }

  // ── Ressincronizar sequences (próximo id = max + 1) ──
  for (const nome of ORDEM) {
    if (SEM_SEQUENCE.has(nome)) continue
    await pg.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${nome}"','id'), COALESCE((SELECT MAX(id) FROM "${nome}"), 0) + 1, false)`
    )
  }
  console.log('\nSequences ressincronizadas.')

  // ── Verificação de contagens origem × destino ──
  console.log('\nVerificação (origem → destino):')
  let divergencias = 0
  for (const t of [...ORDEM, ...M2M]) {
    const orig = sqlite.prepare(`SELECT COUNT(*) as c FROM "${t}"`).get().c
    const dest = (await pg.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM "${t}"`))[0].c
    const ok = Number(orig) === Number(dest)
    if (!ok) divergencias++
    console.log(`  ${ok ? 'OK ' : '!! '} ${t}: ${orig} → ${dest}`)
  }

  if (divergencias > 0) {
    console.error(`\n💥 ${divergencias} tabela(s) com divergência de contagem!`)
    process.exit(1)
  }
  console.log('\n🎉 Migração concluída — todas as contagens conferem.')
  await pg.$disconnect()
}

main().catch(async (e) => { console.error(e); await pg.$disconnect(); process.exit(1) })
