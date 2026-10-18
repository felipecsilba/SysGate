import { useState } from 'react'
import Icone from '../../components/Icone'
import { CORES_JSON, caminhoFilho } from '../../lib/json'

const POR_VEZ = 200

function Primitivo({ valor }) {
  if (valor === null) return <span className={CORES_JSON.nulo}>null</span>
  if (typeof valor === 'string') return <span className={`${CORES_JSON.texto} break-all`}>"{valor}"</span>
  if (typeof valor === 'boolean') return <span className={CORES_JSON.booleano}>{String(valor)}</span>
  return <span className={CORES_JSON.numero}>{String(valor)}</span>
}

// Um nó da árvore. Clicar no nome copia o caminho ($.a[0].b).
function No({ nome, valor, caminho, nivel, onCopiar }) {
  const composto = valor !== null && typeof valor === 'object'
  const [aberto, setAberto] = useState(nivel < 2)
  const [limite, setLimite] = useState(POR_VEZ)

  const lista = Array.isArray(valor)
  const entradas = composto ? (lista ? valor.map((v, i) => [i, v]) : Object.entries(valor)) : []
  const resumo = lista ? `[${valor.length}]` : composto ? `{${entradas.length}}` : null

  return (
    <li>
      <div className="group flex items-start gap-1 rounded px-1 hover:bg-texto/[0.04]">
        <button
          type="button"
          onClick={() => composto && setAberto(a => !a)}
          className={`mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center text-suave ${composto ? '' : 'invisible'}`}
          aria-label={aberto ? 'Recolher' : 'Expandir'}
        >
          <Icone nome="baixo" className={`h-3 w-3 transition ${aberto ? '' : '-rotate-90'}`} />
        </button>
        {nome !== undefined && (
          <button type="button" onClick={() => onCopiar(caminho)} title={`Copiar caminho ${caminho}`}
            className={`shrink-0 hover:underline ${typeof nome === 'number' ? 'text-suave' : CORES_JSON.chave}`}>
            {typeof nome === 'number' ? nome : `"${nome}"`}
          </button>
        )}
        {nome !== undefined && <span className="text-suave">:</span>}
        {composto
          ? <button type="button" onClick={() => setAberto(a => !a)} className="text-suave">{resumo}</button>
          : <Primitivo valor={valor} />}
      </div>
      {composto && aberto && entradas.length > 0 && (
        <ul className="ml-[11px] border-l border-borda pl-2">
          {entradas.slice(0, limite).map(([k, v]) => (
            <No key={k} nome={k} valor={v} caminho={caminhoFilho(caminho, k)} nivel={nivel + 1} onCopiar={onCopiar} />
          ))}
          {entradas.length > limite && (
            <li>
              <button type="button" onClick={() => setLimite(l => l + POR_VEZ)} className="px-6 py-0.5 text-xs text-acento hover:underline">
                Mostrar mais {Math.min(POR_VEZ, entradas.length - limite)} de {entradas.length - limite} restantes
              </button>
            </li>
          )}
        </ul>
      )}
    </li>
  )
}

export default function Arvore({ valor, onCopiar }) {
  return (
    <ul className="p-3 font-mono text-[13px] leading-[1.6]">
      <No valor={valor} caminho="$" nivel={0} onCopiar={onCopiar} />
    </ul>
  )
}
