import { useMemo, useState } from 'react'
import Icone from './Icone'

// Escapa o HTML ANTES de colorir: a resposta vem de uma API externa e não pode virar marcação na tela.
function colorir(texto) {
  const seguro = texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return seguro.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    trecho => {
      if (trecho.startsWith('"')) return trecho.endsWith(':') ? `<span class="text-sky-300">${trecho}</span>` : `<span class="text-emerald-300">${trecho}</span>`
      if (trecho === 'true' || trecho === 'false') return `<span class="text-fuchsia-300">${trecho}</span>`
      if (trecho === 'null') return `<span class="italic text-slate-400">${trecho}</span>`
      return `<span class="text-amber-200">${trecho}</span>`
    }
  )
}

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
