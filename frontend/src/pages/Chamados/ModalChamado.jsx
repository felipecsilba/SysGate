import { useState, useEffect, useRef } from 'react'
import { chamadosApi, portfolioApi, solicitantesApi } from '../../lib/api'
import { confirmClose, isFormDirty } from '../../lib/formGuard'
import SearchSelect from '../../components/SearchSelect'
import {
  STATUS_OPTS,
  CLASSIF_OPTS,
  PRIORIDADE_OPTS,
} from './constants'

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function iconeAnexo(tipo) {
  if (!tipo) return '📎'
  if (tipo.startsWith('image/')) return '🖼️'
  if (tipo === 'application/pdf') return '📄'
  return '📎'
}

export default function ModalChamado({ chamado, usuarios, catalogo, onSalvo, onFechar }) {
  const isEdicao = !!chamado
  const [form, setForm] = useState({
    titulo:        chamado?.titulo        || '',
    descricao:     chamado?.descricao     || '',
    municipio:     chamado?.municipio     || '',
    entidade:      chamado?.entidade      || '',
    classificacao: chamado?.classificacao || '',
    prioridade:    chamado?.prioridade    || 'Normal',
    vertical:      chamado?.vertical      || '',
    sistema:       chamado?.sistema       || '',
    responsavelId: chamado?.responsavelId || '',
    solicitanteId: chamado?.solicitanteId || '',
  })
  const [arquivos, setArquivos]                 = useState([])
  const [salvando, setSalvando]                 = useState(false)
  const [erro, setErro]                         = useState('')
  const [erroAnexo, setErroAnexo]               = useState('')
  const [solicitantes, setSolicitantes]         = useState([])
  const [novoSol, setNovoSol]                   = useState(false)
  const [formSol, setFormSol]                   = useState({ nome: '', cargo: '', email: '', telefone: '' })
  const [criandoSol, setCriandoSol]             = useState(false)

  const LIMITE_ARQUIVO_MB = 35
  const [portMunicipios, setPortMunicipios] = useState([])
  const [portEntidades, setPortEntidades]   = useState([])
  const [carregandoEnt, setCarregandoEnt]   = useState(false)
  const fileRef    = useRef()
  const initialRef = useRef({ ...form })
  const fecharComGuard = () => confirmClose(isFormDirty(initialRef.current, form) || arquivos.length > 0, onFechar)

  useEffect(() => {
    portfolioApi.listar().then(({ data }) => {
      setPortMunicipios(data)
      if (chamado?.municipio) {
        const mun = data.find(m => m.nome === chamado.municipio)
        if (mun) portfolioApi.entidades(mun.id).then(setPortEntidades).catch(() => {})
      }
    }).catch(() => {})
    solicitantesApi.listar().then(setSolicitantes).catch(() => {})
  }, [])

  const handleMunicipioChange = (nome) => {
    setField('municipio', nome); setField('entidade', ''); setPortEntidades([])
    if (!nome) return
    const mun = portMunicipios.find(m => m.nome === nome)
    if (!mun) return
    setCarregandoEnt(true)
    portfolioApi.entidades(mun.id).then(setPortEntidades).catch(() => {}).finally(() => setCarregandoEnt(false))
  }

  const sistemasDaVertical = form.vertical
    ? (catalogo.find(v => v.nome === form.vertical)?.sistemas || [])
    : []

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const criarSolicitante = async () => {
    if (!formSol.nome.trim()) return
    setCriandoSol(true)
    try {
      const sol = await solicitantesApi.criar({
        nome: formSol.nome.trim(),
        cargo: formSol.cargo.trim() || null,
        email: formSol.email.trim() || null,
        telefone: formSol.telefone.trim() || null,
        municipio: form.municipio || null,
      })
      setSolicitantes(prev => [...prev, sol])
      setField('solicitanteId', String(sol.id))
      setNovoSol(false)
      setFormSol({ nome: '', cargo: '', email: '', telefone: '' })
    } catch {} finally { setCriandoSol(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim()) { setErro('Título é obrigatório'); return }
    setSalvando(true); setErro('')
    try {
      const payload = {
        titulo: form.titulo.trim(), descricao: form.descricao.trim() || null,
        municipio: form.municipio.trim() || null, entidade: form.entidade.trim() || null,
        classificacao: form.classificacao || null, prioridade: form.prioridade,
        vertical: form.vertical || null, sistema: form.sistema || null,
        responsavelId: form.responsavelId ? Number(form.responsavelId) : null,
        solicitanteId: form.solicitanteId ? Number(form.solicitanteId) : null,
      }
      let criado
      if (isEdicao) { criado = await chamadosApi.atualizar(chamado.id, payload) }
      else {
        criado = await chamadosApi.criar(payload)
        for (const arq of arquivos) await chamadosApi.criarAnexo(criado.id, arq)
      }
      onSalvo(criado)
    } catch (e) { setErro(e.message) } finally { setSalvando(false) }
  }

  const handleFiles = (e) => {
    setErroAnexo('')
    const rejeitados = []
    Array.from(e.target.files).forEach(file => {
      if (file.size > LIMITE_ARQUIVO_MB * 1024 * 1024) {
        rejeitados.push(`"${file.name}" (${formatBytes(file.size)})`)
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => setArquivos(prev => [...prev, {
        nomeArquivo: file.name, tipo: file.type,
        conteudo: ev.target.result.split(',')[1], tamanho: file.size,
      }])
      reader.readAsDataURL(file)
    })
    if (rejeitados.length > 0)
      setErroAnexo(`${rejeitados.join(', ')} ${rejeitados.length === 1 ? 'excede' : 'excedem'} o limite de ${LIMITE_ARQUIVO_MB} MB e ${rejeitados.length === 1 ? 'não foi adicionado' : 'não foram adicionados'}.`)
    e.target.value = ''
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{isEdicao ? 'Editar Chamado' : 'Novo Chamado'}</h2>
          <button onClick={fecharComGuard} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}
          <div>
            <label className="label">Título *</label>
            <input className="input" value={form.titulo} onChange={e => setField('titulo', e.target.value)} required />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input min-h-[80px]" value={form.descricao} onChange={e => setField('descricao', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Município</label>
              <select className="input" value={form.municipio} onChange={e => handleMunicipioChange(e.target.value)}>
                <option value="">— Selecione —</option>
                {portMunicipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Entidade</label>
              <select className="input" value={form.entidade} onChange={e => setField('entidade', e.target.value)}
                disabled={!form.municipio || (portEntidades.length === 0 && !carregandoEnt)}>
                <option value="">{carregandoEnt ? 'Carregando…' : portEntidades.length === 0 && form.municipio ? 'Nenhuma entidade' : '— Selecione —'}</option>
                {portEntidades.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Classificação</label>
              <select className="input" value={form.classificacao} onChange={e => setField('classificacao', e.target.value)}>
                <option value="">— Sem classificação —</option>
                {CLASSIF_OPTS.filter(Boolean).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prioridade</label>
              <select className="input" value={form.prioridade} onChange={e => setField('prioridade', e.target.value)}>
                {PRIORIDADE_OPTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vertical</label>
              <select className="input" value={form.vertical} onChange={e => { setField('vertical', e.target.value); setField('sistema', '') }}>
                <option value="">— Selecione —</option>
                {catalogo.map(v => <option key={v.id} value={v.nome}>{v.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sistema</label>
              <select className="input" value={form.sistema} onChange={e => setField('sistema', e.target.value)} disabled={!form.vertical}>
                <option value="">— Selecione —</option>
                {sistemasDaVertical.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Responsável</label>
            <select className="input" value={form.responsavelId} onChange={e => setField('responsavelId', e.target.value)}>
              <option value="">— Sem responsável —</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Solicitante</label>
              <button type="button" onClick={() => setNovoSol(v => !v)}
                className="text-xs text-sysgate-600 hover:underline">
                {novoSol ? '× Cancelar' : '+ Novo solicitante'}
              </button>
            </div>
            <SearchSelect
              options={solicitantes.map(s => ({ value: String(s.id), label: s.municipio ? `${s.nome} (${s.municipio})` : s.nome }))}
              value={String(form.solicitanteId || '')}
              onChange={v => setField('solicitanteId', v)}
              placeholder="Buscar solicitante…"
            />
            {novoSol && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Novo Solicitante</p>
                <input className="input text-sm" placeholder="Nome *" value={formSol.nome} onChange={e => setFormSol(f => ({ ...f, nome: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input text-sm" placeholder="Cargo" value={formSol.cargo} onChange={e => setFormSol(f => ({ ...f, cargo: e.target.value }))} />
                  <input className="input text-sm" placeholder="Telefone" value={formSol.telefone} onChange={e => setFormSol(f => ({ ...f, telefone: e.target.value }))} />
                </div>
                <input className="input text-sm" placeholder="E-mail" value={formSol.email} onChange={e => setFormSol(f => ({ ...f, email: e.target.value }))} />
                <button type="button" onClick={criarSolicitante} disabled={criandoSol || !formSol.nome.trim()}
                  className="btn text-xs w-full disabled:opacity-40">
                  {criandoSol ? 'Criando…' : 'Criar e vincular'}
                </button>
              </div>
            )}
          </div>
          {!isEdicao && (
            <div>
              <label className="label">Anexos</label>
              <input type="file" multiple ref={fileRef} onChange={handleFiles} className="hidden" />
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => { setErroAnexo(''); fileRef.current?.click() }}
                  className="text-sm text-sysgate-600 hover:underline">+ Selecionar arquivos</button>
                <span className="text-xs text-gray-400">JPG, PNG, PDF e outros · máx. {LIMITE_ARQUIVO_MB} MB por arquivo</span>
              </div>
              {erroAnexo && (
                <p className="mt-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1">{erroAnexo}</p>
              )}
              {arquivos.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {arquivos.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{iconeAnexo(a.tipo)}</span>
                      <span className="truncate">{a.nomeArquivo}</span>
                      <span className="text-gray-400 text-xs shrink-0">{formatBytes(a.tamanho)}</span>
                      <button type="button" className="text-red-400 hover:text-red-600 text-xs ml-auto"
                        onClick={() => setArquivos(prev => prev.filter((_, j) => j !== i))}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={fecharComGuard} className="btn btn-ghost text-sm">Cancelar</button>
          <button onClick={handleSubmit} disabled={salvando} className="btn text-sm">
            {salvando ? 'Salvando…' : isEdicao ? 'Salvar' : 'Criar Chamado'}
          </button>
        </div>
      </div>
    </div>
  )
}
