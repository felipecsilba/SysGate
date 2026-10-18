import { useMemo, useState } from 'react'
import Icone from './Icone'
import { colorirJson } from '../lib/json'

// Bloco sempre escuro: cores fixas para fundo escuro
const CORES_ESCURO = { chave: 'text-sky-300', texto: 'text-emerald-300', numero: 'text-amber-200', booleano: 'text-fuchsia-300', nulo: 'italic text-slate-400' }
const colorir = texto => colorirJson(texto, CORES_ESCURO)

// Bloco de código escuro (estilo editor) com JSON colorido e botão copiar
export default function JsonColorido({ dados, texto, titulo = 'JSON', alturaMax = '60vh' }) {
  const [copiado, setCopiado] = useState(false)
  const conteudo = useMemo(() => texto ?? (typeof dados === 'string' ? dados : JSON.stringify(dados, null, 2)), [dados, texto])
  const html = useMemo(() => colorir(conteudo ?? ''), [conteudo])

  async function copiar() {
    await navigator.clipboard.writeText(conteudo ?? '')
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#16181d]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[11px] text-slate-400">{titulo}</span>
        <button type="button" onClick={copiar} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-white/10 hover:text-slate-200">
          <Icone nome={copiado ? 'check' : 'copiar'} className="h-3 w-3" /> {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="overflow-auto p-3 font-mono text-xs leading-relaxed text-slate-200" style={{ maxHeight: alturaMax }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
