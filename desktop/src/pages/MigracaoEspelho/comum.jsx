import { useMemo, useState } from 'react'
import Icone from '../../components/Icone'
import { Codigo } from '../Biblioteca/Visualizador'
import { montarScriptBackup } from '../../lib/espelho'

const COR = { ok: 'text-emerald-600 dark:text-emerald-400', erro: 'text-perigo', fila: 'text-sky-600 dark:text-sky-400' }

// Status de um registro no envio por lote ({ ok, mensagem, fila })
export function Situacao({ s }) {
  if (!s) return <span className="text-suave">—</span>
  if (s.ok) return <span className={COR.ok}>Sucesso</span>
  if (s.fila) return <span className={COR.fila}>{s.mensagem}</span>
  return <span className={COR.erro} title={s.mensagem}>{s.mensagem}</span>
}

// "." final em destaque: é o que o estímulo e o ajuste acrescentam
export function ComPonto({ texto }) {
  if (!texto.endsWith('.')) return texto
  return <>{texto.slice(0, -1)}<strong className="text-acento">.</strong></>
}

export function Aviso({ children }) {
  return (
    <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-700 dark:text-amber-300">
      <Icone nome="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

// Script de exportação pronto (CSV, uma coluna por campo) — usado no Backup dos cadastros e nos Ajustes rápidos
export function ScriptPronto({ cadastro, titulo, children }) {
  const script = useMemo(() => montarScriptBackup(cadastro), [cadastro])
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(script)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold">{titulo}</h3>
          <div className="mt-1 text-[13px] text-suave">{children}</div>
        </div>
        <button onClick={copiar} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-borda px-3 py-1.5 text-sm hover:bg-texto/[0.05]">
          <Icone nome={copiado ? 'check' : 'copiar'} className="h-4 w-4" />
          {copiado ? 'Copiado' : 'Copiar script'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {cadastro.campos.map(c => (
          <span key={c.nome} title={c.descricao} className="rounded-md border border-borda px-2 py-0.5 font-mono text-[12px]">
            {c.nome}{c.enum && <span className="text-suave"> · enum</span>}
          </span>
        ))}
      </div>

      <Codigo texto={script} nome="script.txt" />
    </div>
  )
}
