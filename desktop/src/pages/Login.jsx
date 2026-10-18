import { useEffect, useState } from 'react'
import Icone from '../components/Icone'
import ControlesJanela from '../components/ControlesJanela'
import { authApi, mensagemErro } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { useTemaStore } from '../stores/temaStore'

function Campo({ rotulo, ...props }) {
  return (
    <label className="block">
      <span className="rotulo">{rotulo}</span>
      <input className="campo" {...props} />
    </label>
  )
}

function FormLogin({ onEntrar }) {
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      onEntrar(await authApi.login({ login, senha }))
    } catch (err) {
      setErro(mensagemErro(err))
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo rotulo="Login" value={login} onChange={e => setLogin(e.target.value)} autoFocus required />
      <Campo rotulo="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} required />
      {erro && <p className="text-sm text-perigo">{erro}</p>}
      <button type="submit" className="botao-primario w-full" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}

function FormContaLocal({ onEntrar }) {
  const [dados, setDados] = useState({ nome: '', login: '', senha: '', confirmar: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const campo = nome => ({ value: dados[nome], onChange: e => setDados(d => ({ ...d, [nome]: e.target.value })) })

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    if (dados.senha.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.')
    if (dados.senha !== dados.confirmar) return setErro('As senhas não conferem.')
    setEnviando(true)
    try {
      const { nome, login, senha } = dados
      onEntrar(await authApi.criarContaLocal({ nome: nome.trim(), login: login.trim(), senha }))
    } catch (err) {
      setErro(mensagemErro(err))
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo rotulo="Seu nome" {...campo('nome')} autoFocus required />
      <Campo rotulo="Login" {...campo('login')} required />
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Senha" type="password" {...campo('senha')} required />
        <Campo rotulo="Confirmar senha" type="password" {...campo('confirmar')} required />
      </div>
      {erro && <p className="text-sm text-perigo">{erro}</p>}
      <button type="submit" className="botao-primario w-full" disabled={enviando}>
        {enviando ? 'Criando…' : 'Criar conta local'}
      </button>

      <div className="flex items-center gap-3 py-1 text-xs text-suave">
        <span className="h-px flex-1 bg-borda" /> ou <span className="h-px flex-1 bg-borda" />
      </div>

      <button type="button" className="botao-secundario w-full" disabled title="Chega com a sincronização com a VPS">
        <Icone nome="nuvem" className="h-4 w-4" />
        Entrar com conta Krakion
        <span className="rounded-full bg-acento-suave px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-acento">
          em breve
        </span>
      </button>
    </form>
  )
}

export default function Login() {
  const entrar = useAuthStore(s => s.entrar)
  const { preferencia, alternar } = useTemaStore()
  const [primeiraAbertura, setPrimeiraAbertura] = useState(null) // null = verificando

  useEffect(() => {
    authApi.setupDisponivel().then(setPrimeiraAbertura).catch(() => setPrimeiraAbertura(false))
  }, [])

  return (
    <div className="relative flex h-full items-center justify-center bg-painel p-6">
      <div className="arrastar absolute inset-x-0 top-0 flex h-12 items-center justify-end gap-1 px-3">
        <button
          type="button"
          onClick={alternar}
          title="Trocar tema"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-suave hover:bg-texto/10 hover:text-texto"
        >
          <Icone nome={preferencia} className="h-4 w-4" />
        </button>
        <ControlesJanela className="ml-1 border-l border-borda pl-1" />
      </div>

      <div className="w-full max-w-sm">
        <img src="./nova-logo.webp" alt="Krakion" className="mx-auto mb-6 h-20 w-20 object-contain" />
        <div className="rounded-2xl border border-borda bg-fundo p-7 shadow-sm">
          {primeiraAbertura === null ? (
            <p className="py-6 text-center text-sm text-suave">Carregando…</p>
          ) : (
            <>
              <h1 className="text-lg font-semibold">{primeiraAbertura ? 'Bem-vindo ao Krakion' : 'Entrar'}</h1>
              <p className="mb-6 mt-1 text-sm text-suave">
                {primeiraAbertura
                  ? 'Primeira abertura nesta máquina. Crie sua conta local — ela fica só aqui e funciona offline.'
                  : 'Use sua conta local desta máquina.'}
              </p>
              {primeiraAbertura ? <FormContaLocal onEntrar={entrar} /> : <FormLogin onEntrar={entrar} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
