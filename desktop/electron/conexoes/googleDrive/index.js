import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { enderecos, gerarPkce, urlAutorizacao, aguardarRetorno, trocarCodigo, renovarAcesso, revogar } from './oauth.js'
import { criarCliente } from './cliente.js'

// Conexão com o Google Drive. Guarda em <userData>/google-drive.json: o app do Google (client ID + segredo cifrado),
// o refresh token cifrado, a conta e a pasta. O acesso (curto) fica só na memória. Segredo e tokens nunca saem
// do processo main — status() devolve só o que a tela pode ver.
// cifra: { disponivel, cifrar, decifrar } — safeStorage no main; injetada para os testes rodarem no Node.

export const NOME_PASTA = 'Krakion App'

function falha(mensagem) {
  const err = new Error(mensagem)
  err.amigavel = true
  return err
}

export function criarConexaoDrive({ userData, cifra, base, fetch: f = fetch, abrirNavegador }) {
  const arquivo = path.join(userData, 'google-drive.json')
  const end = enderecos(base)
  let acesso = null // { accessToken, expiraEm }
  let emAndamento = null // { cancelar }

  const ler = () => { try { return JSON.parse(fs.readFileSync(arquivo, 'utf8')) } catch { return {} } }
  const gravar = d => { fs.mkdirSync(userData, { recursive: true }); fs.writeFileSync(arquivo, JSON.stringify(d, null, 2)) }
  const atualizar = mudancas => gravar({ ...ler(), ...mudancas })

  function exigirCifra() {
    if (!cifra.disponivel()) throw falha('A cifragem do Windows não está disponível nesta máquina — nada foi guardado.')
  }

  function limparConexao(d) {
    for (const k of ['refreshTokenCifrado', 'email', 'pastaId', 'conectadoEm', 'ultimoUso']) delete d[k]
    acesso = null
    return d
  }

  function status() {
    const d = ler()
    const appConfigurado = !!(d.clientId && d.clientSecretCifrado)
    const conectado = appConfigurado && !!d.refreshTokenCifrado
    if (!appConfigurado) return { appConfigurado, conectado: false }
    return {
      appConfigurado, conectado,
      clientId: d.clientId,
      ...(conectado ? {
        email: d.email || '',
        pastaId: d.pastaId || null,
        pastaUrl: d.pastaId ? `https://drive.google.com/drive/folders/${d.pastaId}` : null,
        conectadoEm: d.conectadoEm || null,
        ultimoUso: d.ultimoUso || null,
      } : {}),
    }
  }

  function configurarApp({ clientId, clientSecret }) {
    const id = String(clientId || '').trim()
    const segredo = String(clientSecret || '').trim()
    if (!id) throw falha('Informe o ID do cliente do app do Google.')
    if (!segredo) throw falha('Informe o segredo do cliente do app do Google.')
    exigirCifra()
    const d = ler()
    if (d.clientId && d.clientId !== id) limparConexao(d) // refresh token pertence ao app antigo
    gravar({ ...d, clientId: id, clientSecretCifrado: cifra.cifrar(segredo) })
  }

  async function removerApp() {
    await desconectar()
    gravar({})
  }

  function credenciaisApp() {
    const d = ler()
    if (!d.clientId || !d.clientSecretCifrado) throw falha('Configure antes o app do Google (ID do cliente e segredo).')
    return { clientId: d.clientId, clientSecret: cifra.decifrar(d.clientSecretCifrado) }
  }

  // Acesso válido, renovado pelo refresh token quando falta menos de 1 minuto (ou quando forçado após um 401)
  async function obterAcesso({ forcar = false } = {}) {
    if (!forcar && acesso && acesso.expiraEm - Date.now() > 60_000) return acesso.accessToken
    const d = ler()
    if (!d.refreshTokenCifrado) throw falha('Google Drive não está conectado.')
    try {
      acesso = await renovarAcesso({ token: end.token, ...credenciaisApp(), refreshToken: cifra.decifrar(d.refreshTokenCifrado), fetch: f })
      return acesso.accessToken
    } catch (err) {
      if (err.codigo === 'invalid_grant') {
        gravar(limparConexao(ler()))
        throw falha('A permissão do Google Drive foi revogada ou expirou. Conecte de novo.')
      }
      throw err
    }
  }

  const cliente = () => criarCliente({ api: end.api, obterAcesso, fetch: f })

  async function conectar({ tempoLimite } = {}) {
    if (emAndamento) throw falha('Já existe uma conexão em andamento — termine no navegador ou cancele.')
    exigirCifra()
    const app = credenciaisApp()
    const { verificador, desafio } = gerarPkce()
    const estado = crypto.randomBytes(16).toString('hex')
    const retorno = await aguardarRetorno({ estado, tempoLimite })
    emAndamento = retorno
    try {
      await abrirNavegador(urlAutorizacao({ autorizacao: end.autorizacao, clientId: app.clientId, redirectUri: retorno.redirectUri, desafio, estado }))
      const codigo = await retorno.codigo
      const t = await trocarCodigo({ token: end.token, ...app, codigo, verificador, redirectUri: retorno.redirectUri, fetch: f })
      if (!t.refreshToken) throw falha('O Google não devolveu a permissão permanente (refresh token). Tente de novo.')
      acesso = { accessToken: t.accessToken, expiraEm: t.expiraEm }
      atualizar({ refreshTokenCifrado: cifra.cifrar(t.refreshToken) })
      const c = cliente()
      const { email } = await c.sobre()
      const pastaId = await c.garantirPasta(NOME_PASTA)
      const agora = new Date().toISOString()
      atualizar({ email, pastaId, conectadoEm: agora, ultimoUso: agora })
      return status()
    } catch (err) {
      if (ler().refreshTokenCifrado && !ler().conectadoEm) gravar(limparConexao(ler())) // não deixa conexão pela metade
      throw err
    } finally {
      retorno.cancelar() // fecha o servidor de retorno se ainda estiver aberto (no-op se já terminou)
      emAndamento = null
    }
  }

  function cancelarConexao() {
    emAndamento?.cancelar()
  }

  // Garante a pasta (recria se foi apagada no Drive) e devolve o id
  async function pastaApp() {
    const pastaId = await cliente().garantirPasta(NOME_PASTA)
    if (pastaId !== ler().pastaId) atualizar({ pastaId })
    return pastaId
  }

  async function testar() {
    const inicio = Date.now()
    const c = cliente()
    const pastaId = await pastaApp()
    const conteudo = `Teste do Krakion App — ${new Date().toISOString()}`
    const enviado = await c.enviar({ pastaId, nome: `krakion-teste-${inicio}.txt`, conteudo, tipo: 'text/plain' })
    try {
      if (await c.baixarTexto(enviado.id) !== conteudo) throw falha('O arquivo de teste voltou diferente do enviado.')
    } finally {
      await c.excluir(enviado.id).catch(() => {})
    }
    atualizar({ ultimoUso: new Date().toISOString() })
    return { ok: true, ms: Date.now() - inicio }
  }

  async function desconectar() {
    const d = ler()
    if (d.refreshTokenCifrado) {
      await revogar({ revogacao: end.revogacao, token: cifra.decifrar(d.refreshTokenCifrado), fetch: f })
    }
    gravar(limparConexao(d))
  }

  return { status, configurarApp, removerApp, conectar, cancelarConexao, testar, desconectar, cliente, pastaApp }
}
