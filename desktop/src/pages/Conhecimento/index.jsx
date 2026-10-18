import { useCallback, useEffect, useMemo, useState } from 'react'
import Busca from '../../components/Busca'
import CaixaBusca from '../../components/CaixaBusca'
import Confirmar from '../../components/Confirmar'
import Icone from '../../components/Icone'
import Pagina from '../../components/Pagina'
import { catalogoApi, conhecimentoApi, mensagemErro } from '../../lib/api'
import { filtrarArtigos } from '../../lib/conhecimento'
import { useAuthStore } from '../../stores/authStore'
import { TIPOS, tempoRelativo, tipoDe } from './constantes'
import Editor from './Editor'
import Leitura from './Leitura'

// Base de conhecimento: lista à esquerda, leitura à direita; editar/criar acontece no mesmo painel.
export default function Conhecimento() {
  const usuario = useAuthStore(s => s.usuario)
  const [artigos, setArtigos] = useState([])
  const [catalogo, setCatalogo] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('')
  const [vertical, setVertical] = useState('')
  const [sistema, setSistema] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [editando, setEditando] = useState(null) // null | 'novo' | id
  const [excluir, setExcluir] = useState(null)

  const carregar = useCallback(async () => {
    try {
      setArtigos(await conhecimentoApi.listar())
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setCarregando(false)
    }
  }, [])
  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { catalogoApi.listar().then(setCatalogo).catch(() => {}) }, [])

  const visiveis = useMemo(() => filtrarArtigos(artigos, { busca, tipo, vertical, sistema }), [artigos, busca, tipo, vertical, sistema])
  const atual = artigos.find(a => a.id === selecionado) ?? null
  const sistemasFiltro = vertical ? catalogo.find(v => v.nome === vertical)?.sistemas ?? [] : catalogo.flatMap(v => v.sistemas)
  const ehAdmin = usuario?.role === 'admin'
  const podeEditar = a => ehAdmin || a.autorId === usuario?.id
  const filtrando = busca || tipo || vertical || sistema

  async function salvar(dados) {
    const salvo = editando === 'novo' ? await conhecimentoApi.criar(dados) : await conhecimentoApi.atualizar(editando, dados)
    await carregar()
    setSelecionado(salvo.id)
    setEditando(null)
  }

  async function confirmarExclusao() {
    await conhecimentoApi.excluir(excluir.id)
    setArtigos(lista => lista.filter(a => a.id !== excluir.id))
    if (selecionado === excluir.id) setSelecionado(null)
  }

  function limparFiltros() {
    setBusca(''); setTipo(''); setVertical(''); setSistema('')
  }

  return (
    <Pagina
      titulo="Conhecimento"
      icone="conhecimento"
      acoes={
        <button type="button" className="botao bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700" onClick={() => setEditando('novo')} disabled={!!editando}>
          <Icone nome="mais" className="h-4 w-4" /> Novo artigo
        </button>
      }
    >
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-r border-borda">
          <div className="space-y-2 border-b border-borda p-3">
            <Busca valor={busca} onMudar={setBusca} placeholder="Buscar, até dentro do código…" />
            <div className="flex flex-wrap items-center gap-1">
              <Filtro ativo={!tipo} onClick={() => setTipo('')}>Todos</Filtro>
              {TIPOS.map(t => (
                <Filtro key={t.id} ativo={tipo === t.id} onClick={() => setTipo(tipo === t.id ? '' : t.id)}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.cor }} /> {t.rotulo}
                </Filtro>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CaixaBusca
                compacta
                buscavel={false}
                opcoes={[{ valor: '', rotulo: 'Toda vertical' }, ...catalogo.map(v => ({ valor: v.nome, rotulo: v.nome }))]}
                valor={vertical}
                onEscolher={v => { setVertical(v); setSistema('') }}
              />
              <CaixaBusca
                compacta
                opcoes={[{ valor: '', rotulo: 'Todo sistema' }, ...sistemasFiltro.map(s => ({ valor: s, rotulo: s }))]}
                valor={sistema}
                onEscolher={setSistema}
                placeholder="Todo sistema"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {carregando ? (
              <p className="py-10 text-center text-sm text-suave">Carregando…</p>
            ) : !visiveis.length ? (
              <div className="px-4 py-10 text-center text-sm text-suave">
                {filtrando ? <>Nada com esses filtros.<button type="button" onClick={limparFiltros} className="mt-2 block w-full text-acento hover:underline">Limpar filtros</button></> : 'Nenhum artigo ainda.'}
              </div>
            ) : (
              <ul className="space-y-0.5">
                {visiveis.map(a => {
                  const t = tipoDe(a.tipo)
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => { setSelecionado(a.id); setEditando(null) }}
                        className={`w-full rounded-lg px-2.5 py-2 text-left transition ${a.id === selecionado ? 'bg-texto/[0.07]' : 'hover:bg-texto/[0.04]'}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: t.cor }} title={t.rotulo} />
                          <span className="line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-snug">{a.titulo}</span>
                        </div>
                        <p className="mt-0.5 truncate pl-4 text-[11px] text-suave">
                          {[a.sistema || a.vertical, tempoRelativo(a.atualizadoEm || a.criadoEm)].filter(Boolean).join(' · ')}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {erro && <p className="px-2 py-2 text-xs text-perigo">{erro}</p>}
          </div>
          {!carregando && artigos.length > 0 && (
            <p className="border-t border-borda px-4 py-2 text-[11px] text-suave">{visiveis.length} de {artigos.length} artigos</p>
          )}
        </aside>

        {editando ? (
          <Editor
            key={editando}
            artigo={editando === 'novo' ? null : atual}
            catalogo={catalogo}
            onSalvar={salvar}
            onCancelar={() => setEditando(null)}
          />
        ) : atual ? (
          <Leitura
            artigo={atual}
            podeEditar={podeEditar(atual)}
            podeExcluir={ehAdmin}
            onEditar={() => setEditando(atual.id)}
            onExcluir={() => setExcluir(atual)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-suave">
            {artigos.length ? 'Escolha um artigo à esquerda.' : 'Crie o primeiro artigo — ou traga os do Krakion web em Configurações → Importar dados.'}
          </div>
        )}
      </div>

      <Confirmar
        aberto={!!excluir}
        titulo="Excluir artigo"
        mensagem={`“${excluir?.titulo}” será apagado de vez.`}
        onConfirmar={confirmarExclusao}
        onFechar={() => setExcluir(null)}
      />
    </Pagina>
  )
}

function Filtro({ ativo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs transition ${ativo ? 'bg-texto/[0.08] font-medium text-texto' : 'text-suave hover:text-texto'}`}
    >
      {children}
    </button>
  )
}
