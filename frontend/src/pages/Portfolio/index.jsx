import { useState, useEffect, useMemo, useRef } from 'react'
import { portfolioApi, catalogoApi } from '../../lib/api'
import useAuthStore from '../../stores/authStore'
import { confirmClose, isFormDirty } from '../../lib/formGuard'
import AccordionEntidade from './AccordionEntidade'
import ModalGerenciarSistemas from './ModalGerenciarSistemas'
import ModalCatalogo from './ModalCatalogo'

// ── Ícones ────────────────────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IconSearch() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

// ── Modal genérico ────────────────────────────────────────────────────────────

function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{titulo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <IconX />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Formulário de Município ───────────────────────────────────────────────────

const VAZIO_MUN = { nome: '', estado: '', observacoes: '' }

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

function ModalMunicipio({ editando, onSalvar, onClose }) {
  const [form, setForm] = useState(editando ? { nome: editando.nome, estado: editando.estado || '', observacoes: editando.observacoes || '' } : VAZIO_MUN)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const inicial = useRef({ ...form })
  const fecharComGuard = () => confirmClose(isFormDirty(inicial.current, form), onClose)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    setSalvando(true)
    try {
      await onSalvar(form)
      onClose()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal titulo={editando ? 'Editar Município' : 'Novo Município'} onClose={fecharComGuard}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nome do município *</label>
          <input className="input" placeholder="Ex: Rurópolis" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="label">Estado (UF)</label>
          <select className="input" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
            <option value="">— Selecione —</option>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input resize-none" rows={3} placeholder="Informações gerais sobre o município..." value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </div>
        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={fecharComGuard} className="btn btn-ghost">Cancelar</button>
          <button type="submit" disabled={salvando} className="btn btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Formulário de Entidade ────────────────────────────────────────────────────

const VAZIO_ENT = { nome: '', tipo: '', observacoes: '' }

const TIPOS_ENTIDADE = [
  'prefeitura municipal',
  'câmara municipal',
  'fundo municipal de saúde',
  'fundo municipal de educação',
  'autarquia',
  'fundação',
  'empresa pública',
  'outro',
]

function ModalEntidade({ editando, onSalvar, onClose }) {
  const [form, setForm] = useState(editando ? { nome: editando.nome, tipo: editando.tipo, observacoes: editando.observacoes || '' } : VAZIO_ENT)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const inicial = useRef({ ...form })
  const fecharComGuard = () => confirmClose(isFormDirty(inicial.current, form), onClose)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    if (!form.tipo.trim()) { setErro('Tipo é obrigatório.'); return }
    setSalvando(true)
    try {
      await onSalvar(form)
      onClose()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal titulo={editando ? 'Editar Entidade' : 'Nova Entidade'} onClose={fecharComGuard}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nome da entidade *</label>
          <input className="input" placeholder="Ex: Prefeitura Municipal de Rurópolis" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="label">Tipo *</label>
          <input
            className="input"
            list="tipos-entidade"
            placeholder="Ex: prefeitura municipal"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          />
          <datalist id="tipos-entidade">
            {TIPOS_ENTIDADE.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input resize-none" rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </div>
        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={fecharComGuard} className="btn btn-ghost">Cancelar</button>
          <button type="submit" disabled={salvando} className="btn btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Formulário de Sistema (personalizado) ────────────────────────────────────

const VAZIO_SIS = { nome: '', vertical: '', ativo: true, observacoes: '' }

function ModalSistema({ editando, catalogo, onSalvar, onClose }) {
  const [form, setForm] = useState(editando
    ? { nome: editando.nome, vertical: editando.vertical || '', ativo: editando.ativo, observacoes: editando.observacoes || '' }
    : VAZIO_SIS)
  const [salvando, setSalvando] = useState(false)
  const inicial = useRef({ ...form })
  const fecharComGuard = () => confirmClose(isFormDirty(inicial.current, form), onClose)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    setSalvando(true)
    try {
      await onSalvar(form)
      onClose()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal titulo={editando ? 'Editar Sistema' : 'Novo Sistema Personalizado'} onClose={fecharComGuard}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nome do sistema *</label>
          <input className="input" placeholder="Ex: Sistema Próprio da Prefeitura" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="label">Vertical / Categoria</label>
          <input
            className="input"
            list="verticais-lista"
            placeholder="Ex: Arrecadação, Contábil, Outro..."
            value={form.vertical}
            onChange={(e) => setForm({ ...form, vertical: e.target.value })}
          />
          <datalist id="verticais-lista">
            {catalogo.map(({ nome }) => <option key={nome} value={nome} />)}
          </datalist>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="ativo-sis" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-sysgate-600 focus:ring-sysgate-500" />
          <label htmlFor="ativo-sis" className="text-sm text-gray-700 cursor-pointer">Sistema ativo nesta entidade</label>
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input resize-none" rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </div>
        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={fecharComGuard} className="btn btn-ghost">Cancelar</button>
          <button type="submit" disabled={salvando} className="btn btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Formulário de Stakeholder ─────────────────────────────────────────────────

const VAZIO_SH = { nome: '', cargo: '', telefone: '', email: '', descricao: '', horarioAtendimento: '', ativo: true, sistemas: [] }

function ModalStakeholder({ editando, sistemasEntidade, onSalvar, onClose }) {
  const inicial = useRef(
    editando
      ? {
          nome: editando.nome,
          cargo: editando.cargo || '',
          telefone: editando.telefone || '',
          email: editando.email || '',
          descricao: editando.descricao || '',
          horarioAtendimento: editando.horarioAtendimento || '',
          ativo: editando.ativo,
          sistemas: editando.sistemas.map((v) => v.entidadeSistemaId),
        }
      : { ...VAZIO_SH }
  )
  const [form, setForm] = useState(() => ({ ...inicial.current }))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const fecharComGuard = () => confirmClose(isFormDirty(inicial.current, form), onClose)

  const toggleSistema = (sid) => {
    setForm((f) => ({
      ...f,
      sistemas: f.sistemas.includes(sid) ? f.sistemas.filter((id) => id !== sid) : [...f.sistemas, sid],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    setSalvando(true)
    try {
      await onSalvar(form)
      onClose()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal titulo={editando ? 'Editar Contato' : 'Novo Contato'} onClose={fecharComGuard}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Nome *</label>
            <input className="input" placeholder="Nome completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="label">Cargo / Função</label>
            <input className="input" placeholder="Ex: Secretário de Finanças" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" placeholder="email@prefeitura.gov.br" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Horário de atendimento</label>
            <input className="input" placeholder="Ex: Seg-Sex 8h-17h" value={form.horarioAtendimento} onChange={(e) => setForm({ ...form, horarioAtendimento: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Descrição / Observações</label>
            <textarea className="input resize-none" rows={2} placeholder="Informações adicionais sobre este contato..." value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
        </div>

        {sistemasEntidade.length > 0 && (
          <div>
            <label className="label">Sistemas que utiliza</label>
            <div className="space-y-1.5 mt-1">
              {sistemasEntidade.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.sistemas.includes(s.id)}
                    onChange={() => toggleSistema(s.id)}
                    className="w-4 h-4 rounded border-gray-300 text-sysgate-600 focus:ring-sysgate-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{s.nome}</span>
                  {s.ativo
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">ativo</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">inativo</span>
                  }
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo-sh" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-sysgate-600 focus:ring-sysgate-500" />
          <label htmlFor="ativo-sh" className="text-sm text-gray-700 cursor-pointer">Contato ativo</label>
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={fecharComGuard} className="btn btn-ghost">Cancelar</button>
          <button type="submit" disabled={salvando} className="btn btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Página Principal ──────────────────────────────────────────────────────────

export default function Portfolio() {
  const usuario = useAuthStore((s) => s.usuario)
  const isAdmin = usuario?.role === 'admin'

  const [catalogo, setCatalogo] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [municipioSel, setMunicipioSel] = useState(null)
  const [entidades, setEntidades] = useState([])
  const [carregandoEntidades, setCarregandoEntidades] = useState(false)
  const [busca, setBusca] = useState('')
  const [entidadesAbertas, setEntidadesAbertas] = useState(new Set())

  // Modais
  const [modalMun, setModalMun] = useState(false)
  const [editandoMun, setEditandoMun] = useState(null)
  const [modalEnt, setModalEnt] = useState(false)
  const [editandoEnt, setEditandoEnt] = useState(null)
  const [modalSis, setModalSis] = useState(false)
  const [editandoSis, setEditandoSis] = useState(null)
  const [entidadeParaSis, setEntidadeParaSis] = useState(null)
  const [modalGerenciarSis, setModalGerenciarSis] = useState(false)
  const [entidadeParaGerenciarSis, setEntidadeParaGerenciarSis] = useState(null)
  const [modalSh, setModalSh] = useState(false)
  const [editandoSh, setEditandoSh] = useState(null)
  const [entidadeParaSh, setEntidadeParaSh] = useState(null)
  const [modalCatalogo, setModalCatalogo] = useState(false)

  // ── Carregamento ────────────────────────────────────────────────────────────

  const carregarMunicipios = async () => {
    try {
      const { data } = await portfolioApi.listar()
      setMunicipios(data)
    } finally {
      setCarregando(false)
    }
  }

  const recarregarEntidades = async (id) => {
    const data = await portfolioApi.entidades(id)
    setEntidades(data)
  }

  useEffect(() => {
    carregarMunicipios()
    catalogoApi.listar().then(setCatalogo)
  }, [])

  const municipiosFiltrados = useMemo(
    () => municipios.filter((m) =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (m.estado && m.estado.toLowerCase().includes(busca.toLowerCase()))
    ),
    [municipios, busca]
  )

  // ── Seleção de município ────────────────────────────────────────────────────

  const selecionarMunicipio = async (m) => {
    if (municipioSel?.id === m.id) {
      setMunicipioSel(null)
      setEntidades([])
      setEntidadesAbertas(new Set())
      return
    }
    setMunicipioSel(m)
    setEntidades([])
    setEntidadesAbertas(new Set())
    setCarregandoEntidades(true)
    try {
      const data = await portfolioApi.entidades(m.id)
      setEntidades(data)
    } finally {
      setCarregandoEntidades(false)
    }
  }

  const toggleEntidade = (eid) => {
    setEntidadesAbertas((prev) => {
      const next = new Set(prev)
      next.has(eid) ? next.delete(eid) : next.add(eid)
      return next
    })
  }

  // ── CRUD Município ──────────────────────────────────────────────────────────

  const salvarMunicipio = async (form) => {
    if (editandoMun) {
      await portfolioApi.atualizar(editandoMun.id, form)
    } else {
      await portfolioApi.criar(form)
    }
    await carregarMunicipios()
  }

  const deletarMunicipio = async (m) => {
    if (!window.confirm(`Remover "${m.nome}" e todos os dados vinculados?`)) return
    await portfolioApi.deletar(m.id)
    if (municipioSel?.id === m.id) { setMunicipioSel(null); setEntidades([]) }
    await carregarMunicipios()
  }

  // ── CRUD Entidade ───────────────────────────────────────────────────────────

  const salvarEntidade = async (form) => {
    if (editandoEnt) {
      await portfolioApi.atualizarEntidade(editandoEnt.id, form)
    } else {
      await portfolioApi.criarEntidade(municipioSel.id, form)
    }
    await recarregarEntidades(municipioSel.id)
    await carregarMunicipios()
  }

  const deletarEntidade = async (e) => {
    if (!window.confirm(`Remover entidade "${e.nome}"?`)) return
    await portfolioApi.deletarEntidade(e.id)
    await recarregarEntidades(municipioSel.id)
    await carregarMunicipios()
  }

  // ── CRUD Sistema ────────────────────────────────────────────────────────────

  const salvarSistema = async (form) => {
    if (editandoSis) {
      await portfolioApi.atualizarSistema(editandoSis.id, form)
    } else {
      await portfolioApi.criarSistema(entidadeParaSis.id, form)
    }
    await recarregarEntidades(municipioSel.id)
  }

  const deletarSistema = async (s) => {
    if (!window.confirm(`Remover sistema "${s.nome}"?`)) return
    await portfolioApi.deletarSistema(s.id)
    await recarregarEntidades(municipioSel.id)
  }

  const toggleAtivoSistema = async (s) => {
    await portfolioApi.atualizarSistema(s.id, { ativo: !s.ativo })
    await recarregarEntidades(municipioSel.id)
  }

  // ── CRUD Stakeholder ────────────────────────────────────────────────────────

  const salvarStakeholder = async (form) => {
    if (editandoSh) {
      await portfolioApi.atualizarStakeholder(editandoSh.id, form)
    } else {
      await portfolioApi.criarStakeholder(entidadeParaSh.id, form)
    }
    await recarregarEntidades(municipioSel.id)
  }

  const deletarStakeholder = async (sh) => {
    if (!window.confirm(`Remover contato "${sh.nome}"?`)) return
    await portfolioApi.deletarStakeholder(sh.id)
    await recarregarEntidades(municipioSel.id)
  }

  // ── Handlers de abertura de modal ───────────────────────────────────────────

  const abrirNovoMunicipio = () => { setEditandoMun(null); setModalMun(true) }
  const abrirEditarMunicipio = (m, e) => { e.stopPropagation(); setEditandoMun(m); setModalMun(true) }

  const abrirNovaEntidade = () => { setEditandoEnt(null); setModalEnt(true) }
  const abrirEditarEntidade = (ent) => { setEditandoEnt(ent); setModalEnt(true) }

  const abrirNovoSistema = (ent) => { setEntidadeParaSis(ent); setEditandoSis(null); setModalSis(true) }
  const abrirEditarSistema = (s) => { setEditandoSis(s); setModalSis(true) }
  const abrirGerenciarSistemas = (ent) => { setEntidadeParaGerenciarSis(ent); setModalGerenciarSis(true) }

  const abrirNovoStakeholder = (ent) => { setEntidadeParaSh(ent); setEditandoSh(null); setModalSh(true) }
  const abrirEditarStakeholder = (sh, ent) => { setEntidadeParaSh(ent); setEditandoSh(sh); setModalSh(true) }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-sysgate-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Portfólio de Clientes</h1>
            <p className="text-xs text-gray-500">Municípios, entidades, sistemas e contatos</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalCatalogo(true)}
              className="btn btn-ghost flex items-center gap-1.5"
              title="Configurar catálogo de verticais"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Catálogo</span>
            </button>
            <button onClick={abrirNovoMunicipio} className="btn btn-primary flex items-center gap-1.5">
              <IconPlus /><span>Novo Município</span>
            </button>
          </div>
        )}
      </div>

      {/* Layout principal */}
      <div className="flex flex-col md:flex-row gap-4 items-start">

        {/* Coluna esquerda: lista de municípios */}
        <div className={`card overflow-hidden shrink-0 w-full md:w-72 ${municipioSel ? 'hidden md:flex md:flex-col' : ''}`}>
          {/* Campo de busca */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
              <input
                className="input pl-9 text-sm"
                placeholder="Buscar município..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          {/* Lista */}
          {carregando ? (
            <div className="p-6 text-center text-sm text-gray-400">Carregando...</div>
          ) : municipiosFiltrados.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              {busca ? 'Nenhum resultado.' : 'Nenhum município cadastrado.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {municipiosFiltrados.map((m) => (
                <div
                  key={m.id}
                  onClick={() => selecionarMunicipio(m)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                    municipioSel?.id === m.id ? 'bg-sysgate-50 border-l-2 border-sysgate-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.nome}</p>
                    <p className="text-[11px] text-gray-400">
                      {m.estado && <span className="font-semibold text-sysgate-600 mr-1">{m.estado}</span>}
                      {m._count.entidades} entidade{m._count.entidades !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-0.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => abrirEditarMunicipio(m, e)} className="p-1 rounded text-gray-300 hover:text-sysgate-600 hover:bg-sysgate-50 transition-colors">
                        <IconEdit />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deletarMunicipio(m) }} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <IconTrash />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna direita: entidades */}
        {municipioSel ? (
          <div className="flex-1 min-w-0 space-y-3">
            {/* Botão voltar (mobile) */}
            <button
              onClick={() => { setMunicipioSel(null); setEntidades([]) }}
              className="md:hidden flex items-center gap-1.5 text-sm text-sysgate-600 font-medium mb-1"
            >
              ← Voltar
            </button>

            {/* Header do painel */}
            <div className="card px-4 py-3 flex items-center justify-between bg-gradient-to-r from-white to-sysgate-50/30">
              <div>
                <p className="text-sm font-bold text-gray-900">{municipioSel.nome}</p>
                {municipioSel.estado && <p className="text-xs text-sysgate-600 font-semibold">{municipioSel.estado}</p>}
                {municipioSel.observacoes && <p className="text-xs text-gray-500 mt-0.5">{municipioSel.observacoes}</p>}
              </div>
              {isAdmin && (
                <button onClick={abrirNovaEntidade} className="btn btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5">
                  <IconPlus /><span>Nova Entidade</span>
                </button>
              )}
            </div>

            {/* Entidades */}
            {carregandoEntidades ? (
              <div className="card p-8 text-center text-sm text-gray-400">Carregando entidades...</div>
            ) : entidades.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-gray-500">Nenhuma entidade cadastrada.</p>
                {isAdmin && <p className="text-xs text-gray-400 mt-1">Clique em "Nova Entidade" para começar.</p>}
              </div>
            ) : (
              entidades.map((ent) => (
                <AccordionEntidade
                  key={ent.id}
                  entidade={ent}
                  catalogo={catalogo}
                  aberta={entidadesAbertas.has(ent.id)}
                  onToggle={() => toggleEntidade(ent.id)}
                  isAdmin={isAdmin}
                  onEditarEntidade={abrirEditarEntidade}
                  onDeletarEntidade={deletarEntidade}
                  onNovoSistema={abrirNovoSistema}
                  onGerenciarSistemas={abrirGerenciarSistemas}
                  onEditarSistema={abrirEditarSistema}
                  onDeletarSistema={deletarSistema}
                  onToggleAtivoSistema={toggleAtivoSistema}
                  onNovoStakeholder={abrirNovoStakeholder}
                  onEditarStakeholder={abrirEditarStakeholder}
                  onDeletarStakeholder={deletarStakeholder}
                />
              ))
            )}
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center card p-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-sysgate-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-sysgate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">Selecione um município</p>
              <p className="text-xs text-gray-400 mt-1">para ver as entidades e contatos</p>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      {modalMun && (
        <ModalMunicipio
          editando={editandoMun}
          onSalvar={salvarMunicipio}
          onClose={() => setModalMun(false)}
        />
      )}
      {modalEnt && (
        <ModalEntidade
          editando={editandoEnt}
          onSalvar={salvarEntidade}
          onClose={() => setModalEnt(false)}
        />
      )}
      {modalGerenciarSis && entidadeParaGerenciarSis && (
        <ModalGerenciarSistemas
          entidade={entidades.find((e) => e.id === entidadeParaGerenciarSis.id) || entidadeParaGerenciarSis}
          catalogo={catalogo}
          onClose={() => setModalGerenciarSis(false)}
          onSaved={() => recarregarEntidades(municipioSel.id)}
        />
      )}
      {modalSis && (
        <ModalSistema
          editando={editandoSis}
          catalogo={catalogo}
          onSalvar={salvarSistema}
          onClose={() => setModalSis(false)}
        />
      )}
      {modalCatalogo && (
        <ModalCatalogo
          onClose={() => setModalCatalogo(false)}
          onSaved={() => catalogoApi.listar().then(setCatalogo)}
        />
      )}
      {modalSh && entidadeParaSh && (
        <ModalStakeholder
          editando={editandoSh}
          sistemasEntidade={entidades.find((e) => e.id === entidadeParaSh.id)?.sistemas || []}
          onSalvar={salvarStakeholder}
          onClose={() => setModalSh(false)}
        />
      )}
    </div>
  )
}
