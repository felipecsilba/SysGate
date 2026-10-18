import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Busca from '../../components/Busca'
import Confirmar from '../../components/Confirmar'
import Icone from '../../components/Icone'
import Pagina from '../../components/Pagina'
import { mensagemErro, notasApi } from '../../lib/api'
import { filtrarNotas, previa, todasEtiquetas } from '../../lib/notas'
import { TIPOS, corPonto } from './constantes'
import EditorNota from './EditorNota'

// Notas: lista à esquerda (fixadas no topo) + editor à direita que salva sozinho.
// Local deste app — sem compartilhamento (só existe a conta local).
export default function Notas() {
  const [notas, setNotas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [selecionada, setSelecionada] = useState(null)
  const [excluir, setExcluir] = useState(null)
  const novaId = useRef(null) // nota recém-criada: o editor seleciona o título

  const carregar = useCallback(async () => {
    try {
      setNotas(await notasApi.listar())
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setCarregando(false)
    }
  }, [])
  useEffect(() => { carregar() }, [carregar])

  const visiveis = useMemo(() => filtrarNotas(notas, { busca, tipo, etiqueta }), [notas, busca, tipo, etiqueta])
  const fixadas = visiveis.filter(n => n.fixada)
  const outras = visiveis.filter(n => !n.fixada)
  const etiquetas = useMemo(() => todasEtiquetas(notas), [notas])
  const atual = notas.find(n => n.id === selecionada) ?? null

  // O editor avisa cada gravação: atualiza a nota na lista sem reordenar (não pula enquanto digita)
  const aoGravar = useCallback(nota => setNotas(lista => lista.map(n => (n.id === nota.id ? { ...n, ...nota } : n))), [])

  async function nova() {
    try {
      const criada = await notasApi.criar({ tipo: tipo || 'texto', etiquetas: etiqueta ? [etiqueta] : [] })
      novaId.current = criada.id
      setNotas(lista => [criada, ...lista])
      setBusca('')
      setSelecionada(criada.id)
    } catch (err) {
      setErro(mensagemErro(err))
    }
  }

  async function fixar(nota) {
    const r = await notasApi.fixar(nota.id)
    setNotas(lista => {
      const outra = lista.map(n => (n.id === nota.id ? { ...n, fixada: r.fixada } : n))
      return [...outra.filter(n => n.fixada), ...outra.filter(n => !n.fixada)]
    })
  }

  async function confirmarExclusao() {
    await notasApi.excluir(excluir.id)
    setNotas(lista => lista.filter(n => n.id !== excluir.id))
    if (selecionada === excluir.id) setSelecionada(null)
  }

  const filtrando = busca || tipo || etiqueta

  return (
    <Pagina
      titulo="Notas"
      icone="notas"
      acoes={
        <button type="button" className="botao bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700" onClick={nova}>
          <Icone nome="mais" className="h-4 w-4" /> Nova nota
        </button>
      }
    >
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-r border-borda">
          <div className="space-y-2 border-b border-borda p-3">
            <Busca valor={busca} onMudar={setBusca} placeholder="Buscar nas notas…" />
            <div className="flex items-center gap-1">
              <BotaoFiltro ativo={!tipo} onClick={() => setTipo('')}>Todas</BotaoFiltro>
              {TIPOS.map(t => (
                <BotaoFiltro key={t.id} ativo={tipo === t.id} onClick={() => setTipo(tipo === t.id ? '' : t.id)} titulo={t.rotulo}>
                  <Icone nome={t.icone} className="h-3.5 w-3.5" />
                </BotaoFiltro>
              ))}
            </div>
            {etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {etiquetas.map(et => (
                  <button
                    key={et}
                    type="button"
                    onClick={() => setEtiqueta(etiqueta === et ? '' : et)}
                    className={`rounded-md px-2 py-0.5 text-[11px] transition ${
                      etiqueta === et ? 'bg-texto text-fundo' : 'bg-texto/[0.06] text-suave hover:text-texto'
                    }`}
                  >
                    #{et}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {carregando ? (
              <p className="py-10 text-center text-sm text-suave">Carregando…</p>
            ) : !visiveis.length ? (
              <div className="px-4 py-10 text-center text-sm text-suave">
                {filtrando ? 'Nenhuma nota com esses filtros.' : 'Nenhuma nota ainda.'}
                {!filtrando && <button type="button" onClick={nova} className="mt-2 block w-full text-acento hover:underline">Criar a primeira</button>}
              </div>
            ) : (
              <>
                <Grupo titulo="Fixadas" notas={fixadas} selecionada={selecionada} onEscolher={setSelecionada} />
                <Grupo titulo={fixadas.length ? 'Outras' : null} notas={outras} selecionada={selecionada} onEscolher={setSelecionada} />
              </>
            )}
            {erro && <p className="px-2 py-2 text-xs text-perigo">{erro}</p>}
          </div>
        </aside>

        {atual ? (
          <EditorNota
            key={atual.id}
            nota={atual}
            focarTitulo={novaId.current === atual.id}
            onGravar={aoGravar}
            onFixar={() => fixar(atual)}
            onExcluir={() => setExcluir(atual)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-suave">
            {notas.length ? 'Escolha uma nota à esquerda.' : 'Crie uma nota em “Nova nota”.'}
          </div>
        )}
      </div>

      <Confirmar
        aberto={!!excluir}
        titulo="Excluir nota"
        mensagem={`“${excluir?.titulo || 'Sem título'}” será apagada de vez.`}
        onConfirmar={confirmarExclusao}
        onFechar={() => setExcluir(null)}
      />
    </Pagina>
  )
}

function BotaoFiltro({ ativo, onClick, titulo, children }) {
  return (
    <button
      type="button"
      title={titulo}
      onClick={onClick}
      className={`flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg px-2 text-xs transition ${
        ativo ? 'bg-texto/[0.08] font-medium text-texto' : 'text-suave hover:text-texto'
      }`}
    >
      {children}
    </button>
  )
}

function Grupo({ titulo, notas, selecionada, onEscolher }) {
  if (!notas.length) return null
  return (
    <section className="mb-3">
      {titulo && <h4 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-suave">{titulo}</h4>}
      <ul className="space-y-0.5">
        {notas.map(n => {
          const tipo = TIPOS.find(t => t.id === n.tipo)
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onEscolher(n.id)}
                className={`w-full rounded-lg px-2.5 py-2 text-left transition ${n.id === selecionada ? 'bg-texto/[0.07]' : 'hover:bg-texto/[0.04]'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: corPonto(n.cor) }} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{n.titulo || 'Sem título'}</span>
                  {n.fixada && <Icone nome="pin" className="h-3.5 w-3.5 shrink-0 text-suave" />}
                  {tipo && tipo.id !== 'texto' && <Icone nome={tipo.icone} className="h-3.5 w-3.5 shrink-0 text-suave" />}
                </div>
                <p className={`mt-0.5 truncate pl-4 text-xs text-suave ${n.tipo === 'codigo' ? 'font-mono' : ''}`}>{previa(n) || 'Vazia'}</p>
                {n.etiquetas.length > 0 && (
                  <p className="mt-1 truncate pl-4 text-[11px] text-suave/80">{n.etiquetas.map(e => `#${e}`).join(' ')}</p>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
