import { app, BrowserWindow, dialog, ipcMain, nativeTheme, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import * as bancoLocal from './bancoLocal.js'
import * as backendLocal from './backendLocal.js'
import { aguardarUrl } from './aguardarUrl.js'
import * as protocolo from './protocolo.js'
import { fonteDoTema, lerPreferencias, salvarPreferencias } from './preferencias.js'
import { maisForte, vigiar } from './novaVersao.js'
import { hashArquivo } from './schemaHash.js'
import * as credenciaisBetha from './bethaAdmin/credenciais.js'
import { renovarToken } from './bethaAdmin/agente.js'
import * as biblioteca from './biblioteca.js'
import * as catalogoFontes from './catalogoFontes.js'
import * as municipiosDocs from './municipiosDocs.js'

// Dev (npm run dev → abrir.js): interface pelo Vite com hot reload.
// Fora disso (atalho / instalador): interface compilada em dist/.
const DEV = process.env.KRAKION_DEV === '1'
const URL_DEV = 'http://localhost:5174'
const URL_SAUDE = `http://localhost:${backendLocal.PORTA_BACKEND}/api/health`
const ICONE = path.join(import.meta.dirname, '..', 'public', 'favicon.png')

// O nome visível é "Krakion App" (atalho, janela). Este nome interno define a pasta de dados
// (%APPDATA%\Krakion Desktop) — NÃO renomear: o app perderia o banco, a conta e os dados importados.
app.setName('Krakion Desktop')
app.setAppUserModelId('cloud.krakionlabs.desktop') // agrupa na barra de tarefas com nome/ícone próprios
// Pasta de dados alternativa (testes / perfis separados). Padrão: %APPDATA%\Krakion Desktop
if (process.env.KRAKION_DADOS) app.setPath('userData', path.resolve(process.env.KRAKION_DADOS))

// Sem terminal (atalho), os logs vão para <userData>/krakion.log — recriado a cada abertura
if (!DEV) {
  fs.mkdirSync(app.getPath('userData'), { recursive: true })
  const registro = fs.createWriteStream(path.join(app.getPath('userData'), 'krakion.log'), { flags: 'w' })
  for (const nivel of ['log', 'error', 'warn']) {
    console[nivel] = (...args) => registro.write(`${new Date().toISOString()} ${util.format(...args)}\n`)
  }
}

protocolo.registrarEsquema()

// Tema escolhido no app vale desde o primeiro quadro (tela de carregamento inclusive):
// o nativeTheme faz o prefers-color-scheme de todas as páginas seguir a preferência salva.
nativeTheme.themeSource = fonteDoTema(lerPreferencias(app.getPath('userData')).tema)
ipcMain.on('tema:definir', (_e, preferencia) => {
  if (!['sistema', 'claro', 'escuro'].includes(preferencia)) return
  nativeTheme.themeSource = fonteDoTema(preferencia)
  salvarPreferencias(app.getPath('userData'), { tema: preferencia })
})

// Uma instância só: duas abririam o mesmo banco e a mesma porta.
const instanciaUnica = app.requestSingleInstanceLock()
if (!instanciaUnica) {
  app.quit()
}

let janela = null

function criarJanela() {
  janela = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Krakion App',
    icon: ICONE,
    // Sem a barra de título do Windows: a interface desenha os próprios controles
    // (components/ControlesJanela.jsx) e as áreas de arrastar (.arrastar).
    // Transparente para os cantos arredondados (16px) serem desenhados em CSS (.janela):
    // o arredondamento nativo do Windows 11 é fixo em 8px. Custo: sem sombra nativa.
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    // Sem WS_THICKFRAME o Windows não aplica a moldura arredondada de 8px por cima
    // (que deixava um anel opaco entre o recorte dele e o nosso de 16px).
    thickFrame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      plugins: true, // leitor de PDF embutido (documentos dos municípios)
      preload: path.join(import.meta.dirname, 'preload.cjs'),
    },
  })
  const avisarMaximizada = () => janela.webContents.send('janela:maximizada', janela.isMaximized())
  janela.on('maximize', avisarMaximizada)
  janela.on('unmaximize', avisarMaximizada)
  // Rede de segurança: reconfere a cada redimensionamento (snap, arrastar, Win+setas)
  // para os cantos arredondados nunca ficarem fora de sincronia com o estado real.
  janela.on('resize', avisarMaximizada)
  // Links externos abrem no navegador, nunca dentro do app
  janela.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  janela.loadFile(path.join(import.meta.dirname, 'carregando.html'))
}

// Controles da janela (preload.cjs → aqui). Só age na janela de quem enviou.
const janelaDe = evento => BrowserWindow.fromWebContents(evento.sender)
ipcMain.on('janela:minimizar', e => janelaDe(e)?.minimize())
ipcMain.on('janela:alternar-maximizar', e => {
  const j = janelaDe(e)
  if (j) j.isMaximized() ? j.unmaximize() : j.maximize()
})
ipcMain.on('janela:fechar', e => janelaDe(e)?.close())
ipcMain.handle('janela:esta-maximizada', e => janelaDe(e)?.isMaximized() ?? false)

// Nova versão (só no modo atalho; em dev o Vite já atualiza sozinho).
// 'interface' → a tela oferece Recarregar; 'completo' → oferece Reiniciar o app.
const DIST_INDEX = path.join(import.meta.dirname, '..', 'dist', 'index.html')
let avisoPendente = null
let hashInterface = null

function vigiarNovaVersao() {
  hashInterface = hashArquivo(DIST_INDEX)
  const avisar = () => avisoPendente && janela?.webContents.send('app:nova-versao', avisoPendente)
  janela.webContents.on('did-finish-load', avisar) // reapresenta o aviso se a tela recarregar por outro motivo
  vigiar(
    { desktop: path.join(import.meta.dirname, '..'), backendSrc: path.resolve(import.meta.dirname, '../../backend/src') },
    tipo => {
      // Build que regera a mesma interface não é versão nova
      if (tipo === 'interface') {
        try { if (hashArquivo(DIST_INDEX) === hashInterface) return } catch { return } // dist/ no meio do build
      }
      avisoPendente = maisForte(avisoPendente, tipo)
      console.log('[nova-versao]', avisoPendente)
      avisar()
    }
  )
}

ipcMain.on('app:recarregar', () => {
  try { hashInterface = hashArquivo(DIST_INDEX) } catch {}
  avisoPendente = null
  janela?.webContents.reload()
})
ipcMain.on('app:reiniciar', () => {
  app.relaunch() // reabre com os mesmos argumentos; o before-quit desliga backend e banco antes
  app.quit()
})

// Agente do Betha Admin. A senha decifrada nunca sai deste processo; a tela recebe só o resultado.
const dadosApp = () => app.getPath('userData')
ipcMain.handle('betha:status', () => credenciaisBetha.status(dadosApp()))
ipcMain.handle('betha:salvar', (_e, usuario, senha) => credenciaisBetha.salvar(dadosApp(), usuario, senha))
ipcMain.handle('betha:apagar', () => credenciaisBetha.apagar(dadosApp()))
ipcMain.handle('betha:esquecer', (_e, chave) => credenciaisBetha.esquecer(dadosApp(), chave))
// Biblioteca das Extensões: lê a pasta de scripts/fórmulas/relatórios (somente leitura).
// A tela só manda ids relativos; resolverDentro() impede sair da pasta.
const pastaBiblioteca = () => lerPreferencias(dadosApp()).bibliotecaPasta || biblioteca.PASTA_PADRAO
ipcMain.handle('biblioteca:indice', () => biblioteca.indexar(pastaBiblioteca()))
ipcMain.handle('biblioteca:ler', async (_e, id) => {
  try { return await biblioteca.lerItem(pastaBiblioteca(), id) } catch (err) { return { erro: err.message } }
})
ipcMain.handle('biblioteca:buscar', (_e, ids, termo) => biblioteca.buscarConteudo(pastaBiblioteca(), Array.isArray(ids) ? ids : [], termo))
ipcMain.handle('biblioteca:mostrar', (_e, id) => {
  try { shell.showItemInFolder(biblioteca.resolverDentro(pastaBiblioteca(), id)) } catch { /* id inválido: ignora */ }
})
// Gerador de Extensões: catálogo de fontes BFC lido de <biblioteca>/FontesDeDados (catalogo_v2 + mapa REST→BFC)
ipcMain.handle('gerador:fontes', () => {
  try { return catalogoFontes.listarFontes(pastaBiblioteca()) } catch (err) { return { existe: false, fontes: [], erro: err.message } }
})
ipcMain.handle('gerador:fonte', (_e, chave) => {
  try { return catalogoFontes.detalheFonte(pastaBiblioteca(), String(chave)) } catch { return null }
})
// Municípios: legislação e documentos em <biblioteca>/Municipios/<município>/Legislacao (escrita só ali)
const comErro = fn => async (...args) => {
  try { return { ok: true, dados: await fn(...args) } } catch (err) { return { ok: false, erro: err.message } }
}
ipcMain.handle('municipios:listar', comErro(() => municipiosDocs.listarMunicipios(pastaBiblioteca())))
ipcMain.handle('municipios:criar', comErro((_e, nome) => municipiosDocs.criarMunicipio(pastaBiblioteca(), nome)))
// Remover da lista = Legislacao (ou a pasta só dela) para a Lixeira; metadados ficam
ipcMain.handle('municipios:remover', comErro(async (_e, pasta) => {
  for (const alvo of municipiosDocs.alvosParaRemover(pastaBiblioteca(), pasta)) await shell.trashItem(alvo)
}))
ipcMain.handle('municipios:documentos', comErro((_e, pasta) => municipiosDocs.listarDocumentos(pastaBiblioteca(), pasta)))
ipcMain.handle('municipios:anexar', comErro(async (e, pasta, tipo, meta, caminhos) => {
  let origens = Array.isArray(caminhos) ? caminhos.filter(c => typeof c === 'string' && fs.existsSync(c)) : []
  if (!origens.length) {
    const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { title: 'Anexar documentos', properties: ['openFile', 'multiSelections'] })
    if (r.canceled) return []
    origens = r.filePaths
  }
  return municipiosDocs.anexar(pastaBiblioteca(), pasta, tipo, origens, meta || {})
}))
ipcMain.handle('municipios:ler-texto', comErro((_e, id) => municipiosDocs.lerTexto(pastaBiblioteca(), id)))
ipcMain.handle('municipios:salvar-texto', comErro((_e, dados) => municipiosDocs.salvarTexto(pastaBiblioteca(), dados || {})))
ipcMain.handle('municipios:renomear', comErro((_e, id, meta) => municipiosDocs.renomear(pastaBiblioteca(), id, meta || {})))
// Excluir manda para a Lixeira do Windows (dá para recuperar)
ipcMain.handle('municipios:excluir', comErro((_e, id) => shell.trashItem(municipiosDocs.resolverDoc(pastaBiblioteca(), id))))
ipcMain.handle('municipios:mostrar', comErro((_e, id) => shell.showItemInFolder(municipiosDocs.resolverDoc(pastaBiblioteca(), id))))
ipcMain.handle('municipios:abrir', comErro((_e, id) => shell.openPath(municipiosDocs.resolverDoc(pastaBiblioteca(), id))))

ipcMain.handle('biblioteca:escolher-pasta', async e => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), {
    title: 'Pasta da biblioteca (Scripts, Formulas, Relatorios)', defaultPath: pastaBiblioteca(), properties: ['openDirectory'],
  })
  if (r.canceled || !r.filePaths[0]) return null
  salvarPreferencias(dadosApp(), { bibliotecaPasta: r.filePaths[0] })
  return biblioteca.indexar(r.filePaths[0])
})

let filaBetha = Promise.resolve() // uma renovação por vez — nada de várias janelas no Betha ao mesmo tempo
ipcMain.handle('betha:renovar', (e, pedido) => {
  const executar = async () => {
    // Registro da renovação no krakion.log — sem senha e sem token
    const rotulo = `${pedido?.municipio} × ${pedido?.sistema}`
    console.log('[betha] renovar', rotulo, '| escolhas manuais:', Object.keys(pedido?.escolhasManuais || {}).join(',') || '-')
    try {
      const r = await renovarToken({
        userData: dadosApp(), ...pedido,
        onPasso: texto => {
          console.log('[betha]  ·', texto)
          if (!e.sender.isDestroyed()) e.sender.send('betha:passo', texto)
        },
      })
      console.log('[betha] resultado', rotulo, '→', r.precisaEscolher ? `pergunta: ${r.precisaEscolher.rotulo} (${r.precisaEscolher.opcoes.length} opções)` : `token emitido, ${r.dias} dias`)
      return r.precisaEscolher ? r : { ok: true, ...r }
    } catch (err) {
      console.error('[betha]', err.amigavel ? err.message : err) // nunca loga senha/token: as mensagens não os contêm
      return { erro: err.amigavel ? err.message : 'Falha inesperada no agente do Betha Admin. Veja o krakion.log.' }
    }
  }
  const resultado = filaBetha.then(executar)
  filaBetha = resultado.catch(() => {})
  return resultado
})

function status(texto) {
  janela?.webContents.executeJavaScript(`definirStatus(${JSON.stringify(texto)})`).catch(() => {})
}

function erro(texto) {
  janela?.webContents.executeJavaScript(`mostrarErro(${JSON.stringify(texto)})`).catch(() => {})
}

async function iniciar() {
  criarJanela()
  protocolo.servirDocumentos(id => municipiosDocs.resolverDoc(pastaBiblioteca(), id))
  await new Promise(r => janela.webContents.once('did-finish-load', r))
  try {
    const credenciais = await bancoLocal.iniciar(app.getPath('userData'), status)

    status('Iniciando serviços…')
    backendLocal.iniciar(credenciais)
    if (!(await aguardarUrl(URL_SAUDE, { timeoutMs: 30000 }))) {
      throw new Error(`O backend local não respondeu em 30 s. Detalhes em ${DEV ? 'terminal' : 'krakion.log'}.`)
    }

    if (DEV) {
      status('Aguardando a interface (Vite)…')
      if (!(await aguardarUrl(URL_DEV, { timeoutMs: 30000 }))) {
        throw new Error('O Vite não respondeu em http://localhost:5174.')
      }
      await janela.loadURL(URL_DEV)
    } else {
      protocolo.servir(backendLocal.PORTA_BACKEND)
      await janela.loadURL(`${protocolo.ORIGEM}/index.html`)
      vigiarNovaVersao()
    }
  } catch (e) {
    console.error('[main]', e)
    erro(`${e.message}\n\nDados do app: ${app.getPath('userData')}`)
  }
}

app.on('second-instance', () => {
  if (janela) {
    if (janela.isMinimized()) janela.restore()
    janela.focus()
  }
})

if (instanciaUnica) app.whenReady().then(iniciar)

app.on('window-all-closed', () => app.quit())

// Desliga backend e banco antes de sair (nessa ordem).
let encerrando = false
app.on('before-quit', async evento => {
  if (encerrando) return
  encerrando = true
  evento.preventDefault()
  try {
    await backendLocal.parar()
    await bancoLocal.parar()
  } catch (e) {
    console.error('[main] erro ao encerrar', e)
  }
  app.exit(0)
})
