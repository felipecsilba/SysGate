import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { portalChamadosApi } from '../../lib/portalApi'
import { MIME_PERMITIDOS, MAX_ANEXO_MB, validarArquivo, arquivoParaBase64, formatTamanho } from './constants'

// Abertura de chamado pelo portal — título + descrição + anexos opcionais.
// O chamado é criado primeiro; os anexos são enviados na sequência.
export default function NovoChamado() {
  const navigate = useNavigate()

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [arquivos, setArquivos] = useState([])
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const onArquivos = (e) => {
    setErro('')
    const novos = Array.from(e.target.files || [])
    for (const f of novos) {
      const problema = validarArquivo(f)
      if (problema) { setErro(problema); e.target.value = ''; return }
    }
    setArquivos((atual) => [...atual, ...novos])
    e.target.value = ''
  }

  const removerArquivo = (idx) => setArquivos((atual) => atual.filter((_, i) => i !== idx))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    if (!titulo.trim()) {
      setErro('Informe um título para o chamado.')
      return
    }
    setEnviando(true)
    try {
      const chamado = await portalChamadosApi.criar({ titulo: titulo.trim(), descricao: descricao.trim() })
      for (const f of arquivos) {
        const conteudo = await arquivoParaBase64(f)
        await portalChamadosApi.criarAnexo(chamado.id, {
          nomeArquivo: f.name,
          tipo: f.type,
          conteudo,
          tamanho: f.size,
        })
      }
      navigate(`/portal/chamados/${chamado.id}`, { replace: true })
    } catch (err) {
      setErro(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/portal" className="text-sm text-gray-400 hover:text-sysgate-600 transition-colors">
        ← Voltar para Meus Chamados
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="w-1 h-6 rounded-full bg-sysgate-600" />
          <h1 className="text-lg font-bold text-gray-900">Novo Chamado</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              className="input"
              placeholder="Resumo do problema ou solicitação"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              autoFocus
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              className="input min-h-[140px] resize-y"
              placeholder="Descreva com detalhes: o que aconteceu, em qual tela/sistema, mensagens de erro..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          {/* Anexos */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Anexos <span className="text-gray-400 font-normal">(imagens ou PDF, até {MAX_ANEXO_MB} MB cada)</span>
            </label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-sysgate-300 rounded-lg px-4 py-5 cursor-pointer text-sm text-gray-400 hover:text-sysgate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              Clique para anexar arquivos
              <input
                type="file"
                className="hidden"
                multiple
                accept={MIME_PERMITIDOS.join(',')}
                onChange={onArquivos}
              />
            </label>

            {arquivos.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {arquivos.map((f, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="truncate text-gray-700">{f.name}</span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-400">{formatTamanho(f.size)}</span>
                      <button
                        type="button"
                        onClick={() => removerArquivo(idx)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Remover"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {erro}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 bg-sysgate-600 hover:bg-sysgate-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {enviando ? 'Enviando...' : 'Abrir chamado'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/portal')}
              className="px-5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
