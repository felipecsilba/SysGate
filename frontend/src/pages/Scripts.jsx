import { useState, useEffect } from 'react'
import { scriptsApi, municipiosApi } from '../lib/api'

const CATEGORIAS = [
  { value: 'sql', label: 'SQL', icon: '🗄' },
  { value: 'comando', label: 'Comandos', icon: '💻' },
  { value: 'fonte', label: 'Fontes de Acesso', icon: '🔗' },
  { value: 'anotacao', label: 'Anotações', icon: '📝' },
]

const CAT_BADGE = {
  sql: 'badge-blue', comando: 'badge-green', fonte: 'badge-yellow', anotacao: 'badge-gray',
}

const VAZIO_FORM = { titulo: '', conteudo: '', categoria: 'sql', tags: '', municipioId: '' }

function CopiarBtn({ texto }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = () => {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }
  return (
    <button onClick={copiar} className="btn-ghost text-xs py-1 px-2" title="Copiar">
      {copiado ? '✅ Copiado' : '📋 Copiar'}
    </button>
  )
}

function ScriptCard({ script, onEditar, onDeletar }) {
  const [expandido, setExpandido] = useState(false)
  const cat = CATEGORIAS.find((c) => c.value === script.categoria)
  const isCodigo = ['sql', 'comando'].includes(script.categoria)

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpandido((v) => !v)}
      >
        <span className="text-xl flex-shrink-0 mt-0.5">{cat?.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-gray-900">{script.titulo}</h3>
            <span className={`badge text-xs ${CAT_BADGE[script.categoria] || 'badge-gray'}`}>
              {cat?.label}
            </span>
            {script.municipio && (
              <span className="badge badge-gray text-xs">{script.municipio.nome}</span>
            )}
          </div>
          {script.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {script.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <CopiarBtn texto={script.conteudo} />
          <button onClick={(e) => { e.stopPropagation(); onEditar(script) }} className="btn-ghost text-xs py-1 px-2">Editar</button>
          <button onClick={(e) => { e.stopPropagation(); onDeletar(script) }} className="btn-ghost text-xs py-1 px-2 text-red-600 hover:bg-red-50">Del</button>
          <span className="text-gray-400 text-xs ml-1">{expandido ? '▲' : '▼'}</span>
        </div>
      </div>

      {expandido && (
        <div className="border-t border-gray-100">
          {isCodigo ? (
            <pre className="bg-gray-900 text-gray-100 text-xs font-mono leading-relaxed p-4 overflow-auto scrollbar-thin max-h-80">
              {script.conteudo}
            </pre>
          ) : (
            <p className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap">{script.conteudo}</p>
          )}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            Criado em {new Date(script.criadoEm).toLocaleString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Scripts() {
  const [scripts, setScripts] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [todasTags, setTodasTags] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroTag, setFiltroTag] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(VAZIO_FORM)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => {
    setCarregando(true)
    try {
      const params = {}
      if (busca) params.busca = busca
      if (filtroCategoria) params.categoria = filtroCategoria
      if (filtroTag) params.tag = filtroTag
      const [data, muns, tags] = await Promise.all([
        scriptsApi.listar(params),
        municipiosApi.listar(),
        scriptsApi.tags(),
      ])
      setScripts(data)
      setMunicipios(muns)
      setTodasTags(tags)
    } catch (e) {
      console.error(e)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [busca, filtroCategoria, filtroTag])

  const abrirCriar = () => {
    setForm(VAZIO_FORM); setEditando(null); setErro(''); setModalAberto(true)
  }

  const abrirEditar = (script) => {
    setForm({
      titulo: script.titulo,
      conteudo: script.conteudo,
      categoria: script.categoria,
      tags: script.tags.join(', '),
      municipioId: script.municipio?.id ? String(script.municipio.id) : '',
    })
    setEditando(script)
    setErro('')
    setModalAberto(true)
  }

  const fecharModal = () => { setModalAberto(false); setEditando(null) }

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      const payload = {
        titulo: form.titulo,
        conteudo: form.conteudo,
        categoria: form.categoria,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        municipioId: form.municipioId ? Number(form.municipioId) : null,
      }
      if (editando) {
        await scriptsApi.atualizar(editando.id, payload)
      } else {
        await scriptsApi.criar(payload)
      }
      await carregar()
      fecharModal()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const deletar = async (script) => {
    if (!confirm(`Deletar "${script.titulo}"?`)) return
    try {
      await scriptsApi.deletar(script.id)
      await carregar()
    } catch (e) {
      alert('Erro: ' + e.message)
    }
  }

  const exportarJSON = () => {
    const dados = scripts.map(({ titulo, conteudo, categoria, tags }) => ({ titulo, conteudo, categoria, tags }))
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `scripts-${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const importarJSON = async (file) => {
    try {
      const texto = await file.text()
      const dados = JSON.parse(texto)
      const res = await scriptsApi.importar(dados)
      alert(`✅ ${res.importados} script(s) importado(s)`)
      carregar()
    } catch (e) {
      alert('Erro ao importar: ' + e.message)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scripts & Ferramentas</h1>
          <p className="text-sm text-gray-500 mt-1">SQL, comandos, fontes de acesso e anotações</p>
        </div>
        <div className="flex gap-2">
          <label className="btn-secondary cursor-pointer">
            ⬆ Importar JSON
            <input type="file" accept=".json" className="hidden" onChange={(e) => importarJSON(e.target.files[0])} />
          </label>
          <button onClick={exportarJSON} className="btn-secondary">⬇ Exportar</button>
          <button onClick={abrirCriar} className="btn-primary">+ Novo</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Buscar por título ou conteúdo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="input w-64"
        />
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="input w-44">
          <option value="">Todas categorias</option>
          {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>
        <select value={filtroTag} onChange={(e) => setFiltroTag(e.target.value)} className="input w-36">
          <option value="">Todas as tags</option>
          {todasTags.map((t) => <option key={t.id} value={t.nome}>#{t.nome}</option>)}
        </select>
        {(busca || filtroCategoria || filtroTag) && (
          <button
            onClick={() => { setBusca(''); setFiltroCategoria(''); setFiltroTag('') }}
            className="btn-ghost text-xs"
          >
            ✕ Limpar filtros
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {scripts.length} script{scripts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabs por categoria */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIAS.map((cat) => {
          const count = scripts.filter((s) => s.categoria === cat.value).length
          return (
            <button
              key={cat.value}
              onClick={() => setFiltroCategoria(filtroCategoria === cat.value ? '' : cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtroCategoria === cat.value
                  ? 'bg-sysgate-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.icon} {cat.label}
              <span className={`text-xs rounded-full px-1.5 ${filtroCategoria === cat.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista de scripts */}
      {carregando ? (
        <div className="py-8 text-center text-sm text-gray-400">Carregando...</div>
      ) : scripts.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm">Nenhum script encontrado.</p>
          <button onClick={abrirCriar} className="btn-primary mt-3 mx-auto">Criar o primeiro</button>
        </div>
      ) : (
        <div className="space-y-3">
          {scripts.map((s) => (
            <ScriptCard key={s.id} script={s} onEditar={abrirEditar} onDeletar={deletar} />
          ))}
        </div>
      )}

      {/* Modal de criação/edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {editando ? 'Editar script' : 'Novo script'}
              </h2>
            </div>
            <form onSubmit={salvar} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Título <span className="text-red-500">*</span></label>
                  <input
                    value={form.titulo}
                    onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                    className="input"
                    placeholder="Nome descritivo do script"
                    required
                  />
                </div>
                <div>
                  <label className="label">Categoria <span className="text-red-500">*</span></label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                    className="input"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Município associado</label>
                  <select
                    value={form.municipioId}
                    onChange={(e) => setForm((f) => ({ ...f, municipioId: e.target.value }))}
                    className="input"
                  >
                    <option value="">Nenhum (global)</option>
                    {municipios.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  Conteúdo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.conteudo}
                  onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
                  className={`w-full min-h-48 rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-sysgate-500 ${
                    ['sql', 'comando'].includes(form.categoria)
                      ? 'font-mono bg-gray-900 text-gray-100 border-gray-700'
                      : 'border border-gray-300'
                  }`}
                  placeholder={
                    form.categoria === 'sql' ? 'SELECT * FROM ...' :
                    form.categoria === 'comando' ? 'npm run ...' :
                    form.categoria === 'fonte' ? 'https://...' :
                    'Anotação...'
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Tags <span className="text-xs text-gray-400">(separadas por vírgula)</span></label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="input"
                  placeholder="manutenção, ISS, migração"
                />
                {todasTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {todasTags.slice(0, 12).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          const atual = form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : []
                          if (!atual.includes(t.nome)) {
                            setForm((f) => ({ ...f, tags: [...atual, t.nome].join(', ') }))
                          }
                        }}
                        className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-sysgate-100 hover:text-sysgate-700"
                      >
                        #{t.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{erro}</div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={salvando}>
                  {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar script'}
                </button>
                <button type="button" onClick={fecharModal} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
