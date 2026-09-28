/**
 * Motor de avaliação de REGRAS — puro, sem Prisma, igual a lib/checagem.js.
 *
 * Diferença para o motor de spec (checagem.js): aquele valida um payload contra
 * o bodySchema do Swagger; este avalia regras escritas por gente, que sabem
 * onde procurar o dado e o que quebra quando ele falta.
 *
 * As decisões abaixo custaram um erro cada, durante a calibragem contra dados
 * reais em 28/09/2026. Ver docs/plans/2026-09-28-checagem-por-regras.md.
 */

/**
 * A fonte BFC devolve enums como objeto: { descricao: "Receitas diversas",
 * valor: "RECEITAS_DIVERSAS" }. Comparar com String() daria "[object Object]"
 * e nenhuma condição casaria.
 */
function desembrulhar(valor) {
  if (valor && typeof valor === 'object' && !Array.isArray(valor) && valor.valor !== undefined) {
    return valor.valor
  }
  return valor
}

/**
 * Bases convertidas de sistemas antigos usam ZERO no lugar de nulo em campos de
 * id (idReceitaDiversa, idEconomico, idDebito). Testar apenas "!= null" deu
 * falso positivo em 1445 dívidas do Viseu.
 */
function vazio(valor) {
  const v = desembrulhar(valor)
  return v === undefined || v === null || v === '' || v === 0 || v === '0' || v === 'null'
}

/** Caminho pontilhado, tolerante a nulo no meio: pegar(obj, 'a.b.c'). */
function pegar(obj, caminho) {
  return String(caminho)
    .split('.')
    .reduce((atual, chave) => (atual === null || atual === undefined ? undefined : atual[chave]), obj)
}

/**
 * quando: { caminhos: [...], igualA: [...] }
 * A regra só se aplica ao registro quando o primeiro caminho preenchido casa
 * com algum dos valores de igualA (comparação sem caixa).
 */
function condicaoBate(registro, quando) {
  if (!quando || !Array.isArray(quando.caminhos) || !Array.isArray(quando.igualA)) return true
  const bruto = quando.caminhos.map((c) => pegar(registro, c)).find((v) => v !== undefined && v !== null)
  const valor = String(desembrulhar(bruto) ?? '').toUpperCase()
  return quando.igualA.some((alvo) => String(alvo).toUpperCase() === valor)
}

/** Identificação legível do registro no laudo. */
function identificar(registro, indice) {
  const id = ['id', 'idDivida', 'idDebito', 'idIntegracao', 'codigo']
    .map((c) => pegar(registro, c))
    .find((v) => v !== undefined && v !== null && v !== '')
  return id === undefined ? `#${indice + 1}` : String(id)
}

/**
 * regra: {
 *   id, nome, porque,
 *   onde: [caminhos],      // o primeiro caminho preenchido satisfaz a regra
 *   quando?: { caminhos, igualA },
 *   esperado?, naoSabemos?,
 *   severidade: 'erro' | 'alerta'
 * }
 *
 * Retorna, por regra: quantos registros ela alcançou, quais falharam (com o
 * registro inteiro, para o laudo montar o trecho) e a severidade resultante.
 */
function avaliarRegras({ registros, regras }) {
  const lista = Array.isArray(registros) ? registros : []
  return (regras || []).map((regra) => {
    const faltando = []
    let aplicaveis = 0

    lista.forEach((registro, indice) => {
      if (!condicaoBate(registro, regra.quando)) return
      aplicaveis++
      const achou = (regra.onde || []).some((caminho) => !vazio(pegar(registro, caminho)))
      if (!achou) faltando.push({ id: identificar(registro, indice), registro })
    })

    return {
      regraId: regra.id,
      nome: regra.nome,
      aplicaveis,
      faltando,
      severidade: faltando.length === 0 ? 'ok' : regra.severidade || 'erro',
    }
  })
}

module.exports = { avaliarRegras, condicaoBate, identificar, vazio, desembrulhar, pegar }
