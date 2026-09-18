import { useState, useEffect, useMemo } from 'react'
import { sistemasApi, checagemApi } from '../../lib/api'
import SearchSelect from '../../components/SearchSelect'
import AbaChecar from './AbaChecar'
import AbaCampos from './AbaCampos'

// O módulo vem do Swagger como "dividas (Inscrição em dívida)" — a parte
// legível está nos parênteses. Sem parênteses, usa o texto como está.
const nomeModulo = m => {
  const m2 = /^\S+\s+\((.+)\)$/.exec(m || '')
  return m2 ? m2[1] : (m || 'Geral')
}

// Os 350 endpoints repetem "Cria um registro de " — sobra só o que identifica.
const nomeCadastro = c => {
  const limpo = (c.nome || '').replace(/^Cria um registro de\s+/i, '').trim()
  return limpo || c.path
}

export default function Checagem() {
  const [sistemas, setSistemas] = useState([])
  const [sistemaId, setSistemaId] = useState('')
  const [cadastros, setCadastros] = useState([])
  const [moduloSel, setModuloSel] = useState('')
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
      setModuloSel('')
      setPath('')
      return
    }
    setCarregandoCadastros(true)
    checagemApi.cadastros({ sistemaId })
      .then(setCadastros)
      .catch(() => setCadastros([]))
      .finally(() => setCarregandoCadastros(false))
  }, [sistemaId])

  const modulos = useMemo(() => {
    const mapa = new Map()
    for (const c of cadastros) {
      const atual = mapa.get(c.modulo) || { total: 0, marcacoes: 0 }
      mapa.set(c.modulo, {
        total: atual.total + 1,
        marcacoes: atual.marcacoes + (c.marcacoes || 0),
      })
    }
    return [...mapa.entries()]
      .map(([modulo, { total, marcacoes }]) => ({ modulo, total, marcacoes }))
      .sort((a, b) => nomeModulo(a.modulo).localeCompare(nomeModulo(b.modulo), 'pt-BR'))
  }, [cadastros])

  const cadastrosDoModulo = useMemo(
    () => cadastros.filter(c => c.modulo === moduloSel),
    [cadastros, moduloSel]
  )

  const opcoesModulo = useMemo(
    () => modulos.map(m => ({
      value: m.modulo,
      label: `${nomeModulo(m.modulo)}  ·  ${m.total}${m.marcacoes ? `  ·  ${m.marcacoes} marcado${m.marcacoes > 1 ? 's' : ''}` : ''}`,
    })),
    [modulos]
  )

  const opcoesCadastro = useMemo(
    () => cadastrosDoModulo
      .map(c => ({
        value: c.path,
        label: `${nomeCadastro(c)}${c.marcacoes ? `  ·  ${c.marcacoes} marcado${c.marcacoes > 1 ? 's' : ''}` : ''}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [cadastrosDoModulo]
  )

  const escolherModulo = m => {
    setModuloSel(m)
    setPath('')
  }

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

        <div className="flex-1 min-w-[240px]">
          <label className="label">
            Módulo
            {modulos.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">{modulos.length}</span>
            )}
          </label>
          <SearchSelect
            options={opcoesModulo}
            value={moduloSel}
            onChange={escolherModulo}
            disabled={!sistemaId || carregandoCadastros}
            placeholder={
              !sistemaId ? 'Escolha o sistema primeiro'
                : carregandoCadastros ? 'Carregando...'
                : 'Ex: Inscrição em dívida, Imóveis...'
            }
          />
        </div>

        <div className="flex-1 min-w-[240px]">
          <label className="label">
            Cadastro
            {moduloSel && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                {cadastrosDoModulo.length}
              </span>
            )}
          </label>
          <SearchSelect
            options={opcoesCadastro}
            value={path}
            onChange={setPath}
            disabled={!moduloSel}
            placeholder={moduloSel ? 'Escolha o cadastro' : 'Escolha o módulo primeiro'}
          />
        </div>

        {cadastroSel && (
          <div className="text-xs text-gray-500 pb-2 shrink-0">
            <span className="badge-gray font-mono">{cadastroSel.metodo}</span>
            <span className="ml-2 font-mono">{cadastroSel.path}</span>
          </div>
        )}
      </div>

      {!path ? (
        <div className="card flex-1 flex items-center justify-center text-center p-10">
          <div className="max-w-md">
            <p className="text-gray-900 font-medium mb-1">
              Escolha o módulo e o cadastro para começar
            </p>
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
