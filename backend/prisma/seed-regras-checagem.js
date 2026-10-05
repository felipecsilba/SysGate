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
    naoSabemos:
      'Cinco dívidas nessa condição constam como PAGA_PARCELAMENTO no Viseu, ou seja, em algum ' +
      'caminho o parcelamento passou. O erro pode não ser inevitável.',
    severidade: 'erro',
    ordem: 1,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Contribuinte informado',
    porque: 'Dívida sem contribuinte não aparece no atendimento nem entra em certidão.',
    onde: ['contribuinte.id'],
    severidade: 'erro',
    ordem: 2,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Crédito tributário informado',
    porque: 'Define a receita, a rotina de cálculo e o comportamento na inscrição.',
    onde: ['creditoTributario.id'],
    severidade: 'erro',
    ordem: 3,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Data de inscrição informada',
    porque: 'Define a competência e o início da contagem de prescrição.',
    onde: ['dataInscricao'],
    severidade: 'erro',
    ordem: 4,
  },
  {
    frente: 'fonte',
    cadastro: 'dividas',
    nome: 'Valor inscrito informado',
    porque: 'Dívida sem valor inscrito não compõe saldo nem sai em certidão.',
    onde: ['valorTributoInscrito', 'valorSaldo'],
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
    severidade: 'erro',
    ordem: 1,
  },
  {
    frente: 'fonte',
    cadastro: 'debitos',
    nome: 'Receita vinculada quando o crédito é Receita Diversa',
    porque:
      'É a origem do mesmo defeito que quebra o parcelamento na dívida: no Viseu, os 1445 débitos ' +
      'que geraram dívidas sem vínculo também estavam sem vínculo, com valor 0.',
    // referente.codigo fica de fora de propósito: com idReceitaDiversa 0 ele também
    // vem vazio, e se um dia vier preenchido esconderia o vínculo que falta
    onde: ['idReceitaDiversa'],
    // a fonte debitos não tem tipoReferente nem creditoTributario: o tipo vem aqui
    quando: { caminhos: ['referente.tipo', 'tipoCadastro'], igualA: ['RECEITAS_DIVERSAS'] },
    esperado: '"idReceitaDiversa": <id da receita diversa>',
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
