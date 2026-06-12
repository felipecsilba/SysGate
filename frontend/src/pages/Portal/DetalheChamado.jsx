import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import usePortalAuthStore from '../../stores/portalAuthStore'
import { portalChamadosApi } from '../../lib/portalApi'
import {
  statusPortal, formatDataHora, formatTamanho,
  MIME_PERMITIDOS, MAX_ANEXO_MB, validarArquivo, arquivoParaBase64,
} from './constants'

function Avatar({ nome, externo }) {
  const iniciais = (nome || '?')
    .split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  return (
    <span
      className={`w-8 h-8 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
        externo ? 'bg-sysgate-600 text-white' : 'bg-violet-100 text-violet-700'
      }`}
    >
      {iniciais}
    </span>
  )
}

// Detalhe do chamado no portal — timeline pública (comentários internos nunca chegam aqui)
export default function DetalheChamado() {
  const { id } = useParams()
  const solicitante = usePortalAuthStore((s) => s.solicitante)

  const [chamado, setChamado] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [resposta, setResposta] = useState('')
  const [arquivosResposta, setArquivosResposta] = useState([])
  const [erroResposta, setErroResposta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [baixando, setBaixando] = useState(null) // id do anexo em download

  const carregar = useCallback(() => {
    setCarregando(true)
    setErro('')
    portalChamadosApi
      .obter(id)
      .then(setChamado)
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false))
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  const baixarAnexo = async (anexo) => {
    setBaixando(anexo.id)
    try {
      const blob = await portalChamadosApi.baixarAnexo(anexo.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = anexo.nomeArquivo
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setErro(err.message)
    } finally {
      setBaixando(null)
    }
  }

  const onArquivosResposta = (e) => {
    setErroResposta('')
    const novos = Array.from(e.target.files || [])
    for (const f of novos) {
      const problema = validarArquivo(f)
      if (problema) { setErroResposta(problema); e.target.value = ''; return }
    }
    setArquivosResposta((atual) => [...atual, ...novos])
    e.target.value = ''
  }

  const enviarResposta = async (e) => {
    e.preventDefault()
    setErroResposta('')
    if (!resposta.trim()) {
      setErroResposta('Escreva sua mensagem antes de enviar.')
      return
    }
    setEnviando(true)
    try {
      // Anexos da resposta sobem antes e são vinculados via pendingAnexoIds
      const pendingAnexoIds = []
      for (const f of arquivosResposta) {
        const conteudo = await arquivoParaBase64(f)
        const anexo = await portalChamadosApi.criarAnexo(chamado.id, {
          nomeArquivo: f.name, tipo: f.type, conteudo, tamanho: f.size,
        })
        pendingAnexoIds.push(anexo.id)
      }
      await portalChamadosApi.comentar(chamado.id, {
        conteudo: resposta.trim(),
        ...(pendingAnexoIds.length > 0 && { pendingAnexoIds }),
      })
      setResposta('')
      setArquivosResposta([])
      carregar()
    } catch (err) {
      setErroResposta(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-sysgate-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (erro && !chamado) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {erro}
        </div>
        <Link to="/portal" className="text-sm text-sysgate-600 hover:text-sysgate-700 font-medium">
          ← Voltar para Meus Chamados
        </Link>
      </div>
    )
  }

  const st = statusPortal(chamado.status)
  const anexosGerais = (chamado.anexos || []).filter((a) => !a.comentarioId)
  const anexosPorComentario = (chamado.anexos || []).reduce((acc, a) => {
    if (a.comentarioId) (acc[a.comentarioId] = acc[a.comentarioId] || []).push(a)
    return acc
  }, {})
  const encerrado = ['Concluido', 'Cancelado'].includes(chamado.status)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/portal" className="text-sm text-gray-400 hover:text-sysgate-600 transition-colors">
        ← Voltar para Meus Chamados
      </Link>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {erro}
        </div>
      )}

      {/* Cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          {chamado.numero && (
            <span className="text-xs font-mono font-semibold text-sysgate-600 bg-sysgate-50 rounded px-2 py-0.5">
              {chamado.numero}
            </span>
          )}
          <span
            className="text-xs font-semibold rounded-full px-2.5 py-0.5 text-white"
            style={{ backgroundColor: st.cor }}
          >
            {st.label}
          </span>
        </div>
        <h1 className="text-lg font-bold text-gray-900">{chamado.titulo}</h1>
        <p className="text-xs text-gray-400 mt-1">
          Aberto em {formatDataHora(chamado.criadoEm)}
          {chamado.municipio && <> · {chamado.municipio}</>}
        </p>

        {chamado.descricao && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap mt-4 border-t border-gray-100 pt-4">
            {chamado.descricao}
          </p>
        )}

        {/* Anexos do chamado (não vinculados a comentários) */}
        {anexosGerais.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Anexos</p>
            <ul className="space-y-1.5">
              {anexosGerais.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => baixarAnexo(a)}
                    disabled={baixando === a.id}
                    className="flex items-center gap-2 text-sm text-sysgate-600 hover:text-sysgate-700 disabled:opacity-60"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span className="truncate">{a.nomeArquivo}</span>
                    <span className="text-xs text-gray-400">({formatTamanho(a.tamanho)})</span>
                    {baixando === a.id && <span className="text-xs text-gray-400">baixando...</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timeline de mensagens */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-5 rounded-full bg-sysgate-600" />
          <h2 className="text-sm font-bold text-gray-900">Conversa</h2>
        </div>

        {(chamado.comentarios || []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Ainda não há mensagens neste chamado. A equipe responderá por aqui.
          </p>
        ) : (
          <div className="space-y-4">
            {chamado.comentarios.map((c) => {
              const ehMeu = c.autorSolicitante?.id === solicitante?.id
              const nomeAutor = ehMeu ? 'Você' : (c.autor?.nome || c.autorSolicitante?.nome || 'Equipe')
              const ehEquipe = !!c.autor
              return (
                <div key={c.id} className="flex gap-3">
                  <Avatar nome={ehMeu ? solicitante?.nome : nomeAutor} externo={!ehEquipe} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{nomeAutor}</span>
                      {ehEquipe && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 bg-violet-50 rounded px-1.5 py-0.5">
                          Equipe
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDataHora(c.criadoEm)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">{c.conteudo}</p>

                    {(anexosPorComentario[c.id] || []).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => baixarAnexo(a)}
                        disabled={baixando === a.id}
                        className="mt-1.5 flex items-center gap-1.5 text-xs text-sysgate-600 hover:text-sysgate-700 disabled:opacity-60"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                        </svg>
                        <span className="truncate">{a.nomeArquivo}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Responder */}
        {encerrado ? (
          <p className="text-xs text-gray-400 text-center border-t border-gray-100 mt-5 pt-4">
            Este chamado foi {st.label.toLowerCase()}. Se precisar de algo mais, abra um novo chamado.
          </p>
        ) : (
          <form onSubmit={enviarResposta} className="border-t border-gray-100 mt-5 pt-4 space-y-3">
            <textarea
              className="input min-h-[90px] resize-y"
              placeholder="Escreva sua resposta para a equipe..."
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
            />

            {arquivosResposta.length > 0 && (
              <ul className="space-y-1">
                {arquivosResposta.map((f, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                    <span className="truncate text-gray-600">{f.name} <span className="text-gray-400">({formatTamanho(f.size)})</span></span>
                    <button
                      type="button"
                      onClick={() => setArquivosResposta((atual) => atual.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-600 transition-colors shrink-0 ml-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {erroResposta && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {erroResposta}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-sysgate-600 cursor-pointer transition-colors"
                title={`Imagens ou PDF, até ${MAX_ANEXO_MB} MB cada`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
                Anexar arquivo
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept={MIME_PERMITIDOS.join(',')}
                  onChange={onArquivosResposta}
                />
              </label>

              <button
                type="submit"
                disabled={enviando}
                className="bg-sysgate-600 hover:bg-sysgate-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                {enviando ? 'Enviando...' : 'Enviar resposta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
