import { useState, useEffect, useCallback } from 'react'
import { usuariosApi, authApi } from '../lib/api'
import useAuthStore from '../stores/authStore'

// ── Funções de avatar ──────────────────────────────────────────────────────────

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

// ── Formatação de data relativa ────────────────────────────────────────────────

function tempoRelativo(iso) {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const seg = Math.floor(diff / 1000)
  if (seg < 60) return 'agora mesmo'
  const min = Math.floor(seg / 60)
  if (min < 60) return `há ${min} minuto${min !== 1 ? 's' : ''}`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} hora${h !== 1 ? 's' : ''}`
  const d = Math.floor(h / 24)
  if (d < 30) return `há ${d} dia${d !== 1 ? 's' : ''}`
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ── Opções de função ───────────────────────────────────────────────────────────

const FUNCOES = ['Suporte', 'Analista de Implantação', 'Gerente', 'Administrador']

// ── Componente principal ───────────────────────────────────────────────────────

export default function MeuPerfil() {
  const { usuario: usuarioStore, token } = useAuthStore()
  const setUsuarioStore = useAuthStore((s) => s.login) // para atualizar dados no store após salvar

  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Formulário de dados
  const [form, setForm] = useState({ nome: '', email: '', funcao: '' })
  const [salvandoDados, setSalvandoDados] = useState(false)
  const [erroDados, setErroDados] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Alteração de senha
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
    if (!form.nome.trim()) {
      setErroDados('O nome não pode estar vazio.')
      return
    }
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
    setSucessoSenha(false)
    if (novaSenha.length < 6) {
      setErroSenha('A senha deve ter no mínimo 6 caracteres.')
      return
    }
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
    <div className="max-w-2xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 rounded-full bg-sysgate-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie suas informações pessoais e segurança</p>
        </div>
      </div>

      {/* Card de identidade */}
      <div className="card mb-5">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md"
            style={{ backgroundColor: cor }}
          >
            {iniciais}
          </div>

          {/* Info rápida */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-gray-900 truncate">{perfil?.nome}</p>
            <p className="text-sm text-gray-500 font-mono">{perfil?.login}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {perfil?.funcao && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sysgate-100 text-sysgate-700">
                  {perfil.funcao}
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${perfil?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {perfil?.role === 'admin' ? 'Administrador' : 'Operador'}
              </span>
            </div>
          </div>

          {/* Último acesso */}
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400">Último acesso</p>
            <p className="text-sm font-medium text-gray-600">{tempoRelativo(perfil?.ultimoLogin)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Membro desde {perfil?.criadoEm ? new Date(perfil.criadoEm).toLocaleDateString('pt-BR') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de dados */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-sysgate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="font-semibold text-gray-900">Informações pessoais</h2>
        </div>

        <div className="space-y-4">
          {/* Login (read-only) */}
          <div>
            <label className="label">Login <span className="text-xs text-gray-400 font-normal">(não pode ser alterado)</span></label>
            <input
              type="text"
              className="input bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
              value={perfil?.login || ''}
              readOnly
            />
          </div>

          {/* Nome */}
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

          {/* Email */}
          <div>
            <label className="label">
              Email
              <span className="text-xs text-gray-400 font-normal ml-1">— usado para recuperação de senha</span>
            </label>
            <input
              type="email"
              className="input"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          {/* Função */}
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

      {/* Segurança */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-sysgate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="font-semibold text-gray-900">Segurança</h2>
        </div>

        {sucessoSenha && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">
            Senha alterada com sucesso!
          </div>
        )}

        {!senhaAberta ? (
          <button
            onClick={() => { setSenhaAberta(true); setErroSenha(''); setNovaSenha('') }}
            className="btn btn-secondary text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Alterar senha
          </button>
        ) : (
          <div className="space-y-4">
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
                  {mostrarSenha ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {erroSenha && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {erroSenha}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={salvarSenha}
                disabled={salvandoSenha}
                className="btn btn-primary text-sm"
              >
                {salvandoSenha ? 'Salvando...' : 'Confirmar nova senha'}
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
    </div>
  )
}
