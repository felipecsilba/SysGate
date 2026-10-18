import { useState } from 'react'
import Abas from '../../components/Abas'
import Busca from '../../components/Busca'
import CaixaBusca from '../../components/CaixaBusca'
import Icone from '../../components/Icone'
import JsonColorido from '../../components/JsonColorido'
import { fixo } from '../../lib/corpo'
import { contem } from '../../lib/texto'

const COR_TIPO = {
  string: 'text-emerald-700 dark:text-emerald-400',
  number: 'text-sky-700 dark:text-sky-400',
  integer: 'text-sky-700 dark:text-sky-400',
  boolean: 'text-orange-700 dark:text-orange-400',
  object: 'text-violet-700 dark:text-violet-400',
}
const corTipo = t => (t?.startsWith('array') ? 'text-indigo-700 dark:text-indigo-400' : COR_TIPO[t] || 'text-suave')

function Caixa({ marcado, travado }) {
  return (
    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
      travado ? 'border-amber-500 bg-amber-500 text-white' : marcado ? 'border-acento bg-acento text-white' : 'border-borda bg-fundo'
    }`}>
      {(marcado || travado) && <Icone nome="check" className="h-3 w-3" strokeWidth={3} />}
    </span>
  )
}

function ListaCampos({ campos, selecao, onSelecao }) {
  const [busca, setBusca] = useState('')
  const alternaveis = campos.filter(c => !fixo(c))
  const todos = alternaveis.length > 0 && alternaveis.every(c => selecao[c.campo])
  const visiveis = campos.filter(c => fixo(c) || contem(c.rotulo, busca) || contem(c.pai, busca))

  let ultimoPai = null
  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-borda">
      <div className="space-y-2 border-b border-borda p-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-suave">Campos</span>
          <button
            type="button"
            className="text-[11px] font-medium text-acento hover:underline"
            onClick={() => onSelecao(s => ({ ...s, ...Object.fromEntries(alternaveis.map(c => [c.campo, !todos])) }))}
          >
            {todos ? 'Desmarcar todos' : 'Marcar todos'}
          </button>
        </div>
        <Busca valor={busca} onMudar={setBusca} placeholder="Buscar campo…" className="h-8" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {visiveis.map(c => {
          const cabecalho = c.pai && c.pai !== ultimoPai
          ultimoPai = c.pai
          const travado = fixo(c)
          const marcado = !!selecao[c.campo]
          return (
            <div key={c.campo}>
              {cabecalho && <div className="bg-texto/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-suave">{c.pai}</div>}
              <button
                type="button"
                disabled={travado}
                onClick={() => onSelecao(s => ({ ...s, [c.campo]: !s[c.campo] }))}
                title={c.descricao || undefined}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition ${c.pai ? 'pl-5' : ''} ${
                  travado ? 'cursor-default bg-amber-500/[0.06]' : marcado ? 'bg-acento/[0.06] hover:bg-acento/10' : 'hover:bg-texto/[0.03]'
                }`}
              >
                <Caixa marcado={marcado} travado={travado} />
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {c.rotulo}
                  {(c.obrigatorio || travado) && <span className="ml-0.5 text-perigo">*</span>}
                </span>
                <span className={`shrink-0 font-mono text-[10px] ${corTipo(c.tipo)}`}>{c.tipo}</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Valores({ campos, selecao, valores, onValores }) {
  const marcados = campos.filter(c => selecao[c.campo])
  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-borda">
      <div className="flex items-center gap-2 border-b border-borda px-3 py-[13px] text-[11px] font-semibold uppercase tracking-wider text-suave">
        <span className="h-1.5 w-1.5 rounded-full bg-acento" /> Valores
        {marcados.length > 0 && <span className="ml-auto font-normal normal-case tracking-normal">{marcados.length} campo{marcados.length === 1 ? '' : 's'}</span>}
      </div>
      {marcados.length ? (
        <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
          {marcados.map(c => {
            const valor = valores[c.campo] ?? ''
            const definir = v => onValores(atual => ({ ...atual, [c.campo]: v }))
            const travado = fixo(c)
            const lista = c.enum?.length ? c.enum : c.tipo === 'boolean' ? ['true', 'false'] : null
            return (
              <div key={c.campo} className="flex items-center gap-2">
                <span className="flex w-32 shrink-0 items-center gap-1.5 truncate font-mono text-xs" title={c.descricao || c.campo}>
                  <span className="truncate">{c.pai && <span className="text-suave">{c.pai}.</span>}{c.rotulo}</span>
                  {travado && <span className="shrink-0 rounded px-1 font-sans text-[9px] font-medium uppercase tracking-wide text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-400">fixo</span>}
                </span>
                <div className="min-w-0 flex-1">
                  {lista ? (
                    <CaixaBusca
                      compacta
                      buscavel={lista.length > 8}
                      opcoes={[{ valor: '', rotulo: '— vazio —' }, ...lista.map(v => ({ valor: v, rotulo: v }))]}
                      valor={valor}
                      onEscolher={definir}
                      placeholder="— selecione —"
                    />
                  ) : (
                    <input className="campo h-8 py-1 font-mono text-xs" value={valor} onChange={e => definir(e.target.value)} placeholder={c.tipo} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="flex flex-1 items-center justify-center p-4 text-center text-xs text-suave">Marque os campos ao lado para preencher.</p>
      )}
    </div>
  )
}

export default function EditorBody({ campos, selecao, onSelecao, valores, onValores, modo, onModo, json, onJson, previa, acoes }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-suave">Body</h4>
        <div className="flex items-center gap-3">
          {acoes}
          {acoes && campos.length > 0 && <span className="h-5 w-px bg-borda" />}
          {campos.length > 0 && (
            <Abas abas={[{ id: 'campos', rotulo: 'Campos' }, { id: 'json', rotulo: 'JSON' }]} atual={modo} onMudar={onModo} />
          )}
        </div>
      </div>
      {modo === 'campos' && campos.length > 0 ? (
        <div className="space-y-3">
          <div className="grid h-80 grid-cols-2 gap-3">
            <ListaCampos campos={campos} selecao={selecao} onSelecao={onSelecao} />
            <Valores campos={campos} selecao={selecao} valores={valores} onValores={onValores} />
          </div>
          {previa && <JsonColorido texto={previa} titulo="Body que será enviado" alturaMax="220px" />}
        </div>
      ) : (
        <textarea
          value={json}
          onChange={e => onJson(e.target.value)}
          spellCheck={false}
          placeholder={'{\n  "campo": "valor"\n}'}
          className="campo min-h-[220px] resize-y font-mono text-xs leading-relaxed"
        />
      )}
    </section>
  )
}
