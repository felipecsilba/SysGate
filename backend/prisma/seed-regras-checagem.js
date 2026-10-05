/**
 * Seed das regras de checagem — IDEMPOTENTE e NÃO destrutivo.
 *
 * Roda quantas vezes quiser: atualiza a regra se já existir (mesmo sistema +
 * frente + cadastro + nome), cria se não existir. Nunca apaga nada.
 *
 *   node prisma/seed-regras-checagem.js [sistemaId]
 *
 * O sistemaId padrão é o do Tributos. Em produção é 3; no banco local, 2.
 *
 * Toda regra aqui nasceu de dado real, e a maioria de um erro cometido antes.
 * Ver docs/plans/2026-09-28-checagem-por-regras.md.
 */
// prisma é carregado dentro de main(): os testes importam REGRAS sem abrir conexão

const REGRAS = [
  // ── Dívidas, frente FONTE (retorno do BFC-Script) ──────────────────────────
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Receita vinculada quando o crédito é Receita Diversa',
    porque:
      'Sem o vínculo, a tela de parcelamento usa o id do econômico como referente e o servidor ' +
      'responde [E001] O servidor apresentou um erro interno ao processar a requisição.',
    onde: ['idReceitaDiversa', 'idReceitaDiversaLancamento', 'referente.codigo'],
    quando: { caminhos: ['tipoReferente', 'creditoTributario.tipoCadastro'], igualA: ['RECEITAS_DIVERSAS'] },
    esperado: '"idReceitaDiversa": <id da receita diversa>',
    // Origem: no Viseu, 5 das 1445 dívidas sem vínculo constavam como PAGA_PARCELAMENTO.
    naoSabemos:
      'Já foram vistas dívidas nessa condição com situação PAGA_PARCELAMENTO, ou seja, em algum ' +
      'caminho o parcelamento passa. A falha é provável, mas não garantida.',
    comoCorrigir: 'Preencha idReceitaDiversa com a receita diversa do débito que originou a dívida. Antes, confira esse débito: se ele também está sem vínculo, corrija o débito primeiro, senão a próxima inscrição repete o defeito.',
    severidade: 'erro',
    ordem: 1,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Contribuinte informado',
    porque: 'Dívida sem contribuinte não aparece no atendimento nem entra em certidão.',
    onde: ['contribuinte.id'],
    comoCorrigir: 'Informe o contribuinte do lançamento de origem.',
    severidade: 'erro',
    ordem: 2,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Crédito tributário informado',
    porque: 'Define a receita, a rotina de cálculo e o comportamento na inscrição.',
    onde: ['creditoTributario.id'],
    comoCorrigir: 'Informe o crédito tributário do lançamento de origem.',
    severidade: 'erro',
    ordem: 3,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Data de inscrição informada',
    porque: 'Define a competência e o início da contagem de prescrição.',
    onde: ['dataInscricao'],
    comoCorrigir: 'Use a data em que a dívida foi inscrita no sistema de origem, não a data da migração: é ela que conta a prescrição.',
    severidade: 'erro',
    ordem: 4,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Valor inscrito informado',
    porque: 'Dívida sem valor inscrito não compõe saldo nem sai em certidão.',
    onde: ['valorTributoInscrito', 'valorSaldo'],
    comoCorrigir: 'Informe o valor do tributo na data da inscrição, como consta no sistema de origem.',
    severidade: 'erro',
    ordem: 5,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Livro e folha da inscrição',
    porque: 'O livro é exigido na certidão de dívida ativa e na execução fiscal.',
    onde: ['numeroLivro'],
    esperado: '"numeroLivro": <n>, "folha": <n>',
    comoCorrigir: 'Informe livro e folha da inscrição conforme o registro do sistema de origem.',
    severidade: 'alerta',
    ordem: 6,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Referente vinculado quando o crédito é de Imóveis',
    porque: 'Crédito do tipo IMOVEIS exige o imóvel; sem ele a dívida não se liga ao cadastro territorial.',
    onde: ['idImovel', 'referente.codigo'],
    quando: { caminhos: ['tipoReferente', 'creditoTributario.tipoCadastro'], igualA: ['IMOVEIS'] },
    esperado: '"idImovel": <id do imóvel>',
    comoCorrigir: 'Informe idImovel com o imóvel do lançamento de origem. Se o imóvel ainda não existe na base, migre o imóvel antes da dívida.',
    severidade: 'erro',
    ordem: 7,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Referente vinculado quando o crédito é de Econômicos',
    porque: 'Crédito do tipo ECONOMICOS exige o econômico.',
    onde: ['idEconomico', 'referente.codigo'],
    quando: { caminhos: ['tipoReferente', 'creditoTributario.tipoCadastro'], igualA: ['ECONOMICOS'] },
    esperado: '"idEconomico": <id do econômico>',
    comoCorrigir: 'Informe idEconomico com o econômico do lançamento de origem. Se o econômico ainda não existe na base, migre o econômico antes da dívida.',
    severidade: 'erro',
    ordem: 8,
  },

  // ── Dívidas, frente API (payload de migração) ──────────────────────────────
  {
    frente: 'api',
    cadastro: '/api/dividas',
    nome: 'Sistema de origem informado',
    porque: 'Sem ele o débito não cancela pela rotina do sistema.',
    onde: ['dividas.sistemaOrigem', 'sistemaOrigem'],
    esperado: '"sistemaOrigem": <código do sistema de origem, inteiro>',
    naoSabemos:
      'A spec não documenta os valores válidos (sem enum, exemplo "123"). Para comparação, ' +
      'guias.origem é string com enum [LIVRO_ENOTA, PROTOCOLO, E_NOTA, CIDADAO_WEB, ' +
      'LIVRO_ELETRONICO, TRIBUTOS, GESTAO_FISCAL]. Não se sabe se o inteiro da dívida ' +
      'corresponde a essa lista. Cuidado: existe também origemDebito, campo diferente.',
    severidade: 'alerta',
    ordem: 1,
  },
  {
    frente: 'api',
    cadastro: '/api/dividas',
    nome: 'Data de lançamento informada',
    porque:
      'A tela nunca envia esse campo — o servidor carimba sozinho. Quem migra precisa escolher a ' +
      'data, e ela define a competência fiscal: errar joga o lançamento para outro exercício.',
    onde: ['dividas.dataLancamento', 'dataLancamento'],
    esperado: '"dataLancamento": "AAAA-MM-DD"',
    comoCorrigir: 'Envie a data original do lançamento no sistema de origem, não a data da migração.',
    severidade: 'alerta',
    ordem: 2,
  },

  // ── Débitos, frente FONTE ──────────────────────────────────────────────────
  {
    frente: 'fonte',
    cadastro: 'debitos',
    nome: 'Vencimento informado',
    porque:
      'Sem vencimento o débito não vence, não gera acréscimo e nunca entra na rotina de inscrição ' +
      'em dívida ativa — fica invisível para a cobrança.',
    // a fonte debitos chama de dtVencimento; dataVencimento é o nome da API REST
    onde: ['dtVencimento', 'competencia.dataVencimento', 'dataVencimento'],
    esperado: '"dtVencimento": "AAAA-MM-DD"',
    comoCorrigir: 'Informe o vencimento de cada parcela com a data do sistema de origem.',
    severidade: 'erro',
    ordem: 1,
  },
  {
    frente: 'fonte',
    cadastro: 'debitos',
    nome: 'Receita vinculada quando o crédito é Receita Diversa',
    // Origem: Viseu, 09/2026 — os 1445 débitos que geraram dívidas sem vínculo
    // também estavam sem vínculo, com valor 0. O texto do laudo não cita o caso:
    // ele é lido em qualquer base e precisa explicar a regra, não a história.
    porque:
      'Débito de crédito do tipo Receita Diversa precisa apontar a receita diversa que o originou. ' +
      'Sem esse vínculo, a dívida gerada na inscrição também nasce sem referente e o parcelamento ' +
      'dela falha com erro interno [E001]. Valor 0 no id conta como vazio.',
    // referente.codigo fica de fora de propósito: com idReceitaDiversa 0 ele também
    // vem vazio, e se um dia vier preenchido esconderia o vínculo que falta
    onde: ['idReceitaDiversa'],
    // a fonte debitos não tem tipoReferente nem creditoTributario: o tipo vem aqui
    quando: { caminhos: ['referente.tipo', 'tipoCadastro'], igualA: ['RECEITAS_DIVERSAS'] },
    esperado: '"idReceitaDiversa": <id da receita diversa>',
    comoCorrigir: 'Vincule cada débito à receita diversa que o gerou; se a receita não foi migrada, migre-a antes. Débitos já inscritos levam o defeito para a dívida: confira também as dívidas deles. A lista de ids afetados serve para levantar os registros.',
    severidade: 'erro',
    ordem: 2,
  },
]

async function main() {
  const prisma = require('../src/lib/prisma')
  const sistemaId = parseInt(process.argv[2] || '', 10) || null

  const sistema = sistemaId
    ? await prisma.sistema.findUnique({ where: { id: sistemaId } })
    : await prisma.sistema.findFirst({ where: { nome: { contains: 'Tributos', mode: 'insensitive' } } })

  if (!sistema) {
    console.error('Sistema não encontrado. Passe o id: node prisma/seed-regras-checagem.js <sistemaId>')
    process.exit(1)
  }

  console.log(`Sistema: [${sistema.id}] ${sistema.nome}\n`)

  let criadas = 0
  let atualizadas = 0

  for (const r of REGRAS) {
    const dados = {
      sistemaId: sistema.id,
      frente: r.frente,
      cadastro: r.cadastro,
      nome: r.nome,
      porque: r.porque,
      onde: JSON.stringify(r.onde),
      quando: r.quando ? JSON.stringify(r.quando) : null,
      esperado: r.esperado || null,
      naoSabemos: r.naoSabemos || null,
      comoCorrigir: r.comoCorrigir || null,
      severidade: r.severidade || 'erro',
      ordem: r.ordem || 0,
    }

    const existente = await prisma.regraChecagem.findFirst({
      where: { sistemaId: sistema.id, frente: r.frente, cadastro: r.cadastro, nome: r.nome },
      select: { id: true },
    })

    if (existente) {
      await prisma.regraChecagem.update({ where: { id: existente.id }, data: dados })
      atualizadas++
      console.log(`  ~ ${r.frente.padEnd(5)} ${r.cadastro.padEnd(14)} ${r.nome}`)
    } else {
      await prisma.regraChecagem.create({ data: dados })
      criadas++
      console.log(`  + ${r.frente.padEnd(5)} ${r.cadastro.padEnd(14)} ${r.nome}`)
    }
  }

  console.log(`\ncriadas: ${criadas} | atualizadas: ${atualizadas}`)
  process.exit(0)
}

if (require.main === module) main().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(1)
})

module.exports = { REGRAS }
