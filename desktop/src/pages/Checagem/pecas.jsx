import { useState } from 'react'
import Icone from '../../components/Icone'
import { CONTEXTO } from '../../lib/arquivoFonte'

// Peças do laudo. Severidade = ponto + palavra (lido de relance, sem blocos coloridos).

export const SEV = {
  erro: { rotulo: 'Erro', ponto: 'bg-perigo', texto: 'text-perigo' },
  alerta: { rotulo: 'Alerta', ponto: 'bg-amber-500', texto: 'text-amber-600 dark:text-amber-400' },
  ok: { rotulo: 'OK', ponto: 'bg-emerald-500', texto: 'text-emerald-600 dark:text-emerald-400' },
  na: { rotulo: 'Não se aplica', ponto: 'bg-suave/40', texto: 'text-suave' },
}

export const STATUS_CAMPO = {
  alerta: { rotulo: 'Fora do enum', ponto: 'bg-amber-500', texto: 'text-amber-600 dark:text-amber-400' },
  parcial: { rotulo: 'Parcial', ponto: 'bg-sky-500', texto: 'text-sky-600 dark:text-sky-400' },
  ok: { rotulo: 'Completo', ponto: 'bg-emerald-500', texto: 'text-emerald-600 dark:text-emerald-400' },
  vazio: { rotulo: 'Sempre vazio', ponto: 'bg-suave/40', texto: 'text-suave' },
  ausente: { rotulo: 'Não veio', ponto: 'border border-dashed border-suave/60', texto: 'text-suave' },
}

export const TIPO_NOTA = {
  prerequisito: 'Pré-requisito',
  dependencia: 'Dependência',
  inalcancavel: 'Inalcançável',
  regra: 'Regra',
}

export const fmtN = n => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
// 2 em 16 mil não é 0%: abaixo de 0,1% diz que existe, sem arredondar para nada
export const fmtPct = p => (p > 0 && p < 0.001 ? '<0,1%' : (p * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%')

export function Ponto({ classe }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${classe}`} />
}

export function Secao({ titulo, extra, children }) {
  return (
    <section className="mt-6">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-suave">
        {titulo}{extra && <span className="font-normal normal-case tracking-normal"> · {extra}</span>}
      </h4>
      {children}
    </section>
  )
}

// Bloco de texto explicativo (consequência, como corrigir…): título com ícone, texto neutro
export function Caixa({ icone, titulo, cor = 'text-suave', children }) {
  return (
    <div className="rounded-xl border border-borda p-3">
      <p className={`mb-1 flex items-center gap-1.5 text-xs font-medium ${cor}`}>
        <Icone nome={icone} className="h-3.5 w-3.5" /> {titulo}
      </p>
      <p className="whitespace-pre-line text-sm leading-relaxed">{children}</p>
    </div>
  )
}

export function Numero({ rotulo, valor }) {
  return (
    <div>
      <p className="text-[11px] text-suave">{rotulo}</p>
      <p className="break-all text-sm font-semibold tabular-nums">{valor}</p>
    </div>
  )
}

// Linhas com barra discreta de proporção
export function Barras({ itens, total }) {
  return (
    <ul className="space-y-1">
      {itens.map(v => (
        <li key={v.chave} className="grid grid-cols-[minmax(6rem,1fr)_minmax(3rem,7rem)_4rem_3.5rem] items-center gap-3 text-xs">
          <span className="min-w-0">
            <span className={`break-all font-mono ${v.destaque ? 'text-amber-600 dark:text-amber-400' : ''}`}>{v.rotulo}</span>
            {v.sub && <span className="block truncate text-[11px] text-suave">{v.sub}</span>}
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-texto/[0.06]">
            <span className={`block h-full rounded-full ${v.destaque ? 'bg-amber-500' : v.cor || 'bg-acento/60'}`} style={{ width: `${(v.qtd / total) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{fmtN(v.qtd)}</span>
          <span className="text-right tabular-nums text-suave">{fmtPct(v.qtd / total)}</span>
        </li>
      ))}
    </ul>
  )
}

export function Chips({ itens }) {
  return (
    <div className="flex flex-wrap gap-1">
      {itens.map(c => <code key={c} className="rounded-md bg-texto/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-suave">{c}</code>)}
    </div>
  )
}

const pegar = (obj, caminho) => String(caminho).split('.').reduce((a, k) => (a == null ? undefined : a[k]), obj)
const curto = c => (c.includes('.') ? c.split('.').slice(-2).join('.') : c)
const ehVazio = v => v === null || v === undefined || v === '' || v === 0 || v === '0'
const mostrar = v => JSON.stringify(v && typeof v === 'object' && v.valor !== undefined ? v.valor : v)

// Recorte do registro: contexto que explica por que a regra se aplicou, o que está lá hoje e o esperado.
// Bases convertidas usam 0 como ausência — o recorte mostra isso como vazio.
export function Trecho({ exemplo, regra }) {
  const reg = exemplo.registro || {}
  const contexto = CONTEXTO.map(c => ({ c, v: pegar(reg, c) })).filter(x => x.v !== undefined && x.v !== null).slice(0, 5)
  let atual = null
  for (const caminho of regra.onde || []) {
    const v = pegar(reg, caminho)
    if (v !== undefined) { atual = { caminho, valor: v }; break }
  }

  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#16181d]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[11px] text-slate-300">{exemplo.id}</span>
        <span className="text-[11px] text-slate-500">recorte do registro</span>
      </div>
      <pre className="overflow-x-auto px-3 py-2 font-mono text-[11.5px] leading-relaxed text-slate-300">
        <span className="block">{'{'}</span>
        {contexto.map(({ c, v }) => <span key={c} className="block text-slate-500">{`  "${curto(c)}": ${mostrar(v)},`}</span>)}
        <span className="block bg-red-500/15 text-red-300">
          {atual
            ? `  "${curto(atual.caminho)}": ${mostrar(atual.valor)},   ← ${ehVazio(atual.valor) ? 'vazio' : 'não serve'}`
            : `  ${(regra.onde || [])[0]} — campo ausente`}
        </span>
        {regra.esperado && <span className="block bg-emerald-500/15 text-emerald-300">{`  ${regra.esperado}   ← esperado`}</span>}
        <span className="block">{'}'}</span>
      </pre>
    </div>
  )
}

// Ids afetados em grade (um por célula: com milhares, texto corrido vira um bloco ilegível) + Copiar
export function ListaIds({ ids = [] }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    await navigator.clipboard.writeText(ids.join(', '))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }
  return (
    <>
      <div className="grid max-h-48 grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-x-3 gap-y-0.5 overflow-auto rounded-xl border border-borda p-2.5 font-mono text-xs tabular-nums">
        {ids.map(id => <span key={id} className="select-all whitespace-nowrap">{id}</span>)}
      </div>
      <button type="button" onClick={copiar} className="botao-secundario mt-2 px-2.5 py-1 text-xs">
        <Icone nome={copiado ? 'check' : 'copiar'} className="h-3.5 w-3.5" />
        {copiado ? 'Copiado' : `Copiar ${fmtN(ids.length)} id${ids.length !== 1 ? 's' : ''}`}
      </button>
    </>
  )
}
