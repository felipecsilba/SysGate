import zlib from 'node:zlib'

// Exporta todas as tabelas do schema public para JSON compactado. O Postgres embutido não traz pg_dump; o JSON também
// independe da versão do Postgres e serve de base para restaurar em outra máquina.
// consultar(sql) → linhas (injetado: pg no main, falso nos testes).

export async function exportarBanco(consultar) {
  const tabelas = (await consultar(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
  )).map(t => t.table_name)

  const dados = { formato: 'krakion-banco-v1', geradoEm: new Date().toISOString(), tabelas: {} }
  const contagens = {}
  for (const t of tabelas) {
    const linhas = await consultar(`SELECT * FROM "${t.replace(/"/g, '""')}"`)
    dados.tabelas[t] = linhas
    contagens[t] = linhas.length
  }
  return { conteudo: zlib.gzipSync(Buffer.from(JSON.stringify(dados))), contagens }
}
