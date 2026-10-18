import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icone from '../components/Icone'
import Pagina from '../components/Pagina'
import { importacaoApi, mensagemErro } from '../lib/api'

// Lembra endereço e login (nunca a senha) para a próxima importação
const CHAVE = 'krakion-desktop-importacao'
function lembrado() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || {} } catch { return {} }
}

const ETAPAS = ['Conectar', 'Escolher', 'Pronto']

function Etapas({ atual }) {
  return (
    <ol className="mb-8 flex items-center gap-2 text-xs">
      {ETAPAS.map((nome, i) => (
        <li key={nome} className="flex items-center gap-2">
          {i > 0 && <span className="h-px w-8 bg-borda" />}
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
              i < atual ? 'bg-acento text-white' : i === atual ? 'bg-texto text-fundo' : 'bg-texto/[0.07] text-suave'
            }`}
          >
            {i < atual ? <Icone nome="check" className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
          </span>
          <span className={i === atual ? 'font-medium' : 'text-suave'}>{nome}</span>
        </li>
      ))}
    </ol>
  )
}

function Opcao({ marcado, onMudar, titulo, detalhe }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
        marcado ? 'border-acento/50 bg-acento-suave/60' : 'border-borda hover:bg-texto/[0.02]'
      }`}
    >
      <input type="checkbox" checked={marcado} onChange={e => onMudar(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[rgb(var(--acento))]" />
      <span>
        <span className="block text-sm font-medium">{titulo}</span>
        <span className="mt-0.5 block text-xs text-suave">{detalhe}</span>
      </span>
    </label>
  )
}

function Numero({ valor, rotulo }) {
  return (
    <div className="rounded-xl bg-texto/[0.04] px-4 py-3">
      <div className="text-xl font-semibold tabular-nums">{valor}</div>
      <div className="text-xs text-suave">{rotulo}</div>
    </div>
  )
}

export default function ImportarDados() {
  const navegar = useNavigate()
  const [etapa, setEtapa] = useState(0)
  const [form, setForm] = useState(() => ({ url: 'https://krakionlabs.cloud', login: '', ...lembrado(), senha: '' }))
  const [conexao, setConexao] = useState(null) // { url, tokenRemoto, resumo, usuarioRemoto }
  const [escolha, setEscolha] = useState({ sistemas: true, municipios: true })
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function conectar(e) {
    e.preventDefault()
    setErro('')
    setOcupado(true)
    try {
      const r = await importacaoApi.conectar(form)
      try { localStorage.setItem(CHAVE, JSON.stringify({ url: r.url, login: form.login })) } catch {}
      setConexao(r)
      setForm(f => ({ ...f, senha: '' }))
      setEtapa(1)
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setOcupado(false)
    }
  }

  async function importar() {
    setErro('')
    setOcupado(true)
    try {
      setResultado(await importacaoApi.executar({ url: conexao.url, tokenRemoto: conexao.tokenRemoto, ...escolha }))
      setEtapa(2)
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setOcupado(false)
    }
  }

  function recomecar() {
    setConexao(null)
    setResultado(null)
    setErro('')
    setEtapa(0)
  }

  const resumo = conexao?.resumo
  const campo = nome => ({ value: form[nome], onChange: e => setForm(f => ({ ...f, [nome]: e.target.value })) })

  return (
    <Pagina titulo="Importar dados" icone="importar">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-6 py-10">
          <Etapas atual={etapa} />

          {etapa === 0 && (
            <form onSubmit={conectar} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Conectar ao Krakion web</h3>
                <p className="mt-1 text-sm text-suave">
                  O app copia seus dados para esta máquina. Depois disso funciona sem a VPS — nada do que você mudar aqui volta para lá.
                </p>
              </div>
              <label className="block">
                <span className="rotulo">Endereço</span>
                <input className="campo" {...campo('url')} required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="rotulo">Login</span>
                  <input className="campo" {...campo('login')} autoFocus required />
                </label>
                <label className="block">
                  <span className="rotulo">Senha</span>
                  <input className="campo" type="password" {...campo('senha')} required />
                </label>
              </div>
              {erro && <p className="text-sm text-perigo">{erro}</p>}
              <button type="submit" className="botao-primario" disabled={ocupado}>
                {ocupado ? 'Conectando…' : 'Conectar'}
              </button>
            </form>
          )}

          {etapa === 1 && resumo && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">O que importar?</h3>
                <p className="mt-1 text-sm text-suave">
                  Conectado a <span className="font-medium text-texto">{conexao.url.replace(/^https?:\/\//, '')}</span> como{' '}
                  <span className="font-medium text-texto">{conexao.usuarioRemoto?.nome || form.login}</span>.
                </p>
              </div>
              <Opcao
                marcado={escolha.sistemas}
                onMudar={v => setEscolha(s => ({ ...s, sistemas: v }))}
                titulo="Sistemas e endpoints"
                detalhe={`${resumo.sistemas} sistemas · ${resumo.endpoints} endpoints${resumo.endpointsSemSistema ? ` (${resumo.endpointsSemSistema} sem sistema ficam de fora)` : ''}`}
              />
              <Opcao
                marcado={escolha.municipios}
                onMudar={v => setEscolha(s => ({ ...s, municipios: v }))}
                titulo="Municípios e tokens"
                detalhe={`${resumo.municipios} municípios · ${resumo.tokens} tokens`}
              />
              <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                Pode importar quantas vezes quiser — nada é duplicado. Sistema ou município com o mesmo nome é atualizado com o que está
                na VPS, e os endpoints desses sistemas são substituídos pelos de lá.
              </p>
              {erro && <p className="text-sm text-perigo">{erro}</p>}
              <div className="flex gap-2">
                <button type="button" className="botao-secundario" onClick={recomecar} disabled={ocupado}>Voltar</button>
                <button
                  type="button"
                  className="botao-primario"
                  onClick={importar}
                  disabled={ocupado || (!escolha.sistemas && !escolha.municipios)}
                >
                  {ocupado ? 'Importando…' : 'Importar'}
                </button>
              </div>
            </div>
          )}

          {etapa === 2 && resultado && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Icone nome="check" className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">Importação concluída</h3>
                  <p className="text-sm text-suave">Os dados já estão nesta máquina.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Numero valor={resultado.sistemasCriados + resultado.sistemasAtualizados} rotulo={`sistemas (${resultado.sistemasCriados} novos)`} />
                <Numero valor={resultado.endpoints} rotulo="endpoints" />
                <Numero valor={resultado.municipiosCriados + resultado.municipiosAtualizados} rotulo={`municípios (${resultado.municipiosCriados} novos)`} />
                <Numero valor={resultado.tokens} rotulo="tokens" />
              </div>
              {resultado.tokensIgnorados > 0 && (
                <p className="text-xs text-suave">
                  {resultado.tokensIgnorados} token(s) ficaram de fora porque o sistema deles não existe aqui — importe também os sistemas.
                </p>
              )}
              <div className="flex gap-2">
                <button type="button" className="botao-primario" onClick={() => navegar('/tokens')}>Ir para Central de Tokens</button>
                <button type="button" className="botao-secundario" onClick={recomecar}>Importar de novo</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Pagina>
  )
}
