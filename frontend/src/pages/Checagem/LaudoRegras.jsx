import { useState } from 'react'

// Peças compartilhadas do laudo, usadas pelas duas frentes (API e Fonte).
// Extraídas para que a aparência do achado seja a mesma nos dois mundos — o
// usuário não deveria precisar reaprender a ler o laudo ao trocar de aba.

// Cada severidade tem forma própria, não só cor — o laudo é lido de relance.
const SEV = {
  erro:   { rotulo: 'erro',   barra: 'border-l-red-500',   pill: 'bg-red-100 text-red-800',     texto: 'text-red-700',   fundo: 'bg-red-50/60' },
  alerta: { rotulo: 'alerta', barra: 'border-l-amber-500', pill: 'bg-amber-100 text-amber-800', texto: 'text-amber-700', fundo: 'bg-amber-50/60' },
  ok:     { rotulo: 'ok',     barra: 'border-l-green-500', pill: 'bg-green-100 text-green-800', texto: 'text-green-700', fundo: '' },
  na:     { rotulo: 'n/a',    barra: 'border-l-gray-300',  pill: 'bg-gray-100 text-gray-600',   texto: 'text-gray-500',  fundo: '' },
}

const NOTA_CONFIG = {
  prerequisito: { rotulo: 'Pré-requisito', cls: 'bg-violet-100 text-violet-800' },
  dependencia:  { rotulo: 'Dependência',   cls: 'bg-sky-100 text-sky-800' },
  inalcancavel: { rotulo: 'Inalcançável',  cls: 'bg-amber-100 text-amber-800' },
  regra:        { rotulo: 'Regra',         cls: 'bg-gray-200 text-gray-700' },
}

// Bases convertidas usam 0 como ausência — o trecho precisa mostrar isso como
// vazio, não como valor, senão o usuário não entende por que a regra acusou.
const ehVazio = (v) => v === null || v === undefined || v === '' || v === 0 || v === '0'

// Campos que o recorte do registro mostra antes do que falta. Exportado porque o
// upload de .jsonl corta cada registro e precisa preservar estes caminhos.
const CONTEXTO = ['id', 'ano', 'anoInscricao', 'dataInscricao', 'tipoReferente', 'creditoTributario.abreviatura', 'referente.tipo', 'situacao']

const pegar = (obj, caminho) =>
  String(caminho).split('.').reduce((a, k) => (a === null || a === undefined ? undefined : a[k]), obj)

const curto = (caminho) => (caminho.includes('.') ? caminho.split('.').slice(-2).join('.') : caminho)

/**
 * Recorte do registro: contexto que explica por que a regra se aplicou, a linha
 * do que está lá hoje, e a linha do que se espera.
 */
function Trecho({ exemplo, regra }) {
  const reg = exemplo.registro || {}

  const contexto = CONTEXTO
    .map((c) => ({ c, v: pegar(reg, c) }))
    .filter((x) => x.v !== undefined && x.v !== null)
    .slice(0, 5)

  // como o campo aparece hoje: presente e vazio, ou ausente de vez
  let atual = null
  for (const caminho of regra.onde || []) {
    const v = pegar(reg, caminho)
    if (v !== undefined) { atual = { caminho, valor: v }; break }
  }

  const mostrar = (v) => {
    const d = v && typeof v === 'object' && v.valor !== undefined ? v.valor : v
    return JSON.stringify(d)
  }

  return (
    <div className="mb-2 rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
        <span className="font-mono text-xs text-gray-700">{exemplo.id}</span>
        <span className="text-[11px] text-gray-400">recorte do registro</span>
      </div>
      <pre className="m-0 px-3 py-2 bg-gray-900 text-gray-200 text-[11.5px] leading-relaxed overflow-x-auto">
{'{'}
{contexto.map(({ c, v }) => (
  <span key={c} className="block text-gray-400">{`  "${curto(c)}": ${mostrar(v)},`}</span>
))}
{atual ? (
  <span className="block bg-red-500/15 text-red-300">
    {`  "${curto(atual.caminho)}": ${mostrar(atual.valor)},   ← ${ehVazio(atual.valor) ? 'vazio' : 'não serve'}`}
  </span>
) : (
  <span className="block bg-red-500/15 text-red-300">
    {`  ${(regra.onde || [])[0]} — campo ausente`}
  </span>
)}
{regra.esperado && (
  <span className="block bg-emerald-500/15 text-emerald-300">{`  ${regra.esperado}   ← esperado`}</span>
)}
{'}'}
      </pre>
    </div>
  )
}

function Regra({ r }) {
  const [aberto, setAberto] = useState(r.severidade === 'erro')
  const c = SEV[r.severidade] || SEV.na
  const temDetalhe = r.faltam > 0 || r.naoSabemos || (r.onde || []).length > 0

  const copiarIds = async () => {
    const texto = (r.ids || []).join(', ')
    try { await navigator.clipboard.writeText(texto) } catch { /* sem clipboard: o usuário seleciona */ }
  }

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${c.fundo}`}>
      <button
        type="button"
        onClick={() => temDetalhe && setAberto(!aberto)}
        className={`w-full text-left flex items-start gap-3 px-3 py-2.5 border-l-4 ${c.barra} ${temDetalhe ? 'hover:bg-gray-50/60' : 'cursor-default'}`}
      >
        <span className={`${c.pill} px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 mt-0.5`}>
          {c.rotulo}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-gray-800">{r.nome}</span>
          {r.porque && <span className="block text-xs text-gray-500 mt-0.5">{r.porque}</span>}
        </span>
        <span className="text-xs font-mono text-gray-600 shrink-0 tabular-nums">
          {r.severidade === 'na'
            ? 'não se aplica'
            : r.faltam > 0
              ? <><strong className="text-sm text-gray-900">{r.faltam}</strong> de {r.aplicaveis}</>
              : <><strong className="text-sm text-gray-900">{r.aplicaveis}</strong> ok</>}
        </span>
      </button>

      {aberto && temDetalhe && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-200 bg-white">
          {r.faltam > 0 && (
            <>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-2 mb-1.5">
                O que está no JSON ({r.faltam} registro{r.faltam !== 1 ? 's' : ''})
              </h4>
              {(r.exemplos || []).map((ex) => <Trecho key={ex.id} exemplo={ex} regra={r} />)}
              {r.faltam > (r.exemplos || []).length && (
                <p className="text-xs text-gray-500 mb-2">
                  + {r.faltam - r.exemplos.length} outro(s) registro(s) com o mesmo problema.
                </p>
              )}
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-3 mb-1.5">
                Todos os ids afetados
              </h4>
              <div className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2.5 max-h-36 overflow-auto break-all">
                {(r.ids || []).join(', ')}
              </div>
              <button type="button" onClick={copiarIds} className="btn-secondary mt-2 text-xs">
                Copiar {r.ids.length} id{r.ids.length !== 1 ? 's' : ''}
              </button>
            </>
          )}

          {r.severidade === 'na' && (
            <p className="text-xs text-gray-500 mt-2">
              Nenhum registro deste lote se enquadra nesta regra, então ela não foi conferida.
            </p>
          )}

          {r.naoSabemos && (
            <>
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-3 mb-1">O que não sabemos</h4>
              <p className="text-xs text-gray-600">{r.naoSabemos}</p>
            </>
          )}

          <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-3 mb-1.5">Onde a regra procura</h4>
          <div className="flex flex-wrap gap-1">
            {(r.onde || []).map((o) => (
              <span key={o} className="font-mono text-[11px] bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">{o}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


export { SEV, NOTA_CONFIG, CONTEXTO, Trecho, Regra }
