import { useState, useEffect, useCallback } from 'react'
import { usuariosApi, authApi } from '../lib/api'
import useAuthStore from '../stores/authStore'

// ── Avatar ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
  '#d97706', '#16a34a', '#0891b2', '#0284c7', '#9333ea',
]

function avatarCor(nome) {
  if (!nome) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function avatarIniciais(nome) {
  if (!nome) return '?'
  const partes = nome.trim().split(/\s+/)
  if (partes.length === 1) return partes[0][0].toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

// ── Datas ─────────────────────────────────────────────────────────────────────

function tempoRelativo(iso) {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const seg = Math.floor(diff / 1000)
  if (seg < 60) return 'agora mesmo'
  const min = Math.floor(seg / 60)
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hoje às ${new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  const d = Math.floor(h / 24)
  if (d < 7) return `há ${d} dia${d !== 1 ? 's' : ''}`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function dataFormatada(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ── Ícones inline ─────────────────────────────────────────────────────────────

const IcoUser = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const IcoLock = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const IcoClock = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
)

const IcoShield = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const IcoKey = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)

const IcoEyeOff = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

const IcoEye = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

// ── Constantes ────────────────────────────────────────────────────────────────

const FUNCOES = ['Suporte', 'Analista de Implantação', 'Gerente', 'Administrador']

// ── Componente principal ───────────────────────────────────────────────────────

export default function MeuPerfil() {
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({ nome: '', email: '', funcao: '' })
  const [salvandoDados, setSalvandoDados] = useState(false)
  const [erroDados, setErroDados] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [senhaAberta, setSenhaAberta] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState('')
  const [sucessoSenha, setSucessoSenha] = useState(false)

  const carregarPerfil = useCallback(async () => {
    try {
      setCarregando(true)
      setErro('')
      const data = await authApi.me()
      setPerfil(data)
      setForm({ nome: data.nome || '', email: data.email || '', funcao: data.funcao || '' })
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregarPerfil() }, [carregarPerfil])

  const salvarDados = async () => {
    setErroDados('')
    setSucesso('')
    if (!form.nome.trim()) { setErroDados('O nome não pode estar vazio.'); return }
    setSalvandoDados(true)
    try {
      await usuariosApi.atualizar(perfil.id, {
        nome: form.nome.trim(),
        email: form.email.trim() || null,
        funcao: form.funcao || null,
      })
      await carregarPerfil()
      setSucesso('Perfil atualizado com sucesso.')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      setErroDados(err.message)
    } finally {
      setSalvandoDados(false)
    }
  }

  const salvarSenha = async () => {
    setErroSenha('')
    if (novaSenha.length < 6) { setErroSenha('A senha deve ter no mínimo 6 caracteres.'); return }
    setSalvandoSenha(true)
    try {
      await usuariosApi.alterarSenha(perfil.id, novaSenha)
      setNovaSenha('')
      setSenhaAberta(false)
      setSucessoSenha(true)
      setTimeout(() => setSucessoSenha(false), 4000)
    } catch (err) {
      setErroSenha(err.message)
    } finally {
      setSalvandoSenha(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Carregando...
      </div>
    )
  }

  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
        {erro}
      </div>
    )
  }

  const cor = avatarCor(perfil?.nome)
  const iniciais = avatarIniciais(perfil?.nome)

  return (
    <div className="max-w-5xl space-y-5">

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full bg-sysgate-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie suas informações pessoais e segurança</p>
        </div>
      </div>

      {/* ── Card de identidade ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: cor }}
            >
              {iniciais}
            </div>
          </div>

          {/* Nome + badges */}
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-gray-900 truncate">{perfil?.nome}</p>
            <p className="text-sm text-gray-400 font-mono mt-0.5">@{perfil?.login}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {perfil?.funcao && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sysgate-100 text-sysgate-700 uppercase tracking-wide">
                  {perfil.funcao}
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                perfil?.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {perfil?.role === 'admin' ? 'Administrador' : 'Operador'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-8 shrink-0">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Membro desde</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{dataFormatada(perfil?.criadoEm)}</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Último acesso</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{tempoRelativo(perfil?.ultimoLogin)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid de 2 colunas ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* Coluna esquerda (3/5) — Informações pessoais */}
        <div className="lg:col-span-3 card">
          <div className="flex items-center gap-2 mb-5">
            <div className="text-sysgate-600"><IcoUser /></div>
            <h2 className="font-semibold text-gray-900">Informações pessoais</h2>
          </div>

          <div className="space-y-4">
            {/* Login + Nome em grid 2 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Login
                  <span className="text-xs text-gray-400 font-normal ml-1">(fixo)</span>
                </label>
                <input
                  type="text"
                  className="input bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
                  value={perfil?.login || ''}
                  readOnly
                />
              </div>
              <div>
                <label className="label">Nome completo *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="label">
                Email
                <span className="text-xs text-gray-400 font-normal ml-1">— para recuperação de senha</span>
              </label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="label">Função</label>
              <select
                className="input"
                value={form.funcao}
                onChange={(e) => setForm((f) => ({ ...f, funcao: e.target.value }))}
              >
                <option value="">— Selecionar função —</option>
                {FUNCOES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {erroDados && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {erroDados}
              </div>
            )}
            {sucesso && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
                {sucesso}
              </div>
            )}

            <button
              onClick={salvarDados}
              disabled={salvandoDados}
              className="btn btn-primary text-sm"
            >
              {salvandoDados ? 'Salvando...' : 'Salvar informações'}
            </button>
          </div>
        </div>

        {/* Coluna direita (2/5) — Segurança + Atividades */}
        <div className="lg:col-span-2 space-y-4">

          {/* Card Segurança */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-sysgate-600"><IcoLock /></div>
              <h2 className="font-semibold text-gray-900">Segurança</h2>
            </div>

            {sucessoSenha && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 mb-3">
                Senha alterada com sucesso!
              </div>
            )}

            {!senhaAberta ? (
              <>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  Mantenha sua conta protegida alterando sua senha regularmente.
                </p>
                <button
                  onClick={() => { setSenhaAberta(true); setErroSenha(''); setNovaSenha('') }}
                  className="btn btn-secondary text-sm w-full flex items-center justify-center gap-2"
                >
                  <IcoKey />
                  Alterar senha
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label">Nova senha *</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Mínimo 6 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {mostrarSenha ? <IcoEyeOff /> : <IcoEye />}
                    </button>
                  </div>
                </div>
                {erroSenha && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                    {erroSenha}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={salvarSenha} disabled={salvandoSenha} className="btn btn-primary text-sm flex-1">
                    {salvandoSenha ? 'Salvando...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => { setSenhaAberta(false); setErroSenha(''); setNovaSenha('') }}
                    className="btn btn-secondary text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card Atividades */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-sysgate-600"><IcoClock /></div>
              <h2 className="font-semibold text-gray-900">Atividades</h2>
            </div>

            <div className="space-y-3">
              {/* Login */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-sysgate-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-sysgate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">Login efetuado</p>
                  <p className="text-xs text-gray-400">{tempoRelativo(perfil?.ultimoLogin)}</p>
                </div>
              </div>

              <div className="border-t border-gray-50" />

              {/* Conta criada */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">Conta criada</p>
                  <p className="text-xs text-gray-400">{dataFormatada(perfil?.criadoEm)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Banner proteção de dados ────────────────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-sysgate-600 to-violet-600 p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-white">
          <IcoShield />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Proteção de Dados Krakion</p>
          <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
            Seu acesso é monitorado e criptografado para garantir a máxima segurança de todas as operações.
          </p>
        </div>
      </div>

    </div>
  )
}
