import { useEffect, useState } from 'react'
import Confirmar from '../../components/Confirmar'
import Icone from '../../components/Icone'
import Pagina from '../../components/Pagina'

const drive = window.krakion?.drive

// Desembrulha o { ok, dados, erro } do main
async function chamar(fn, ...args) {
  const r = await fn(...args)
  if (!r?.ok) throw new Error(r?.erro || 'Falha inesperada.')
  return r.dados
}

const dataHora = iso => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—')

// Serviços externos que o app usa. Um cartão por conector — por enquanto só o Google Drive.
export default function Conexoes() {
  return (
    <Pagina titulo="Conexões" icone="nuvem">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
          <div>
            <h3 className="text-lg font-semibold">Serviços conectados</h3>
            <p className="mt-1 text-sm text-suave">
              Contas externas que o Krakion App usa. As credenciais ficam cifradas pelo Windows nesta máquina e não voltam para a tela.
            </p>
          </div>
          {drive ? <CartaoDrive /> : <p className="text-sm text-suave">Disponível só no Krakion App.</p>}
        </div>
      </div>
    </Pagina>
  )
}

function CartaoDrive() {
  const [estado, setEstado] = useState(null)
  const [editandoApp, setEditandoApp] = useState(false)
  const [conectando, setConectando] = useState(false)
  const [ocupado, setOcupado] = useState('')
  const [aviso, setAviso] = useState(null) // { tipo: 'ok' | 'erro', texto }
  const [confirmarSaida, setConfirmarSaida] = useState(false)

  const carregar = () => chamar(drive.status).then(setEstado).catch(err => setAviso({ tipo: 'erro', texto: err.message }))
  useEffect(() => { carregar() }, [])

  async function executar(rotulo, fn, sucesso) {
    setOcupado(rotulo)
    setAviso(null)
    try {
      const r = await fn()
      if (sucesso) setAviso({ tipo: 'ok', texto: typeof sucesso === 'function' ? sucesso(r) : sucesso })
    } catch (err) {
      setAviso({ tipo: 'erro', texto: err.message })
    } finally {
      setOcupado('')
      carregar()
    }
  }

  async function conectar() {
    setConectando(true)
    await executar('conectar', () => chamar(drive.conectar), s => `Conectado como ${s.email}. A pasta “Krakion App” está pronta no seu Drive.`)
    setConectando(false)
  }

  if (!estado) return null
  const mostrarFormulario = !estado.appConfigurado || editandoApp

  return (
    <section className="overflow-hidden rounded-xl border border-borda">
      <header className="flex items-center gap-3 border-b border-borda px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-borda text-suave">
          <Icone nome="nuvem" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold">Google Drive</h4>
          <p className="flex items-center gap-1.5 text-xs text-suave">
            <span className={`h-1.5 w-1.5 rounded-full ${estado.conectado ? 'bg-emerald-500' : 'bg-borda'}`} />
            {estado.conectado ? <>Conectado como <span className="font-medium text-texto">{estado.email}</span></>
              : estado.appConfigurado ? 'Não conectado' : 'App do Google ainda não configurado'}
          </p>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        {mostrarFormulario ? (
          <FormularioApp
            clientIdAtual={estado.clientId}
            conectado={estado.conectado}
            onCancelar={estado.appConfigurado ? () => setEditandoApp(false) : null}
            onSalvar={dados => executar('app', async () => { await chamar(drive.configurarApp, dados); setEditandoApp(false) }, 'App do Google salvo. Agora é só conectar.')}
            salvando={ocupado === 'app'}
          />
        ) : estado.conectado ? (
          <>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-suave">Pasta</dt>
              <dd className="flex items-center gap-2">
                Krakion App
                <button type="button" className="text-xs text-acento hover:underline" onClick={() => drive.abrirPasta()}>Abrir no Drive</button>
              </dd>
              <dt className="text-suave">Conectado em</dt>
              <dd>{dataHora(estado.conectadoEm)}</dd>
              <dt className="text-suave">Último uso</dt>
              <dd>{dataHora(estado.ultimoUso)}</dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="botao-primario" disabled={!!ocupado}
                onClick={() => executar('testar', () => chamar(drive.testar), r => `Tudo certo: gravou, leu e apagou um arquivo de teste em ${(r.ms / 1000).toFixed(1)} s.`)}>
                {ocupado === 'testar' ? 'Testando…' : 'Testar conexão'}
              </button>
              <button type="button" className="botao-secundario" disabled={!!ocupado} onClick={() => setConfirmarSaida(true)}>Desconectar</button>
            </div>
          </>
        ) : conectando ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-borda border-t-acento" />
            <span className="flex-1 text-suave">Aguardando a autorização no navegador…</span>
            <button type="button" className="botao-secundario" onClick={() => drive.cancelar()}>Cancelar</button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-suave">
              O navegador abre na tela de login do Google. Ao autorizar, o app cria a pasta <span className="font-medium text-texto">Krakion App</span> no
              seu Drive — e só enxerga o que ele mesmo criou ali, nada mais da sua conta.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="botao-primario" disabled={!!ocupado} onClick={conectar}>Conectar ao Google Drive</button>
              <button type="button" className="text-xs text-suave hover:text-texto" onClick={() => setEditandoApp(true)}>Trocar app do Google</button>
            </div>
          </div>
        )}

        {aviso && (
          <p className={`rounded-lg px-3 py-2 text-sm ${aviso.tipo === 'erro' ? 'bg-perigo/10 text-perigo' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
            {aviso.texto}
          </p>
        )}

        {estado.appConfigurado && !mostrarFormulario && (
          <p className="text-xs text-suave">App do Google: <span className="font-mono">{estado.clientId.slice(0, 12)}…</span></p>
        )}
      </div>

      <Confirmar
        aberto={confirmarSaida}
        titulo="Desconectar o Google Drive?"
        mensagem="A permissão é revogada no Google e a credencial é apagada desta máquina. Os arquivos que já estão na pasta Krakion App continuam no seu Drive."
        rotulo="Desconectar"
        onConfirmar={() => executar('desconectar', () => chamar(drive.desconectar), 'Desconectado.')}
        onFechar={() => setConfirmarSaida(false)}
      />
    </section>
  )
}

function FormularioApp({ clientIdAtual, conectado, onSalvar, onCancelar, salvando }) {
  const [clientId, setClientId] = useState(clientIdAtual || '')
  const [segredo, setSegredo] = useState('')

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSalvar({ clientId, clientSecret: segredo }) }}>
      <p className="text-sm text-suave">
        Configuração única: crie um app do tipo “App para computador” no Google Cloud e cole aqui o ID e o segredo do cliente.
        O passo a passo está em <span className="font-mono text-xs">docs/conexoes-google-drive.md</span>.
      </p>
      <label className="block">
        <span className="rotulo">ID do cliente</span>
        <input className="campo font-mono text-xs" value={clientId} onChange={e => setClientId(e.target.value)}
          placeholder="123456789-abc.apps.googleusercontent.com" required spellCheck={false} />
      </label>
      <label className="block">
        <span className="rotulo">Segredo do cliente</span>
        <input className="campo font-mono text-xs" type="password" value={segredo} onChange={e => setSegredo(e.target.value)}
          placeholder="GOCSPX-…" required autoComplete="new-password" spellCheck={false} />
      </label>
      {conectado && clientId.trim() !== clientIdAtual && (
        <p className="text-xs text-suave">Trocar o app desconecta a conta atual — será preciso conectar de novo.</p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="botao-primario" disabled={salvando || !clientId.trim() || !segredo.trim()}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        {onCancelar && <button type="button" className="botao-secundario" onClick={onCancelar}>Cancelar</button>}
      </div>
    </form>
  )
}
