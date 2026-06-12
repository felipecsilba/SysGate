import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import usePortalAuthStore from '../../stores/portalAuthStore'
import { portalAuthApi } from '../../lib/portalApi'

const HCAPTCHA_SITEKEY = import.meta.env.VITE_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001'

// ─── Modal Esqueceu Senha (portal — recuperação por email) ────────────────────
function ModalEsqueceuSenha({ onClose }) {
  const [email, setEmail] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!email.trim()) {
      setErro('Informe seu email.')
      return
    }
    setCarregando(true)
    try {
      await portalAuthApi.esqueciSenha(email.trim())
      setEnviado(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {enviado ? (
          <div className="px-6 py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Email enviado</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Se o email informado existir em nosso sistema, você receberá um link de recuperação em instantes.
              <br /><span className="text-xs text-gray-400 mt-1 block">O link expira em 1 hora.</span>
            </p>
            <button onClick={onClose} className="w-full bg-sysgate-600 hover:bg-sysgate-700 text-white font-semibold py-2.5 rounded-lg transition-colors">
              Voltar ao login
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recuperar senha</h2>
                <p className="text-xs text-gray-500 mt-0.5">Informe o email cadastrado no portal</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
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
                {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tela de Login do Portal ──────────────────────────────────────────────────
export default function PortalLogin() {
  const navigate = useNavigate()
  const { login, carregando, isAutenticado } = usePortalAuthStore()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar] = useState(false)
  const [erro, setErro] = useState('')
  const [falhasConsecutivas, setFalhasConsecutivas] = useState(0)
  const [hcaptchaToken, setHcaptchaToken] = useState('')
  const [modalRecuperacao, setModalRecuperacao] = useState(false)
  const captchaRef = useRef(null)

  const exibirCaptcha = falhasConsecutivas >= 3

  useEffect(() => {
    if (isAutenticado()) navigate('/portal', { replace: true })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')

    if (exibirCaptcha && !hcaptchaToken) {
      setErro('Por favor, resolva o CAPTCHA antes de continuar.')
      return
    }

    try {
      await login(email.trim(), senha, hcaptchaToken || undefined, lembrar)
      navigate('/portal', { replace: true })
    } catch (err) {
      setErro(err.message)
      setFalhasConsecutivas((n) => n + 1)
      setHcaptchaToken('')
      captchaRef.current?.resetCaptcha()
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/nova-logo.webp"
              alt="Krakion Labs"
              className="w-56 mx-auto mb-3 object-contain drop-shadow-sm"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <p className="text-sm font-bold tracking-widest text-sysgate-600 uppercase">
              Portal de Atendimento
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-7">
            <h1 className="text-2xl font-bold text-gray-900">Acompanhe seus chamados</h1>
            <p className="text-sm text-gray-500 mt-1 mb-6">Entre com o email cadastrado</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="username"
                required
              />

              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  className="input pr-10"
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

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-sysgate-600 focus:ring-sysgate-500"
                />
                <span className="text-sm text-gray-600">Manter conectado</span>
              </label>

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
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="flex items-center justify-between mt-5">
              <button
                type="button"
                onClick={() => setModalRecuperacao(true)}
                className="text-sm text-gray-400 hover:text-sysgate-600 transition-colors"
              >
                Esqueci minha senha
              </button>
              <p className="text-sm text-gray-400">
                Novo?{' '}
                <Link to="/portal/registro" className="font-semibold text-sysgate-600 hover:text-sysgate-700 transition-colors">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Krakion Labs. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {modalRecuperacao && <ModalEsqueceuSenha onClose={() => setModalRecuperacao(false)} />}
    </>
  )
}
