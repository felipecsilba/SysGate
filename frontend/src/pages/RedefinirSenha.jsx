import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [novaSenha, setNovaSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    if (!token) setErro('Link de recuperação inválido. Solicite um novo.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (novaSenha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    setCarregando(true)
    try {
      await authApi.redefinirSenha(token, novaSenha)
      setConcluido(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/nova-logo.webp"
            alt="Krakion Labs"
            className="w-64 mx-auto mb-3 object-contain drop-shadow-sm"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <p className="text-sm font-bold tracking-widest text-sysgate-600 uppercase">
            Krakion Labs
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-7">
          {concluido ? (
            /* Tela de sucesso */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Senha redefinida!</h1>
              <p className="text-sm text-gray-500 mb-6">
                Sua senha foi alterada com sucesso. Faça login com a nova senha.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-sysgate-600 hover:bg-sysgate-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Ir para o login
              </button>
            </div>
          ) : (
            /* Formulário */
            <>
              <h1 className="text-xl font-bold text-gray-900">Redefinir senha</h1>
              <p className="text-sm text-gray-500 mt-1 mb-6">Digite sua nova senha abaixo.</p>

              {!token || erro.includes('inválido') ? (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                    {erro || 'Link inválido.'}
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-sysgate-600 hover:bg-sysgate-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nova senha</label>
                    <div className="relative">
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        className="input pr-10"
                        placeholder="Mínimo 8 caracteres"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        autoFocus
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
                    {carregando ? 'Salvando...' : 'Confirmar nova senha'}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Voltar ao login
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Krakion Labs. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
