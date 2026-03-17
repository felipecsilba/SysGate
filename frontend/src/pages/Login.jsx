import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import useAuthStore from '../stores/authStore'
import api from '../lib/api'

const HCAPTCHA_SITEKEY = import.meta.env.VITE_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001'

// ─── Ícones inline ────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const IconLock = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const IconEyeOff = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

const IconEye = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const IconCheck = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// ─── Input com ícone ──────────────────────────────────────────────────────────
function InputIcon({ icon, children }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      {children}
    </div>
  )
}

// ─── Modal overlay ────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// ─── Etapa 1: Dados básicos ───────────────────────────────────────────────────
function EtapaDados({ onEnviarCodigo, onClose }) {
  const [nome, setNome] = useState('')
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const formatarTelefone = (val) => {
    const nums = val.replace(/\D/g, '')
    if (nums.length <= 2) return `+${nums}`
    if (nums.length <= 4) return `+${nums.slice(0, 2)} ${nums.slice(2)}`
    if (nums.length <= 9) return `+${nums.slice(0, 2)} ${nums.slice(2, 4)} ${nums.slice(4)}`
    return `+${nums.slice(0, 2)} ${nums.slice(2, 4)} ${nums.slice(4, 9)}-${nums.slice(9, 13)}`
  }

  const telefoneE164 = () => '+' + telefone.replace(/\D/g, '')

  const handleEnviar = async (e) => {
    e.preventDefault()
    setErro('')
    if (!nome || !login || !senha || !telefone) {
      setErro('Todos os campos são obrigatórios.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    const tel = telefoneE164()
    if (!/^\+[1-9]\d{7,14}$/.test(tel)) {
      setErro('Número inválido. Use o formato: +55 11 99999-9999')
      return
    }
    setCarregando(true)
    try {
      await api.post('/auth/solicitar-codigo', { telefone: tel })
      onEnviarCodigo({ nome, login, senha, telefone: tel })
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao enviar código. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Criar conta</h2>
          <p className="text-xs text-gray-500 mt-0.5">Etapa 1 de 2 — Seus dados</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleEnviar} className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo</label>
          <input
            type="text"
            className="input"
            placeholder="João da Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Login</label>
          <input
            type="text"
            className="input"
            placeholder="joao.silva"
            value={login}
            onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/\s/g, ''))}
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Senha</label>
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              className="input pr-10"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {mostrarSenha ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Número de telefone</label>
          <input
            type="tel"
            className="input"
            placeholder="+55 11 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            autoComplete="tel"
          />
          <p className="text-xs text-gray-400 mt-1">Enviaremos um código SMS para verificação.</p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-sysgate-600 hover:bg-sysgate-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {carregando ? 'Enviando código...' : 'Enviar código SMS →'}
        </button>
      </form>
    </>
  )
}

// ─── Etapa 2: Verificação OTP ─────────────────────────────────────────────────
function EtapaVerificacao({ dados, onSucesso, onClose }) {
  const [digitos, setDigitos] = useState(['', '', '', '', '', ''])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [reenvioSegundos, setReenvioSegundos] = useState(60)
  const [reenviando, setReenviando] = useState(false)
  const refs = Array.from({ length: 6 }, () => useRef(null))

  useEffect(() => {
    refs[0].current?.focus()
    const timer = setInterval(() => setReenvioSegundos((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleDigito = (idx, val) => {
    const char = val.replace(/\D/g, '').slice(-1)
    const novo = [...digitos]
    novo[idx] = char
    setDigitos(novo)
    if (char && idx < 5) refs[idx + 1].current?.focus()
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digitos[idx] && idx > 0) {
      refs[idx - 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length > 0) {
      const novo = [...digitos]
      paste.split('').forEach((c, i) => { if (i < 6) novo[i] = c })
      setDigitos(novo)
      refs[Math.min(paste.length, 5)].current?.focus()
    }
    e.preventDefault()
  }

  const handleVerificar = async (e) => {
    e.preventDefault()
    const codigo = digitos.join('')
    if (codigo.length < 6) {
      setErro('Digite os 6 dígitos do código.')
      return
    }
    setErro('')
    setCarregando(true)
    try {
      await api.post('/auth/registrar', { ...dados, codigo })
      onSucesso()
    } catch (err) {
      setErro(err.response?.data?.error || 'Código incorreto ou expirado.')
      setDigitos(['', '', '', '', '', ''])
      refs[0].current?.focus()
    } finally {
      setCarregando(false)
    }
  }

  const handleReenviar = async () => {
    setReenviando(true)
    try {
      await api.post('/auth/solicitar-codigo', { telefone: dados.telefone })
      setReenvioSegundos(60)
      setDigitos(['', '', '', '', '', ''])
      setErro('')
      refs[0].current?.focus()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao reenviar. Tente novamente.')
    } finally {
      setReenviando(false)
    }
  }

  const telMascarado = dados.telefone.replace(/(\+\d{2})(\d{2})(\d{5})(\d{4})/, '$1 $2 *****-$4')

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Verificação</h2>
          <p className="text-xs text-gray-500 mt-0.5">Etapa 2 de 2 — Código SMS</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleVerificar} className="px-6 py-5">
        <p className="text-sm text-gray-600 mb-5 text-center">
          Enviamos um código de 6 dígitos para<br />
          <span className="font-semibold text-gray-800">{telMascarado}</span>
        </p>

        <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
          {digitos.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigito(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl border-gray-200 focus:border-sysgate-600 focus:outline-none transition-colors"
            />
          ))}
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-sysgate-600 hover:bg-sysgate-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors mb-4"
        >
          {carregando ? 'Verificando...' : 'Verificar'}
        </button>

        <div className="text-center">
          {reenvioSegundos > 0 ? (
            <p className="text-xs text-gray-400">
              Reenviar código em <span className="font-medium text-gray-600">{reenvioSegundos}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleReenviar}
              disabled={reenviando}
              className="text-sm text-sysgate-600 hover:text-sysgate-700 font-medium disabled:opacity-50"
            >
              {reenviando ? 'Reenviando...' : 'Reenviar código'}
            </button>
          )}
        </div>
      </form>
    </>
  )
}

// ─── Etapa 3: Sucesso ─────────────────────────────────────────────────────────
function EtapaSucesso({ onClose }) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-5">
        <IconCheck />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Conta criada!</h2>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Sua solicitação foi registrada com sucesso.<br />
        Aguarde a <span className="font-semibold text-gray-700">ativação pelo administrador</span> para acessar o sistema.
      </p>
      <button
        onClick={onClose}
        className="w-full bg-sysgate-600 hover:bg-sysgate-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        Voltar ao Login
      </button>
    </div>
  )
}

// ─── Modal de Cadastro ────────────────────────────────────────────────────────
function ModalCadastro({ onClose }) {
  const [etapa, setEtapa] = useState(1) // 1 | 2 | 3
  const [dados, setDados] = useState(null)

  const handleEnviarCodigo = (d) => {
    setDados(d)
    setEtapa(2)
  }

  const handleSucesso = () => setEtapa(3)

  return (
    <Modal onClose={onClose}>
      {etapa === 1 && <EtapaDados onEnviarCodigo={handleEnviarCodigo} onClose={onClose} />}
      {etapa === 2 && <EtapaVerificacao dados={dados} onSucesso={handleSucesso} onClose={onClose} />}
      {etapa === 3 && <EtapaSucesso onClose={onClose} />}
    </Modal>
  )
}

// ─── Tela de Login ────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate()
  const { login, carregando, isAutenticado } = useAuthStore()

  const [loginInput, setLoginInput] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar] = useState(false)
  const [erro, setErro] = useState('')
  const [falhasConsecutivas, setFalhasConsecutivas] = useState(0)
  const [hcaptchaToken, setHcaptchaToken] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const captchaRef = useRef(null)

  const exibirCaptcha = falhasConsecutivas >= 3

  useEffect(() => {
    if (isAutenticado()) navigate('/', { replace: true })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')

    if (exibirCaptcha && !hcaptchaToken) {
      setErro('Por favor, resolva o CAPTCHA antes de continuar.')
      return
    }

    try {
      await login(loginInput, senha, hcaptchaToken || undefined, lembrar)
      navigate('/', { replace: true })
    } catch (err) {
      setErro(err.message)
      setFalhasConsecutivas((n) => n + 1)
      setHcaptchaToken('')
      captchaRef.current?.resetCaptcha()
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">

          {/* Logo + nome */}
          <div className="text-center mb-8">
            <img
              src="/logo-sem-nome.png"
              alt="Krakion Labs"
              className="w-16 h-16 mx-auto mb-3 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
              Krakion Labs
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-7">
            <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
            <p className="text-sm text-gray-500 mt-1 mb-6">Acesse seu terminal seguro</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Login */}
              <div>
                <InputIcon icon={<IconUser />}>
                  <input
                    type="text"
                    className="input pl-9"
                    placeholder="Login"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    autoFocus
                    autoComplete="username"
                    required
                  />
                </InputIcon>
              </div>

              {/* Senha */}
              <div>
                <InputIcon icon={<IconLock />}>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    className="input pl-9 pr-10"
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? <IconEyeOff /> : <IconEye />}
                  </button>
                </InputIcon>
              </div>

              {/* Manter conectado */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-sysgate-600 focus:ring-sysgate-500"
                />
                <span className="text-sm text-gray-600">Manter conectado</span>
              </label>

              {/* hCaptcha */}
              {exibirCaptcha && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 w-full text-center">
                    Verifique que você não é um robô para continuar.
                  </p>
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={HCAPTCHA_SITEKEY}
                    onVerify={(token) => setHcaptchaToken(token)}
                    onExpire={() => setHcaptchaToken('')}
                  />
                </div>
              )}

              {/* Erro */}
              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {erro}
                </div>
              )}

              {/* Botão entrar */}
              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-sysgate-600 hover:bg-sysgate-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {carregando ? (
                  'Entrando...'
                ) : (
                  <>
                    Entrar
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Link cadastro */}
            <p className="text-sm text-center text-gray-400 mt-5">
              Novo por aqui?{' '}
              <button
                type="button"
                onClick={() => setModalAberto(true)}
                className="font-semibold text-sysgate-600 hover:text-sysgate-700 transition-colors"
              >
                Criar conta
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Modal de cadastro */}
      {modalAberto && (
        <ModalCadastro onClose={() => setModalAberto(false)} />
      )}
    </>
  )
}
