import fs from 'node:fs'

// API do Drive (v3) — só o que o app usa. O acesso vem de obterAcesso(); num 401 pede um novo
// ({ forcar: true }) e repete uma vez. Com o escopo drive.file, tudo aqui enxerga só o que o app criou.

export const TAMANHO_PARTE = 8 * 1024 * 1024 // múltiplo de 256 KB, como o Drive exige
const PASTA = 'application/vnd.google-apps.folder'

function falha(mensagem, status) {
  const err = new Error(mensagem)
  err.amigavel = true
  err.status = status
  return err
}

async function mensagemDeErro(resp) {
  const dados = await resp.json().catch(() => null)
  return dados?.error?.message || `HTTP ${resp.status}`
}

const aspas = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

export function criarCliente({ api, obterAcesso, fetch: f = fetch }) {
  // url absoluta (sessão de upload) ou caminho relativo à api
  async function requisitar(url, opcoes = {}, { tentarDeNovo = true } = {}) {
    const acesso = await obterAcesso()
    const resp = await f(url.startsWith('http') ? url : `${api}${url}`, {
      ...opcoes,
      headers: { ...(opcoes.headers || {}), authorization: `Bearer ${acesso}` },
    })
    if (resp.status === 401 && tentarDeNovo) {
      await obterAcesso({ forcar: true })
      return requisitar(url, opcoes, { tentarDeNovo: false })
    }
    return resp
  }

  async function exigirOk(resp, contexto) {
    if (resp.ok) return resp
    throw falha(`${contexto}: ${await mensagemDeErro(resp)}`, resp.status)
  }

  async function sobre() {
    const resp = await exigirOk(await requisitar('/drive/v3/about?fields=user(emailAddress,displayName)'), 'Drive (conta)')
    const { user } = await resp.json()
    return { email: user?.emailAddress || '', nome: user?.displayName || '' }
  }

  async function buscarPasta(nome, paiId) {
    const q = [`name = '${aspas(nome)}'`, `mimeType = '${PASTA}'`, 'trashed = false', paiId && `'${paiId}' in parents`].filter(Boolean).join(' and ')
    const resp = await exigirOk(await requisitar(`/drive/v3/files?${new URLSearchParams({ q, fields: 'files(id,name)', spaces: 'drive' })}`), 'Drive (busca de pasta)')
    return (await resp.json()).files?.[0]?.id || null
  }

  async function garantirPasta(nome, paiId) {
    const existente = await buscarPasta(nome, paiId)
    if (existente) return existente
    const resp = await exigirOk(await requisitar('/drive/v3/files?fields=id,name', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: nome, mimeType: PASTA, ...(paiId ? { parents: [paiId] } : {}) }),
    }), 'Drive (criar pasta)')
    return (await resp.json()).id
  }

  // conteudo (string/Buffer) ou caminho de arquivo no disco — o arquivo é lido em partes, nunca inteiro na memória
  async function enviar({ pastaId, nome, conteudo, caminho, tipo = 'application/octet-stream', aoProgresso }) {
    const buffer = conteudo != null ? Buffer.from(conteudo) : null
    const total = buffer ? buffer.length : fs.statSync(caminho).size

    const inicio = await exigirOk(await requisitar('/upload/drive/v3/files?uploadType=resumable&fields=id,name,size', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=UTF-8', 'x-upload-content-type': tipo, 'x-upload-content-length': String(total) },
      body: JSON.stringify({ name: nome, ...(pastaId ? { parents: [pastaId] } : {}) }),
    }), 'Drive (iniciar envio)')
    const sessao = inicio.headers.get('location')
    if (!sessao) throw falha('Drive não devolveu a sessão de envio.')

    const arquivo = buffer ? null : await fs.promises.open(caminho, 'r')
    try {
      let enviado = 0
      do {
        const tamanho = Math.min(TAMANHO_PARTE, total - enviado)
        let parte
        if (buffer) parte = buffer.subarray(enviado, enviado + tamanho)
        else {
          parte = Buffer.alloc(tamanho)
          await arquivo.read(parte, 0, tamanho, enviado)
        }
        const fim = enviado + tamanho - 1
        const resp = await requisitar(sessao, {
          method: 'PUT',
          headers: { 'content-range': total === 0 ? 'bytes */0' : `bytes ${enviado}-${fim}/${total}` },
          body: parte,
        })
        enviado += tamanho
        aoProgresso?.({ enviado, total })
        if (resp.status === 308) continue
        await exigirOk(resp, 'Drive (enviar)')
        const r = await resp.json()
        return { id: r.id, nome: r.name, tamanho: Number(r.size ?? total) }
      } while (enviado < total)
      throw falha('Drive não confirmou o fim do envio.')
    } finally {
      await arquivo?.close()
    }
  }

  // Arquivos (não apagados) dentro de uma pasta, seguindo a paginação
  async function listar(pastaId) {
    const arquivos = []
    let pagina
    do {
      const params = new URLSearchParams({ q: `'${pastaId}' in parents and trashed = false`, fields: 'nextPageToken,files(id,name,size)', pageSize: '1000', spaces: 'drive' })
      if (pagina) params.set('pageToken', pagina)
      const resp = await exigirOk(await requisitar(`/drive/v3/files?${params}`), 'Drive (listar)')
      const dados = await resp.json()
      arquivos.push(...(dados.files || []).map(f => ({ id: f.id, name: f.name, tamanho: Number(f.size ?? 0) })))
      pagina = dados.nextPageToken
    } while (pagina)
    return arquivos
  }

  async function baixarTexto(id) {
    const resp = await exigirOk(await requisitar(`/drive/v3/files/${encodeURIComponent(id)}?alt=media`), 'Drive (baixar)')
    return resp.text()
  }

  async function excluir(id) {
    await exigirOk(await requisitar(`/drive/v3/files/${encodeURIComponent(id)}`, { method: 'DELETE' }), 'Drive (excluir)')
  }

  return { sobre, garantirPasta, enviar, listar, baixarTexto, excluir }
}
