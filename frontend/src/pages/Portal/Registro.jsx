import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { portalAuthApi } from '../../lib/portalApi'

const HCAPTCHA_SITEKEY = import.meta.env.VITE_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001'

// Cadastro do portal externo — conta nasce inativa e aguarda aprovação da equipe
export default function PortalRegistro() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nome: '', email: '', senha: '', cargo: '', telefone: '', municipio: '',
  })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [hcaptchaToken, setHcaptchaToken] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const setCampo = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!form.nome.trim() || !form.email.trim() || !form.senha) {
      setErro('Nome, email e senha são obrigatórios.')
      return
    }
    if (form.senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    setCarregando(true)
    try {
      await portalAuthApi.registrar({ ...form, ...(hcaptchaToken && { hcaptchaToken }) })
      setConcluido(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/nova-logo.webp"
            alt="Krakion Labs"
            className="w-48 mx-auto mb-3 object-contain drop-shadow-sm"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <p className="text-sm font-bold tracking-widest text-sysgate-600 uppercase">
            Portal de Atendimento
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-8 py-7">
          {concluido ? (
            /* Tela de sucesso — aprovação manual */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-5">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Conta criada!</h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Sua solicitação foi registrada com sucesso.<br />
                Aguarde a <span className="font-semibold text-gray-700">aprovação da equipe de atendimento</span> para acessar o portal.
              </p>
              <button
                onClick={() => navigate('/portal/login')}
                className="w-full bg-sysgate-600 hover:bg-sysgate-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">Criar conta</h1>
              <p className="text-sm text-gray-500 mt-1 mb-6">
                Preencha seus dados para solicitar acesso ao portal
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome completo *</label>
                  <input type="text" className="input" placeholder="João da Silva"
                    value={form.nome} onChange={setCampo('nome')} autoFocus />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" className="input" placeholder="seu@email.com"
                    value={form.email} onChange={setCampo('email')} autoComplete="username" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Senha *</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Mínimo 8 caracteres"
                      value={form.senha}
                      onChange={setCampo('senha')}
                      autoComplete="new-password"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cargo</label>
                    <input type="text" className="input" placeholder="Contador"
                      value={form.cargo} onChange={setCampo('cargo')} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                    <input type="tel" className="input" placeholder="(00) 00000-0000"
                      value={form.telefone} onChange={setCampo('telefone')} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Município / Prefeitura</label>
                  <input type="text" className="input" placeholder="Ex: Rurópolis"
                    value={form.municipio} onChange={setCampo('municipio')} />
                </div>

                <div className="flex justify-center">
                  <HCaptcha
                    sitekey={HCAPTCHA_SITEKEY}
                    onVerify={(token) => setHcaptchaToken(token)}
                    onExpire={() => setHcaptchaToken('')}
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
                  {carregando ? 'Criando conta...' : 'Criar conta'}
                </button>

                <p className="text-center text-sm text-gray-400">
                  Já tem conta?{' '}
                  <Link to="/portal/login" className="font-semibold text-sysgate-600 hover:text-sysgate-700 transition-colors">
                    Entrar
                  </Link>
                </p>
              </form>
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
