import { useState } from 'react'
import BotaoIcone from '../../components/BotaoIcone'
import { highlightCode } from '../../lib/codigo'
import { parseConteudo } from '../../lib/conhecimento'
import { tempoRelativo, tipoDe } from './constantes'

// Bloco de código: sempre escuro (como no editor), com copiar
function Codigo({ valor }) {
  const [ok, setOk] = useState(false)
  return (
    <div className="group relative overflow-hidden rounded-xl border border-black/20 bg-[#1e1e1e]">
      <div className="absolute right-1.5 top-1.5 opacity-0 transition group-hover:opacity-100">
        <BotaoIcone
          titulo={ok ? 'Copiado!' : 'Copiar'}
          icone={ok ? 'check' : 'copiar'}
          ativo={ok}
          className="h-7 w-7 bg-[#2d2d2d] !text-[#d4d4d4] hover:!bg-[#3a3a3a]"
          onClick={() => navigator.clipboard.writeText(valor).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) })}
        />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-[13px] leading-relaxed text-[#d4d4d4]" dangerouslySetInnerHTML={{ __html: highlightCode(valor) }} />
    </div>
  )
}

export function Blocos({ conteudo }) {
  return (
    <div className="space-y-3">
      {parseConteudo(conteudo).map((b, i) => {
        if (b.tipo === 'codigo') return <Codigo key={i} valor={b.valor} />
        if (b.tipo === 'subtitulo') return <h4 key={i} className="pt-1 text-sm font-semibold">{b.valor}</h4>
        if (b.tipo === 'nota') return <p key={i} className="border-l-2 border-texto/20 pl-3 text-sm italic text-suave">{b.valor}</p>
        return b.valor ? <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed">{b.valor}</p> : null
      })}
    </div>
  )
}

export default function Leitura({ artigo, podeEditar, podeExcluir, onEditar, onExcluir }) {
  const tipo = tipoDe(artigo.tipo)
  const vazio = artigo.tipo === 'passo-a-passo' ? !artigo.passos.length : !artigo.conteudo || artigo.conteudo === '[]'

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-borda px-6 py-2.5 text-xs text-suave">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tipo.cor }} />
        <span className="font-medium text-texto">{tipo.rotulo}</span>
        {artigo.vertical && <><span>·</span><span>{artigo.vertical}</span></>}
        {artigo.sistema && <><span>·</span><span>{artigo.sistema}</span></>}
        <div className="flex-1" />
        {podeEditar && <BotaoIcone titulo="Editar" icone="editar" onClick={onEditar} />}
        {podeExcluir && <BotaoIcone titulo="Excluir" icone="lixeira" perigo onClick={onExcluir} />}
      </div>

      <article className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-7">
          <h1 className="text-xl font-semibold leading-snug">{artigo.titulo}</h1>
          <p className="mt-1.5 text-xs text-suave">
            {artigo.autor?.nome ?? 'Você'} · {tempoRelativo(artigo.criadoEm)}
            {artigo.atualizadoEm && new Date(artigo.atualizadoEm) - new Date(artigo.criadoEm) > 60000 && ` · editado ${tempoRelativo(artigo.atualizadoEm)}`}
          </p>
          {artigo.descricao && <p className="mt-4 text-[15px] leading-relaxed text-suave">{artigo.descricao}</p>}

          <div className="mt-6">
            {vazio ? (
              <p className="text-sm text-suave">Sem conteúdo.</p>
            ) : artigo.tipo === 'passo-a-passo' ? (
              <ol className="space-y-5">
                {artigo.passos.map((p, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-texto/[0.08] text-xs font-semibold tabular-nums">{i + 1}</span>
                    <div className="min-w-0 flex-1 pt-0.5"><Blocos conteudo={p.texto} /></div>
                  </li>
                ))}
              </ol>
            ) : (
              <Blocos conteudo={artigo.conteudo} />
            )}
          </div>

          {artigo.etiquetas?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-1.5 border-t border-borda pt-4">
              {artigo.etiquetas.map(e => <span key={e} className="rounded-md bg-texto/[0.06] px-2 py-0.5 text-xs">#{e}</span>)}
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
