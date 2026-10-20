import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confirmar from '../../components/Confirmar'
import Icone from '../../components/Icone'
import Pagina from '../../components/Pagina'
import { conexaoPorId } from '../../lib/conexoes'
import LogoConexao from './LogoConexao'
import { chamar, dataHora, drive } from './comum'
import CartaoBackup from './CartaoBackup'

const CONSOLE = 'https://console.cloud.google.com/'

// Tela do Google Drive: passo a passo (criar app → colar credenciais → conectar) enquanto não está conectado;
// depois, os dados da conexão com Testar e Desconectar.
export default function GoogleDrive() {
  const navegar = useNavigate()
  const info = conexaoPorId('google-drive')
  const [estado, setEstado] = useState(null)
  const [trocandoApp, setTrocandoApp] = useState(false)
  const [ocupado, setOcupado] = useState('')
  const [aviso, setAviso] = useState(null) // { tipo: 'ok' | 'erro', texto }
  const [confirmarSaida, setConfirmarSaida] = useState(false)

  const carregar = () => chamar(drive.status).then(setEstado).catch(err => setAviso({ tipo: 'erro', texto: err.message }))
  useEffect(() => { if (drive) carregar() }, [])

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
      await carregar()
    }
  }

  const salvarApp = dados => executar('app', async () => { await chamar(drive.configurarApp, dados); setTrocandoApp(false) }, 'Credenciais salvas. Agora conecte sua conta.')
  const conectar = () => executar('conectar', () => chamar(drive.conectar), s => `Conectado como ${s.email}. A pasta “Krakion App” está pronta no seu Drive.`)

  return (
    <Pagina titulo="Conexões" icone="conexoes">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <button type="button" onClick={() => navegar('/conexoes')} className="flex items-center gap-1 text-sm text-suave hover:text-texto">
            <Icone nome="direita" className="h-3.5 w-3.5 rotate-180" /> Conexões
          </button>

          <div className="mt-5 flex items-center gap-4">
            <LogoConexao id={info.id} nome={info.nome} tamanho="h-12 w-12" />
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-semibold tracking-tight">{info.nome}</h3>
              <p className="text-sm text-suave">{info.descricao}</p>
            </div>
            {estado && <SeloStatus conectado={estado.conectado} />}
          </div>

          {!drive ? (
            <p className="mt-8 text-sm text-suave">Disponível só no Krakion App.</p>
          ) : !estado ? null : (
            <div className="mt-8 space-y-4">
              {aviso && (
                <p className={`rounded-lg px-3 py-2 text-sm ${aviso.tipo === 'erro' ? 'bg-perigo/10 text-perigo' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
                  {aviso.texto}
                </p>
              )}

              {estado.conectado && !trocandoApp ? (
                <>
                  <Conectado
                    estado={estado} ocupado={ocupado}
                    onTestar={() => executar('testar', () => chamar(drive.testar), r => `Tudo certo: gravou, leu e apagou um arquivo de teste em ${r.ms < 1000 ? 'menos de 1 s' : `${(r.ms / 1000).toFixed(1).replace('.', ',')} s`}.`)}
                    onDesconectar={() => setConfirmarSaida(true)}
                    onTrocarApp={() => setTrocandoApp(true)}
                  />
                  <CartaoBackup />
                </>
              ) : (
                <PassoAPasso
                  estado={estado} ocupado={ocupado} trocandoApp={trocandoApp || !estado.appConfigurado}
                  onTrocarApp={() => setTrocandoApp(true)} onCancelarTroca={estado.appConfigurado ? () => setTrocandoApp(false) : null}
                  onSalvarApp={salvarApp} onConectar={conectar}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <Confirmar
        aberto={confirmarSaida}
        titulo="Desconectar o Google Drive?"
        mensagem="A permissão é revogada no Google e a credencial é apagada desta máquina. Os arquivos que já estão na pasta Krakion App continuam no seu Drive."
        rotulo="Desconectar"
        onConfirmar={() => executar('desconectar', () => chamar(drive.desconectar), 'Desconectado.')}
        onFechar={() => setConfirmarSaida(false)}
      />
    </Pagina>
  )
}

function SeloStatus({ conectado }) {
  return conectado ? (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Conectado
    </span>
  ) : (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-borda px-2.5 py-1 text-xs text-suave">
      <span className="h-1.5 w-1.5 rounded-full bg-borda" /> Não conectado
    </span>
  )
}

function Conectado({ estado, ocupado, onTestar, onDesconectar, onTrocarApp }) {
  return (
    <section className="rounded-xl border border-borda">
      <dl className="grid grid-cols-[9rem_1fr] gap-y-2.5 px-5 py-4 text-sm">
        <dt className="text-suave">Conta</dt>
        <dd className="font-medium">{estado.email}</dd>
        <dt className="text-suave">Pasta</dt>
        <dd className="flex items-center gap-2">
          Krakion App
          <button type="button" className="text-xs text-acento hover:underline" onClick={() => drive.abrirPasta()}>Abrir no Drive</button>
        </dd>
        <dt className="text-suave">Conectado em</dt>
        <dd>{dataHora(estado.conectadoEm)}</dd>
        <dt className="text-suave">Último uso</dt>
        <dd>{dataHora(estado.ultimoUso)}</dd>
        <dt className="text-suave">App do Google</dt>
        <dd className="flex items-center gap-2">
          <span className="font-mono text-xs">{estado.clientId.slice(0, 16)}…</span>
          <button type="button" className="text-xs text-suave hover:text-texto" onClick={onTrocarApp}>Trocar</button>
        </dd>
      </dl>
      <div className="flex flex-wrap gap-2 border-t border-borda px-5 py-3">
        <button type="button" className="botao-primario" disabled={!!ocupado} onClick={onTestar}>{ocupado === 'testar' ? 'Testando…' : 'Testar conexão'}</button>
        <button type="button" className="botao-secundario" disabled={!!ocupado} onClick={onDesconectar}>Desconectar</button>
      </div>
      <p className="border-t border-borda px-5 py-3 text-xs text-suave">
        O app só enxerga o que ele mesmo criou na pasta Krakion App. O resto do seu Drive fica invisível para ele.
      </p>
    </section>
  )
}

// Três passos; o atual fica aberto, os feitos mostram ✓
function PassoAPasso({ estado, ocupado, trocandoApp, onTrocarApp, onCancelarTroca, onSalvarApp, onConectar }) {
  const passo2Feito = estado.appConfigurado && !trocandoApp
  return (
    <ol className="space-y-3">
      <Passo numero={1} titulo="Crie o app no Google Cloud" feito={estado.appConfigurado} aberto={!estado.appConfigurado || trocandoApp}
        resumo="Configuração única — uns 10 minutos, sem custo.">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-suave">
          <li>Abra o <a href={CONSOLE} target="_blank" rel="noreferrer" className="text-acento hover:underline">Google Cloud Console</a> com a conta do seu Drive e crie o projeto <b className="text-texto">Krakion App</b>.</li>
          <li>Em <b className="text-texto">APIs e serviços → Biblioteca</b>, ative a <b className="text-texto">Google Drive API</b>.</li>
          <li>Em <b className="text-texto">Google Auth Platform</b>, clique em Começar: público <b className="text-texto">Externo</b>, seu e-mail como contato.</li>
          <li>Em <b className="text-texto">Acesso a dados</b>, adicione o escopo <span className="font-mono text-xs text-texto">.../auth/drive.file</span>.</li>
          <li>Em <b className="text-texto">Público-alvo</b>, clique em <b className="text-texto">Publicar app → Em produção</b>.</li>
          <li>Em <b className="text-texto">Clientes → Criar cliente</b>, escolha <b className="text-texto">App para computador</b> e copie o ID e a chave secreta.</li>
        </ol>
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <Icone nome="alerta" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Não pule o passo 5: com o app em “Teste”, o Google derruba a conexão a cada 7 dias.
        </p>
        <p className="mt-2 text-xs text-suave">Guia completo, com os erros comuns: <span className="font-mono">docs/conexoes-google-drive.md</span></p>
      </Passo>

      <Passo numero={2} titulo="Cole as credenciais" feito={passo2Feito} aberto={trocandoApp}
        resumo={passo2Feito ? <>ID <span className="font-mono">{estado.clientId.slice(0, 16)}…</span> · <button type="button" className="hover:text-texto" onClick={onTrocarApp}>Trocar</button></> : 'ID do cliente e chave secreta do passo anterior.'}>
        <FormularioApp clientIdAtual={estado.clientId} conectado={estado.conectado} salvando={ocupado === 'app'} onSalvar={onSalvarApp} onCancelar={onCancelarTroca} />
      </Passo>

      <Passo numero={3} titulo="Conecte sua conta" feito={false} aberto={passo2Feito}
        resumo="O navegador abre no login do Google; ao autorizar, você volta para cá.">
        {ocupado === 'conectar' ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-borda border-t-acento" />
            <span className="flex-1 text-suave">Aguardando a autorização no navegador…</span>
            <button type="button" className="botao-secundario" onClick={() => drive.cancelar()}>Cancelar</button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-suave">
              Se aparecer “O Google não verificou este app”, clique em <b className="text-texto">Avançado → Acessar Krakion App</b>. O app é o seu.
            </p>
            <button type="button" className="botao-primario" disabled={!!ocupado} onClick={onConectar}>Conectar ao Google Drive</button>
          </div>
        )}
      </Passo>
    </ol>
  )
}

function Passo({ numero, titulo, resumo, feito, aberto, children }) {
  return (
    <li className={`rounded-xl border ${aberto ? 'border-acento/40' : 'border-borda'}`}>
      <div className="flex items-center gap-3 px-5 py-3.5">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          feito ? 'bg-emerald-500 text-white' : aberto ? 'bg-acento text-white' : 'border border-borda text-suave'}`}>
          {feito ? <Icone nome="check" className="h-3.5 w-3.5" /> : numero}
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-semibold ${!feito && !aberto ? 'text-suave' : ''}`}>{titulo}</div>
          {!aberto && <div className="text-xs text-suave">{resumo}</div>}
        </div>
      </div>
      {aberto && <div className="border-t border-borda px-5 py-4">{children}</div>}
    </li>
  )
}

function FormularioApp({ clientIdAtual, conectado, onSalvar, onCancelar, salvando }) {
  const [clientId, setClientId] = useState(clientIdAtual || '')
  const [segredo, setSegredo] = useState('')

  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSalvar({ clientId, clientSecret: segredo }) }}>
      <label className="block">
        <span className="rotulo">ID do cliente</span>
        <input className="campo font-mono text-xs" value={clientId} onChange={e => setClientId(e.target.value)}
          placeholder="123456789-abc.apps.googleusercontent.com" required spellCheck={false} />
      </label>
      <label className="block">
        <span className="rotulo">Chave secreta do cliente</span>
        <input className="campo font-mono text-xs" type="password" value={segredo} onChange={e => setSegredo(e.target.value)}
          placeholder="GOCSPX-…" required autoComplete="new-password" spellCheck={false} />
      </label>
      {conectado && clientId.trim() !== clientIdAtual && (
        <p className="text-xs text-suave">Trocar o app desconecta a conta atual — será preciso conectar de novo.</p>
      )}
      <p className="text-xs text-suave">A chave fica cifrada pelo Windows nesta máquina e não volta para a tela.</p>
      <div className="flex gap-2">
        <button type="submit" className="botao-primario" disabled={salvando || !clientId.trim() || !segredo.trim()}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        {onCancelar && <button type="button" className="botao-secundario" onClick={onCancelar}>Cancelar</button>}
      </div>
    </form>
  )
}
