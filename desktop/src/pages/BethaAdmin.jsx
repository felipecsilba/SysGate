import { useEffect, useState } from 'react'
import BotaoIcone from '../components/BotaoIcone'
import Icone from '../components/Icone'
import Pagina from '../components/Pagina'

const betha = window.krakion?.betha
const ROTULO_ETAPA = { revenda: 'Revenda', entidade: 'Entidade', database: 'Banco de dados', sistema: 'Sistema' }

// Credenciais do agente que renova tokens no Betha Admin. A senha vai para o núcleo do app
// (cifrada pelo Windows) e nunca volta para a tela.
export default function BethaAdmin() {
  const [estado, setEstado] = useState(null) // { configurado, usuario, lembrancas }
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [aviso, setAviso] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = () => betha?.status().then(s => { setEstado(s); setUsuario(s.usuario) })
  useEffect(() => { carregar() }, [])

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      await betha.salvar(usuario, senha)
      setSenha('')
      setAviso('Salvo. A senha fica cifrada pelo Windows nesta máquina.')
      await carregar()
    } catch (err) {
      setAviso(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function remover() {
    await betha.apagar()
    setUsuario('')
    setAviso('Usuário e senha removidos.')
    await carregar()
  }

  const lembrancas = Object.entries(estado?.lembrancas || {})

  return (
    <Pagina titulo="Betha Admin" icone="agente">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg space-y-8 px-6 py-10">
          <div>
            <h3 className="text-lg font-semibold">Agente de renovação de tokens</h3>
            <p className="mt-1 text-sm text-suave">
              Com seu acesso ao Betha Admin, o app emite tokens novos sozinho — na Central de Tokens, use “Renovar no Betha” em um token
              ou “Renovar vencidos”.
            </p>
          </div>

          {!betha ? (
            <p className="text-sm text-suave">Disponível só no Krakion App.</p>
          ) : (
            <form onSubmit={salvar} className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${estado?.configurado ? 'bg-emerald-500' : 'bg-borda'}`} />
                {estado?.configurado ? <>Configurado para <span className="font-medium">{estado.usuario}</span></> : 'Ainda não configurado'}
              </div>
              <label className="block">
                <span className="rotulo">Usuário do Betha Admin</span>
                <input className="campo" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="ex.: felipec.silva" required />
              </label>
              <label className="block">
                <span className="rotulo">Senha</span>
                <input
                  className="campo" type="password" value={senha} onChange={e => setSenha(e.target.value)}
                  placeholder={estado?.configurado ? '•••••••• (salva — preencha só para trocar)' : ''}
                  required={!estado?.configurado} autoComplete="new-password"
                />
              </label>
              {aviso && <p className="text-sm text-suave">{aviso}</p>}
              <div className="flex gap-2">
                <button type="submit" className="botao-primario" disabled={salvando || !usuario.trim()}>{salvando ? 'Salvando…' : 'Salvar'}</button>
                {estado?.configurado && <button type="button" className="botao-secundario" onClick={remover}>Remover</button>}
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-texto/[0.04] px-3 py-2.5 text-xs text-suave">
                <Icone nome="tokens" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                A senha é cifrada pelo Windows e só este usuário, nesta máquina, consegue decifrá-la. Ela não vai para o banco, para o histórico nem para logs.
              </p>
            </form>
          )}

          {lembrancas.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-suave">Escolhas lembradas</h4>
              <ul className="overflow-hidden rounded-xl border border-borda">
                {lembrancas.map(([chave, texto]) => {
                  const [etapa, contexto] = chave.split('|')
                  return (
                    <li key={chave} className="flex items-center gap-3 border-b border-borda px-3 py-2 text-sm last:border-b-0">
                      <span className="w-40 shrink-0 text-xs text-suave">{ROTULO_ETAPA[etapa] || etapa}{contexto ? ` · ${contexto}` : ''}</span>
                      <span className="min-w-0 flex-1 truncate">{texto}</span>
                      <BotaoIcone titulo="Esquecer (o agente volta a perguntar)" icone="lixeira" perigo onClick={async () => { await betha.esquecer(chave); carregar() }} />
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </Pagina>
  )
}
