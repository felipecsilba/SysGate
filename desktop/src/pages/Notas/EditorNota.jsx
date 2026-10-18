import { useEffect, useRef, useState } from 'react'
import BotaoIcone from '../../components/BotaoIcone'
import Icone from '../../components/Icone'
import { notasApi } from '../../lib/api'
import { converterTipo, normalizarEtiqueta } from '../../lib/notas'
import { CORES, TIPOS, corPonto } from './constantes'

const ESPERA = 700 // ms sem digitar até gravar

// Editor de uma nota. Grava sozinho (debounce) e, ao trocar de nota/sair, grava o que faltou.
export default function EditorNota({ nota, focarTitulo, onGravar, onFixar, onExcluir }) {
  const [r, setR] = useState(() => ({
    titulo: nota.titulo, tipo: nota.tipo, conteudo: nota.conteudo, itens: nota.itens, cor: nota.cor, etiquetas: nota.etiquetas,
  }))
  const [estado, setEstado] = useState('salvo') // salvo | pendente | salvando | erro
  const pendente = useRef(null)
  const timer = useRef(null)
  const titulo = useRef(null)

  async function gravar() {
    clearTimeout(timer.current)
    const dados = pendente.current
    if (!dados) return
    pendente.current = null
    setEstado('salvando')
    try {
      onGravar(await notasApi.atualizar(nota.id, dados))
      setEstado(e => (e === 'salvando' ? 'salvo' : e))
    } catch {
      pendente.current = { ...dados, ...pendente.current }
      setEstado('erro')
    }
  }

  function mudar(campos) {
    setR(atual => {
      const novo = { ...atual, ...campos }
      pendente.current = novo
      return novo
    })
    setEstado('pendente')
    clearTimeout(timer.current)
    timer.current = setTimeout(gravar, ESPERA)
  }

  // Sair da nota (trocar ou fechar o módulo) grava na hora o que estava pendente
  useEffect(() => () => { gravar() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (focarTitulo) titulo.current?.select() }, [focarTitulo])

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-1 border-b border-borda px-4 py-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-texto/[0.05] p-0.5">
          {TIPOS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => mudar(converterTipo(r, t.id))}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs transition ${
                r.tipo === t.id ? 'bg-fundo font-medium text-texto shadow-sm' : 'text-suave hover:text-texto'
              }`}
            >
              <Icone nome={t.icone} className="h-3.5 w-3.5" /> {t.rotulo}
            </button>
          ))}
        </div>
        <div className="ml-3 flex items-center gap-1">
          {CORES.map(c => (
            <button
              key={c.hex}
              type="button"
              title={c.nome}
              onClick={() => mudar({ cor: c.hex })}
              className={`flex h-5 w-5 items-center justify-center rounded-full transition ${r.cor?.toUpperCase() === c.hex ? 'ring-2 ring-texto/40' : 'hover:ring-2 hover:ring-texto/15'}`}
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: corPonto(c.hex) }} />
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className={`mr-2 text-[11px] ${estado === 'erro' ? 'text-perigo' : 'text-suave'}`}>
          {{ salvo: 'Salvo', pendente: 'Editando…', salvando: 'Salvando…', erro: 'Não salvou — tente de novo' }[estado]}
        </span>
        <BotaoIcone titulo={nota.fixada ? 'Desafixar' : 'Fixar no topo'} icone="pin" ativo={nota.fixada} onClick={onFixar} />
        <BotaoIcone titulo="Excluir" icone="lixeira" perigo onClick={onExcluir} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <input
          ref={titulo}
          value={r.titulo}
          onChange={e => mudar({ titulo: e.target.value })}
          placeholder="Título"
          className="mb-4 w-full bg-transparent text-xl font-semibold outline-none placeholder:text-suave/60"
        />

        {r.tipo === 'texto' && (
          <textarea
            value={r.conteudo}
            onChange={e => mudar({ conteudo: e.target.value })}
            placeholder="Escreva…"
            className="min-h-[50vh] w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-suave/60"
          />
        )}
        {r.tipo === 'codigo' && (
          <textarea
            value={r.conteudo}
            onChange={e => mudar({ conteudo: e.target.value })}
            onKeyDown={e => {
              if (e.key !== 'Tab') return
              e.preventDefault()
              const { selectionStart: i, selectionEnd: f, value } = e.target
              mudar({ conteudo: value.slice(0, i) + '  ' + value.slice(f) })
              requestAnimationFrame(() => e.target.setSelectionRange(i + 2, i + 2))
            }}
            spellCheck={false}
            placeholder="// código"
            className="min-h-[50vh] w-full resize-y rounded-xl border border-borda bg-texto/[0.03] p-4 font-mono text-xs leading-relaxed outline-none focus:border-acento"
          />
        )}
        {(r.tipo === 'checklist' || r.tipo === 'lista') && (
          <Itens tipo={r.tipo} itens={r.itens} onMudar={itens => mudar({ itens })} />
        )}

        <Etiquetas etiquetas={r.etiquetas} onMudar={etiquetas => mudar({ etiquetas })} />
      </div>
    </div>
  )
}

// Itens de checklist/lista: Enter cria o próximo logo abaixo; Backspace num item vazio apaga e volta
function Itens({ tipo, itens, onMudar }) {
  const refs = useRef([])
  const [foco, setFoco] = useState(null)
  useEffect(() => { if (foco != null) { refs.current[foco]?.focus(); setFoco(null) } }, [foco])

  const alterar = (i, campos) => onMudar(itens.map((it, j) => (j === i ? { ...it, ...campos } : it)))
  const inserir = i => { onMudar([...itens.slice(0, i + 1), { texto: '', feito: false }, ...itens.slice(i + 1)]); setFoco(i + 1) }
  const remover = i => { onMudar(itens.filter((_, j) => j !== i)); setFoco(Math.max(0, i - 1)) }
  const feitos = itens.filter(i => i.feito).length

  return (
    <div className="space-y-0.5">
      {tipo === 'checklist' && itens.length > 0 && <p className="mb-2 text-xs text-suave">{feitos} de {itens.length} feitos</p>}
      {itens.map((it, i) => (
        <div key={i} className="group flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-texto/[0.03]">
          {tipo === 'checklist' ? (
            <button
              type="button"
              onClick={() => alterar(i, { feito: !it.feito })}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${it.feito ? 'border-acento bg-acento text-white' : 'border-texto/30 hover:border-acento'}`}
            >
              {it.feito && <Icone nome="check" className="h-3 w-3" strokeWidth={3} />}
            </button>
          ) : (
            <span className="w-4 shrink-0 text-center text-suave">•</span>
          )}
          <input
            ref={el => { refs.current[i] = el }}
            value={it.texto}
            onChange={e => alterar(i, { texto: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); inserir(i) }
              if (e.key === 'Backspace' && !it.texto) { e.preventDefault(); remover(i) }
            }}
            className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${it.feito ? 'text-suave line-through' : ''}`}
          />
          <button type="button" onClick={() => remover(i)} className="text-suave opacity-0 transition hover:text-perigo group-hover:opacity-100" title="Remover">
            <Icone nome="fechar" className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => inserir(itens.length - 1)} className="flex items-center gap-2.5 px-1 py-1 text-sm text-suave hover:text-texto">
        <Icone nome="mais" className="h-4 w-4" /> Adicionar item
      </button>
    </div>
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
    <div className="mt-8 flex flex-wrap items-center gap-1.5 border-t border-borda pt-4">
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
