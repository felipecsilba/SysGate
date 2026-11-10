import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slug, agruparTemplates, casarReadme, validacao, lerTemplate, lerConhecimento, refsDoTexto } from './biblioteca.mjs'

test('slug: sem acento, minúsculo, hífen', () => {
  assert.equal(slug('ITBI-Transferencias/casos/Dívida não foi transferida - roteiro'), 'itbi-transferencias/casos/divida-nao-foi-transferida-roteiro')
})

test('agruparTemplates: _BASE some do id, jrxml e txt do mesmo template ficam juntos, README fica de fora', () => {
  const g = agruparTemplates([
    'Relatorio_Imoveis_por_Uso_BASE.jrxml', 'Relatorio_Imoveis_por_Uso_BASE.txt',
    'Levantamento_Debitos_Sem_Sistema_Origem.txt', 'README - Relatorio Imoveis por Uso.md',
  ])
  assert.deepEqual(g, [
    { id: 'Levantamento_Debitos_Sem_Sistema_Origem', arquivos: ['Levantamento_Debitos_Sem_Sistema_Origem.txt'] },
    { id: 'Relatorio_Imoveis_por_Uso', arquivos: ['Relatorio_Imoveis_por_Uso_BASE.jrxml', 'Relatorio_Imoveis_por_Uso_BASE.txt'] },
  ])
})

test('casarReadme: pelo nome sem separadores; variante usa o README da base (o mais longo que casa)', () => {
  const rs = ['README - Guia Registrada BB PIX V2.md', 'README - Exporta Debitos Completo por Credito.md']
  assert.equal(casarReadme('Exporta_Debitos_Completo_por_Credito', rs), 'README - Exporta Debitos Completo por Credito.md')
  assert.equal(casarReadme('Guia_Registrada_BB_PIX_V2_Referente_Imovel', rs), 'README - Guia Registrada BB PIX V2.md')
  assert.equal(casarReadme('Varredura_Ampla_Imovel', rs), null)
})

test('validacao: as formas reais de escrever a validação nos READMEs', () => {
  assert.deepEqual(validacao('Template validado em produção em 05/10/2026.'), { status: 'validado', data: '2026-10-05' })
  assert.deepEqual(validacao('**Validado em produção:** Congonhas/MG, 09/11/2026'), { status: 'validado', data: '2026-11-09' })
  assert.deepEqual(validacao('Template validado em produção (PM Placas, 09/2026). Arquivo:'), { status: 'validado', data: '2026-09' })
  assert.deepEqual(validacao('## Receita completa (validada em 1 imóvel, 2026-10-20)'), { status: 'validado', data: '2026-10-20' })
  assert.deepEqual(validacao('Template validado em produção (primeiro município fechado).'), { status: 'validado', data: null })
  assert.deepEqual(validacao('Script: `X.txt`. **Ainda não validado no Studio.**'), { status: 'nao-validado', data: null })
  assert.deepEqual(validacao('Sem data nenhuma aqui. Em 01/01/2020 algo aconteceu.'), { status: 'sem-registro', data: null })
})

test('casarReadme: ignora "de", "com", "por" dos dois lados', () => {
  const rs = ['README - Exporta Campos Adicionais de Imoveis.md', 'README - Receitas com Descricao Repetida.md', 'README - Levantamento de Vinculos de Imoveis.md']
  assert.equal(casarReadme('Exporta_Campos_Adicionais_Imoveis', rs), rs[0])
  assert.equal(casarReadme('Receitas_Descricao_Repetida', rs), rs[1])
  assert.equal(casarReadme('Levantamento_Vinculos_Imoveis', rs), rs[2])
})

test('lerTemplate: com README validado e sem README', () => {
  const com = lerTemplate({ id: 'Exporta_Debitos_Completo_por_Credito', arquivos: ['Exporta_Debitos_Completo_por_Credito_BASE.txt'],
    readme: 'README - Exporta Debitos Completo por Credito.md',
    readmeTexto: '# Exporta Débitos Completo por Crédito — como usar o template\n\nTemplate validado em produção em 05/10/2026.' })
  assert.deepEqual(com, {
    id: 'template:Exporta_Debitos_Completo_por_Credito', tipo: 'template', rotulo: 'Exporta Débitos Completo por Crédito',
    arquivo: '_BIBLIOTECA/Templates/Exporta_Debitos_Completo_por_Credito_BASE.txt',
    readme: '_BIBLIOTECA/Templates/README - Exporta Debitos Completo por Credito.md', status: 'validado', validadoEm: '2026-10-05',
  })
  const sem = lerTemplate({ id: 'Varredura_Ampla_Imovel', arquivos: ['Varredura_Ampla_Imovel_BASE.txt'] })
  assert.equal(sem.status, 'sem-registro')
  assert.equal(sem.rotulo, 'Varredura Ampla Imovel')
  assert.equal(sem.readme, undefined)
})

test('refsDoTexto: template, tipo de fórmula (inclusive subtipo ITBI_*), fonte e endpoint', () => {
  const conhecidos = { templates: ['Levantamento_Vinculos_Imoveis'], tipos: ['ITBI', 'FORMULA_ACRESCIMO_DEBITO'] }
  const t = `Rode o Levantamento_Vinculos_Imoveis_BASE.txt antes.
As 28 fórmulas ITBI_TRANSFERENCIA_CREDITOS e a FORMULA_ACRESCIMO_DEBITO.
Use Dados.tributos.v2.imoveis.busca() e depois POST /api/imoveis e /api/dividas.`
  assert.deepEqual(refsDoTexto(t, conhecidos), [
    'endpoint:dividas', 'endpoint:imoveis', 'fonte:imoveis',
    'template:Levantamento_Vinculos_Imoveis', 'tipo-formula:FORMULA_ACRESCIMO_DEBITO', 'tipo-formula:ITBI',
  ])
})

test('lerConhecimento: título do 1º #, pasta da área, status bruto', () => {
  const k = lerConhecimento('ITBI-Transferencias/casos/Divida nao foi transferida - roteiro.md', '# "A dívida não foi junto"\n\ntexto', { templates: [], tipos: [] })
  assert.equal(k.no.id, 'conhecimento:itbi-transferencias/casos/divida-nao-foi-transferida-roteiro')
  assert.equal(k.no.rotulo, '"A dívida não foi junto"')
  assert.equal(k.no.pasta, 'ITBI-Transferencias')
  assert.equal(k.no.arquivo, '_CONHECIMENTO/ITBI-Transferencias/casos/Divida nao foi transferida - roteiro.md')
  assert.equal(k.no.status, undefined)
  assert.equal(lerConhecimento('_bruto/x/FONTES.md', 'sem título', { templates: [], tipos: [] }).no.status, 'bruto')
  assert.equal(lerConhecimento('_bruto/x/FONTES.md', 'sem título', { templates: [], tipos: [] }).no.rotulo, 'FONTES')
})
