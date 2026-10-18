import { useState } from 'react'
import CaixaBusca from '../../components/CaixaBusca'
import Icone from '../../components/Icone'
import { mensagemErro } from '../../lib/api'
import { formDoArtigo, montarArtigo, trocarTipo } from '../../lib/conhecimento'
import { normalizarEtiqueta } from '../../lib/notas'
import { BLOCOS, TIPOS } from './constantes'

// Edição no próprio painel (sem modal): criar ou editar um artigo. Salvar grava; Cancelar descarta.
export default function Editor({ artigo, catalogo, onSalvar, onCancelar }) {
  const [f, setF] = useState(() => formDoArtigo(artigo))
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const mudar = campos => setF(atual => ({ ...atual, ...campos }))

  const sistemas = f.vertical ? catalogo.find(v => v.nome === f.vertical)?.sistemas ?? [] : catalogo.flatMap(v => v.sistemas)

  async function salvar() {
    if (!f.titulo.trim()) return setErro('Dê um título ao artigo.')
    setSalvando(true)
    setErro('')
    try {
      await onSalvar(montarArtigo(f))
    } catch (err) {
      setErro(mensagemErro(err))
      setSalvando(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-borda px-6 py-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-texto/[0.05] p-0.5">
          {TIPOS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setF(atual => trocarTipo(atual, t.id))}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition ${
                f.tipo === t.id ? 'bg-fundo font-medium text-texto shadow-sm' : 'text-suave hover:text-texto'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.cor }} /> {t.rotulo}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {erro && <span className="text-xs text-perigo">{erro}</span>}
        <button type="button" className="botao-secundario px-3 py-1.5" onClick={onCancelar} disabled={salvando}>Cancelar</button>
        <button type="button" className="botao bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : artigo ? 'Salvar' : 'Criar artigo'}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-5 px-8 py-7">
          <input
            value={f.titulo}
            onChange={e => mudar({ titulo: e.target.value })}
            placeholder="Título do artigo"
            autoFocus={!artigo}
            className="w-full bg-transparent text-xl font-semibold outline-none placeholder:text-suave/60"
          />
          <textarea
            value={f.descricao}
            onChange={e => mudar({ descricao: e.target.value })}
            placeholder="Resumo em uma ou duas linhas (opcional)"
            rows={2}
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-suave outline-none placeholder:text-suave/60"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="rotulo">Vertical</span>
              <CaixaBusca
                opcoes={[{ valor: '', rotulo: '— nenhuma —' }, ...catalogo.map(v => ({ valor: v.nome, rotulo: v.nome }))]}
                valor={f.vertical}
                onEscolher={v => mudar({ vertical: v, sistema: v && f.sistema && !(catalogo.find(c => c.nome === v)?.sistemas ?? []).includes(f.sistema) ? '' : f.sistema })}
                buscavel={false}
              />
            </div>
            <div>
              <span className="rotulo">Sistema</span>
              <CaixaBusca
                opcoes={[{ valor: '', rotulo: '— nenhum —' }, ...sistemas.map(s => ({ valor: s, rotulo: s }))]}
                valor={f.sistema}
                onEscolher={v => mudar({ sistema: v })}
                placeholder="— nenhum —"
              />
            </div>
          </div>

          <div className="border-t border-borda pt-5">
            {f.tipo === 'passo-a-passo' ? (
              <ol className="space-y-5">
                {f.passos.map((p, i) => (
                  <li key={i} className="group/passo flex gap-4">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-texto/[0.08] text-xs font-semibold tabular-nums">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <ListaBlocos blocos={p.blocos} onMudar={blocos => mudar({ passos: f.passos.map((x, j) => (j === i ? { blocos } : x)) })} />
                    </div>
                    {f.passos.length > 1 && (
                      <button type="button" title="Remover passo" onClick={() => mudar({ passos: f.passos.filter((_, j) => j !== i) })} className="mt-1 h-6 text-suave opacity-0 transition hover:text-perigo group-hover/passo:opacity-100">
                        <Icone nome="lixeira" className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => mudar({ passos: [...f.passos, { blocos: [{ tipo: 'texto', valor: '' }] }] })} className="flex items-center gap-2 text-sm text-suave hover:text-texto">
                    <Icone nome="mais" className="h-4 w-4" /> Adicionar passo
                  </button>
                </li>
              </ol>
            ) : (
              <ListaBlocos blocos={f.blocos} onMudar={blocos => mudar({ blocos })} />
            )}
          </div>

          <Etiquetas etiquetas={f.etiquetas} onMudar={etiquetas => mudar({ etiquetas })} />
        </div>
      </div>
    </div>
  )
}

const linhas = v => (v.match(/\n/g) || []).length + 1

function ListaBlocos({ blocos, onMudar }) {
  const alterar = (i, valor) => onMudar(blocos.map((b, j) => (j === i ? { ...b, valor } : b)))
  const mover = (i, d) => { const n = [...blocos]; [n[i], n[i + d]] = [n[i + d], n[i]]; onMudar(n) }
  const remover = i => onMudar(blocos.length > 1 ? blocos.filter((_, j) => j !== i) : [{ tipo: 'texto', valor: '' }])

  return (
    <div className="space-y-2">
      {blocos.map((b, i) => (
        <div key={i} className="group relative">
          {b.tipo === 'codigo' ? (
            <textarea
              value={b.valor}
              onChange={e => alterar(i, e.target.value)}
              rows={Math.max(2, linhas(b.valor))}
              spellCheck={false}
              placeholder="código, endpoint, payload…"
              className="w-full resize-none rounded-xl border border-black/20 bg-[#1e1e1e] px-4 py-3 font-mono text-[13px] leading-relaxed text-[#d4d4d4] caret-[#d4d4d4] outline-none placeholder:text-[#d4d4d4]/40"
            />
          ) : b.tipo === 'subtitulo' ? (
            <input value={b.valor} onChange={e => alterar(i, e.target.value)} placeholder="Subtítulo" className="w-full bg-transparent py-1 text-sm font-semibold outline-none placeholder:text-suave/60" />
          ) : b.tipo === 'nota' ? (
            <textarea value={b.valor} onChange={e => alterar(i, e.target.value)} rows={Math.max(1, linhas(b.valor))} placeholder="Observação" className="w-full resize-none border-l-2 border-texto/20 bg-transparent pl-3 text-sm italic text-suave outline-none placeholder:text-suave/60" />
          ) : (
            <textarea value={b.valor} onChange={e => alterar(i, e.target.value)} rows={Math.max(2, linhas(b.valor))} placeholder="Escreva…" className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-suave/60" />
          )}
          <div className="absolute -right-2 top-0 hidden translate-x-full flex-col gap-0.5 group-hover:flex">
            {i > 0 && <AcaoBloco titulo="Subir" icone="cima" onClick={() => mover(i, -1)} />}
            {i < blocos.length - 1 && <AcaoBloco titulo="Descer" icone="baixo" onClick={() => mover(i, 1)} />}
            <AcaoBloco titulo="Remover bloco" icone="fechar" perigo onClick={() => remover(i)} />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-1 pt-1">
        <span className="mr-1 text-xs text-suave">Adicionar:</span>
        {BLOCOS.map(t => (
          <button key={t.tipo} type="button" onClick={() => onMudar([...blocos, { tipo: t.tipo, valor: '' }])} className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs text-suave transition hover:bg-texto/[0.06] hover:text-texto">
            <Icone nome={t.icone} className="h-3.5 w-3.5" /> {t.rotulo}
          </button>
        ))}
      </div>
    </div>
  )
}

function AcaoBloco({ titulo, icone, onClick, perigo }) {
  return (
    <button type="button" title={titulo} onClick={onClick} className={`flex h-6 w-6 items-center justify-center rounded-md text-suave ${perigo ? 'hover:bg-perigo/10 hover:text-perigo' : 'hover:bg-texto/[0.08] hover:text-texto'}`}>
      <Icone nome={icone} className="h-3.5 w-3.5" />
    </button>
  )
}

function Etiquetas({ etiquetas, onMudar }) {
  const [texto, setTexto] = useState('')
  const adicionar = () => {
    const et = normalizarEtiqueta(texto)
    if (et && !etiquetas.includes(et)) onMudar([...etiquetas, et])
    setTexto('')
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-borda pt-4">
      {etiquetas.map(et => (
        <span key={et} className="inline-flex items-center gap-1 rounded-md bg-texto/[0.06] px-2 py-0.5 text-xs">
          #{et}
          <button type="button" onClick={() => onMudar(etiquetas.filter(e => e !== et))} className="text-suave hover:text-texto">
            <Icone nome="fechar" className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={texto}
        onChange={e => setTexto(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); adicionar() } }}
        onBlur={adicionar}
        placeholder="+ etiqueta"
        className="w-28 bg-transparent text-xs outline-none placeholder:text-suave/70"
      />
    </div>
  )
}
