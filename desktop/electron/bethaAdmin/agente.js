import { BrowserWindow } from 'electron'
import { chaveLembranca, escolherOpcao } from './escolha.js'
import { lembranca, lembrar, obter } from './credenciais.js'

// Agente que emite um token novo no Betha Admin (cad_libconversao_usuario.faces, JSF/RichFaces).
// Uma janela escondida faz o que o Felipe faz na tela — o navegador cuida do ViewState/AJAX do JSF.
// Fluxo capturado em 2026-10-18: revenda → entidade → banco de dados → sistema → senha → Emitir Token.

const BASE = () => (process.env.KRAKION_BETHA_ADMIN_URL || 'https://admin.betha.com.br').replace(/\/+$/, '')
const ETAPAS = [
  { etapa: 'revenda', id: 'mainForm:iRevendas', rotulo: 'revenda' },
  { etapa: 'entidade', id: 'mainForm:iEntidades', rotulo: 'entidade' },
  { etapa: 'database', id: 'mainForm:iDatabases', rotulo: 'banco de dados' },
  { etapa: 'sistema', id: 'mainForm:iSistemas', rotulo: 'sistema' },
]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const espera = ms => new Promise(r => setTimeout(r, ms))
const falha = mensagem => Object.assign(new Error(mensagem), { amigavel: true })
const q = id => `document.getElementById(${JSON.stringify(id)})`

// Mensagens que a página mostra (RichFaces/JSF) — para explicar falhas sem adivinhar
const LER_MENSAGENS = `[...document.querySelectorAll('[class*="message" i], [class*="msg" i], [class*="erro" i], [class*="error" i]')]
  .map(e => e.innerText.trim()).filter(t => t && t.length < 300).filter((t, i, a) => a.indexOf(t) === i).slice(0, 5)`

export async function renovarToken({ userData, municipio, sistema, mostrar = false, escolhasManuais = {}, onPasso = () => {} }) {
  const cred = obter(userData)
  if (!cred) throw falha('Configure seu usuário e senha do Betha Admin em Configurações → Betha Admin.')
  const contexto = { municipio, sistema }

  // Partição só em memória: a sessão do Betha vale enquanto o app está aberto e não fica gravada em disco
  const janela = new BrowserWindow({
    show: !!mostrar, width: 1200, height: 850, title: 'Betha Admin — Krakion App',
    webPreferences: { partition: 'betha-admin', contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  // Páginas JSF antigas redirecionam por script logo após carregar; um comando executado no meio
  // da troca falha com "Script failed to execute". Leitura: espera a página assentar e tenta de novo.
  // Ação (preencher/clicar/enviar): NUNCA repete — repetir um envio refaria o login/emissão.
  // Ações agendam o clique com setTimeout para o comando terminar antes de a página navegar.
  const js = async (codigo, { repetir = true } = {}) => {
    for (let tentativa = 1; ; tentativa++) {
      try {
        if (janela.webContents.isLoading()) await new Promise(r => janela.webContents.once('did-stop-loading', r))
        return await janela.webContents.executeJavaScript(codigo, true)
      } catch (err) {
        if (!repetir || tentativa >= 4) throw err
        await espera(700)
      }
    }
  }
  // O login real tem campos-isca ESCONDIDOS (texto e senha sem nome) antes dos de verdade
  // (login:iUsuarios, login:senha, login:btAcessar) — só conta campo visível
  const TEM_SENHA_VISIVEL = `[...document.querySelectorAll('input[type=password]')].some(i => i.offsetParent !== null)`
  // Diagnóstico sem valores: quais campos a página tem (tipo, nome, id) — vai para o krakion.log
  const descreverPagina = () => js(`({
    url: location.origin + location.pathname,
    frames: document.querySelectorAll('iframe, frame').length,
    campos: [...document.querySelectorAll('input, select, button')].slice(0, 40).map(e =>
      e.tagName.toLowerCase() + '[type=' + (e.type || '') + '][name=' + (e.name || '') + '][id=' + (e.id || '') + ']' + (e.offsetParent === null ? '(oculto)' : '')),
  })`).catch(e => ({ erro: e.message }))
  const esperar = async (condicao, mensagem, ms = 25000) => {
    const limite = Date.now() + ms
    while (Date.now() < limite) {
      try { if (await js(condicao)) return } catch { /* página trocando */ }
      await espera(300)
    }
    throw falha(mensagem)
  }

  let passo = 'abrir o Betha Admin'
  try {
    onPasso('Abrindo o Betha Admin…')
    await janela.loadURL(`${BASE()}/cad_libconversao_usuario.faces`)

    // Sem sessão o Betha manda para o login (às vezes por script, depois de carregar):
    // espera aparecer a tela de login OU a de emissão antes de decidir
    await esperar(`${TEM_SENHA_VISIVEL} || !!${q('mainForm:iRevendas')}`,
      'A página do Betha Admin não carregou (nem login, nem a tela de emissão).', 30000)
    if (await js(`${TEM_SENHA_VISIVEL} && !${q('mainForm:iRevendas')}`)) {
      passo = 'login'
      onPasso('Entrando com seu usuário…')
      // Devolve um código em vez de lançar dentro da página (lá o erro vira um genérico "Script failed")
      const r = await js(`(() => {
        const visivel = i => i.offsetParent !== null
        const senha = document.getElementById('login:senha') || [...document.querySelectorAll('input[type=password]')].find(visivel)
        if (!senha) return 'sem-senha'
        const escopo = senha.form || document
        const campos = [...escopo.querySelectorAll('input')]
        const texto = i => ['text', 'email', 'tel', ''].includes(i.type) && i !== senha && visivel(i)
        const usuario = document.getElementById('login:iUsuarios')
          || campos.find(i => texto(i) && /usu|login|user|cpf|email/i.test((i.name || '') + ' ' + (i.id || '')))
          || campos.find(texto)
        if (!usuario) return 'sem-usuario'
        const botao = document.getElementById('login:btAcessar')
          || [...escopo.querySelectorAll('[type=submit], button, input[type=button], input[type=image]')].find(visivel)
        if (!botao && !senha.form) return 'sem-botao'
        const preencher = (el, v) => { el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })) }
        preencher(usuario, ${JSON.stringify(cred.usuario)})
        preencher(senha, ${JSON.stringify(cred.senha)})
        // Envia depois que este comando terminar — a navegação não interrompe a resposta
        setTimeout(() => (botao ? botao.click() : senha.form.submit()), 50)
        return 'ok'
      })()`, { repetir: false })
      if (r !== 'ok') {
        console.error('[betha] login: estrutura da página', JSON.stringify(await descreverPagina()))
        throw falha(`Não reconheci a tela de login do Betha Admin (${r}). Os campos da página foram registrados no krakion.log — me mande para eu ajustar.`)
      }
      try {
        await espera(800) // deixa o envio começar antes de conferir
        await esperar(`!(${TEM_SENHA_VISIVEL}) || location.href.indexOf('login') === -1`, 'login', 20000)
      } catch {
        const msgs = await js(LER_MENSAGENS).catch(() => [])
        throw falha(`O Betha Admin não aceitou o login${msgs.length ? `: ${msgs.join(' · ')}` : '. Confira usuário e senha em Configurações → Betha Admin.'}`)
      }
      passo = 'abrir a tela de emissão de token'
      await janela.loadURL(`${BASE()}/cad_libconversao_usuario.faces`)
    }
    passo = 'tela de emissão de token'

    await esperar(`!!${q('mainForm:iRevendas')}`, 'A tela de emissão de token não abriu no Betha Admin.')

    for (const { etapa, id, rotulo } of ETAPAS) {
      passo = `selecionar ${rotulo}`
      onPasso(`Selecionando ${rotulo}…`)
      await esperar(`${q(id)} && ${q(id)}.options.length > 1`, `A lista de ${rotulo} não carregou no Betha Admin.`)
      const opcoes = await js(`[...${q(id)}.options].map(o => ({ valor: o.value, texto: o.text.trim() }))`)
      const chave = chaveLembranca(etapa, contexto)
      const manual = escolhasManuais[etapa]
      const r = escolherOpcao(etapa, opcoes, contexto, manual ?? lembranca(userData, chave))
      if (r.semOpcoes) throw falha(`Seu usuário não tem nenhuma opção de ${rotulo} no Betha Admin.`)
      if (r.precisaEscolher) return { precisaEscolher: { etapa, rotulo, opcoes: r.opcoes } }
      if (manual) lembrar(userData, chave, r.texto)

      if ((await js(`${q(id)}.value`)) !== r.valor) {
        await js(`(() => { const s = ${q(id)}; s.value = ${JSON.stringify(r.valor)}; setTimeout(() => s.dispatchEvent(new Event('change', { bubbles: true })), 0); return true })()`, { repetir: false })
        // O select seguinte só ganha opções quando o AJAX volta; no último, espera o formulário se assentar
        await espera(etapa === 'sistema' ? 1500 : 400)
      }
    }

    passo = 'emitir o token'
    const tokenAntes = await js(`(${q('mainForm:token')} || {}).value || ''`)
    onPasso('Emitindo o token…')
    await esperar(`!!${q('mainForm:senha')} && !!${q('mainForm:btEmitir')}`, 'O botão Emitir Token não apareceu.')
    const mensagensAntes = JSON.stringify(await js(LER_MENSAGENS).catch(() => []))
    await js(`(() => {
      const s = ${q('mainForm:senha')}
      s.value = ${JSON.stringify(cred.senha)}
      s.dispatchEvent(new Event('change', { bubbles: true }))
      const botao = ${q('mainForm:btEmitir')}
      setTimeout(() => botao.click(), 0)
      return true
    })()`, { repetir: false })

    try {
      // Para no sucesso ou em qualquer mensagem nova (ex.: "Senha inválida") — sem esperar o tempo todo
      await esperar(`/gravados com sucesso/i.test(document.body.innerText) || JSON.stringify(${LER_MENSAGENS}) !== ${JSON.stringify(mensagensAntes)}`, 'emissao', 30000)
    } catch { /* cai na conferência abaixo */ }

    const resultado = await js(`({
      sucesso: /gravados com sucesso/i.test(document.body.innerText),
      token: (${q('mainForm:token')} || {}).value || '',
      dias: Number((${q('mainForm:diasValidade')} || {}).value) || 15,
      mensagens: ${LER_MENSAGENS},
    })`)
    if (!resultado.sucesso || !UUID.test(resultado.token) || resultado.token === tokenAntes) {
      throw falha(`O Betha Admin não emitiu o token${resultado.mensagens.length ? `: ${resultado.mensagens.join(' · ')}` : '.'}`)
    }
    onPasso('Token emitido')
    return { token: resultado.token, dias: resultado.dias }
  } catch (err) {
    if (err.amigavel) throw err
    console.error('[betha] parou em', passo, '-', err.message, '- página:', JSON.stringify(await descreverPagina()))
    throw falha(`O agente parou no passo "${passo}" (${err.message}). Os detalhes da página foram registrados no krakion.log.`)
  } finally {
    janela.destroy()
  }
}
