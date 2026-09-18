import { useState, useEffect, useMemo } from 'react'
import { sistemasApi, checagemApi } from '../../lib/api'
import SearchSelect from '../../components/SearchSelect'
import AbaChecar from './AbaChecar'
import AbaCampos from './AbaCampos'

export default function Checagem() {
  const [sistemas, setSistemas] = useState([])
  const [sistemaId, setSistemaId] = useState('')
  const [cadastros, setCadastros] = useState([])
  const [path, setPath] = useState('')
  const [aba, setAba] = useState('checar')
  const [carregandoCadastros, setCarregandoCadastros] = useState(false)

  useEffect(() => {
    sistemasApi.listar()
      .then(lista => {
        setSistemas(lista)
        if (lista.length === 1) setSistemaId(String(lista[0].id))
      })
      .catch(() => setSistemas([]))
  }, [])

  useEffect(() => {
    if (!sistemaId) {
      setCadastros([])
      setPath('')
      return
    }
    setCarregandoCadastros(true)
    checagemApi.cadastros({ sistemaId })
      .then(setCadastros)
      .catch(() => setCadastros([]))
      .finally(() => setCarregandoCadastros(false))
  }, [sistemaId])

  const opcoesCadastro = useMemo(
    () => cadastros.map(c => ({
      value: c.path,
      label: `${c.nome || c.path}${c.marcacoes ? `  ·  ${c.marcacoes} marcado${c.marcacoes > 1 ? 's' : ''}` : ''}`,
    })),
    [cadastros]
  )

  const cadastroSel = cadastros.find(c => c.path === path)

  const recarregarCadastros = () => {
    if (sistemaId) checagemApi.cadastros({ sistemaId }).then(setCadastros).catch(() => {})
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full bg-sysgate-600" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Checagem de Cadastros</h1>
          <p className="text-sm text-gray-500">
            Aponta o que falta ou está inconsistente no JSON antes de migrar
          </p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <label className="label">Sistema</label>
          <SearchSelect
            options={sistemas.map(s => ({ value: String(s.id), label: s.nome }))}
            value={sistemaId}
            onChange={setSistemaId}
            placeholder="Escolha o sistema"
          />
        </div>

        <div className="flex-1 min-w-[280px]">
          <label className="label">
            Cadastro
            {cadastros.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {cadastros.length} disponíveis
              </span>
            )}
          </label>
          <SearchSelect
            options={opcoesCadastro}
            value={path}
            onChange={setPath}
            disabled={!sistemaId || carregandoCadastros}
            placeholder={
              !sistemaId ? 'Escolha o sistema primeiro'
                : carregandoCadastros ? 'Carregando...'
                : 'Ex: dívidas, imóveis, econômicos...'
            }
          />
        </div>

        {cadastroSel && (
          <div className="text-xs text-gray-500 pb-2">
            <span className="badge-gray font-mono">{cadastroSel.metodo}</span>
            <span className="ml-2 font-mono">{cadastroSel.path}</span>
          </div>
        )}
      </div>

      {!path ? (
        <div className="card flex-1 flex items-center justify-center text-center p-10">
          <div className="max-w-md">
            <p className="text-gray-900 font-medium mb-1">Escolha um cadastro para começar</p>
            <p className="text-sm text-gray-500">
              Na aba <strong>Checar</strong> você cola o JSON e recebe o laudo. Na aba{' '}
              <strong>Campos</strong> você marca quais campos são obrigatórios de verdade —
              o que a spec da Betha não diz.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1 border-b border-gray-200">
            {[
              { id: 'checar', label: 'Checar JSON' },
              { id: 'campos', label: 'Campos' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setAba(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                  aba === t.id
                    ? 'border-sysgate-600 text-sysgate-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            {aba === 'checar'
              ? <AbaChecar sistemaId={sistemaId} path={path} />
              : <AbaCampos sistemaId={sistemaId} path={path} onMarcacaoSalva={recarregarCadastros} />}
          </div>
        </>
      )}
    </div>
  )
}
