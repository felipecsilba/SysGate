import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Pagina from '../../components/Pagina'
import Abas from '../../components/Abas'
import CaixaBusca from '../../components/CaixaBusca'
import Icone from '../../components/Icone'
import { checagemApi, mensagemErro, sistemasApi } from '../../lib/api'
import PorFonte from './PorFonte'

// Duas frentes, porque os dois mundos usam nomes diferentes para a mesma coisa: o payload de migração
// fala idPessoa/valorInscrito; o retorno da fonte BFC fala idContribuinte/valorTributoInscrito.
const FRENTES = [
  { id: 'fonte', rotulo: 'Por Fonte' },
  { id: 'api', rotulo: 'Por API' },
]

// Escolhas sobrevivem à troca de módulo enquanto o app está aberto
const lembrado = { frente: 'fonte', sistemaId: null, cadastro: null }

export default function Checagem() {
  const navegar = useNavigate()
  const [frente, setFrenteEstado] = useState(lembrado.frente)
  const [sistemas, setSistemas] = useState([])
  const [sistemaId, setSistemaIdEstado] = useState(lembrado.sistemaId)
  const [regras, setRegras] = useState(null)
  const [cadastro, setCadastroEstado] = useState(lembrado.cadastro)
  const [erro, setErro] = useState('')

  const setFrente = v => { lembrado.frente = v; setFrenteEstado(v) }
  const setSistemaId = v => { lembrado.sistemaId = v; setSistemaIdEstado(v) }
  const setCadastro = v => { lembrado.cadastro = v; setCadastroEstado(v) }

  useEffect(() => {
    sistemasApi.listar()
      .then(lista => {
        setSistemas(lista)
        if (!lista.some(s => s.id === lembrado.sistemaId)) {
          setSistemaId((lista.find(s => /tributos/i.test(s.nome)) || lista[0])?.id ?? null)
        }
      })
      .catch(e => setErro(mensagemErro(e)))
  }, [])

  useEffect(() => {
    if (!sistemaId) return
    setRegras(null)
    checagemApi.regras({ sistemaId, frente })
      .then(setRegras)
      .catch(e => { setRegras([]); setErro(mensagemErro(e)) })
  }, [sistemaId, frente])

  const cadastros = useMemo(() => [...new Set((regras || []).map(r => r.cadastro))].sort(), [regras])

  useEffect(() => {
    if (regras && !cadastros.includes(cadastro)) setCadastro(cadastros[0] ?? null)
  }, [cadastros]) // eslint-disable-line react-hooks/exhaustive-deps

  const regrasDoCadastro = useMemo(() => (regras || []).filter(r => r.cadastro === cadastro), [regras, cadastro])

  return (
    <Pagina titulo="Checagem" icone="checagem" acoes={<Abas abas={FRENTES} atual={frente} onMudar={setFrente} />}>
      <div className="flex items-center gap-2 border-b border-borda px-4 py-2.5">
        {sistemas.length > 1 && (
          <div className="w-48">
            <CaixaBusca opcoes={sistemas.map(s => ({ valor: s.id, rotulo: s.nome }))} valor={sistemaId} onEscolher={setSistemaId} buscavel={false} />
          </div>
        )}
        {frente === 'fonte' && cadastros.length > 0 && (
          <>
            <span className="text-xs text-suave">Fonte</span>
            <div className="w-56">
              <CaixaBusca opcoes={cadastros.map(c => ({ valor: c, rotulo: c }))} valor={cadastro} onEscolher={setCadastro} />
            </div>
          </>
        )}
        {erro && <span className="text-sm text-perigo">{erro}</span>}
      </div>

      {frente === 'api' ? (
        <Aviso icone="checagem" titulo="Frente Por API — próximo passo">
          Validação do payload de migração contra a spec Swagger, as regras e as marcações de campo. Está sendo trazida para o app.
        </Aviso>
      ) : regras === null ? (
        <p className="py-16 text-center text-sm text-suave">{sistemas.length || erro ? 'Carregando regras…' : 'Carregando…'}</p>
      ) : !sistemas.length ? (
        <Aviso icone="sistemas" titulo="Nenhum sistema neste app" acao={['Importar dados', () => navegar('/importar')]}>
          A Checagem usa as regras de um sistema. Importe os sistemas e a Checagem do Krakion web.
        </Aviso>
      ) : !cadastros.length ? (
        <Aviso icone="importar" titulo="Nenhuma regra de checagem ainda" acao={['Importar dados', () => navegar('/importar')]}>
          As regras, as notas e o catálogo de fontes vêm do Krakion web. Em Importar dados, marque “Checagem”.
        </Aviso>
      ) : (
        <PorFonte key={`${sistemaId}|${cadastro}`} sistemaId={sistemaId} cadastro={cadastro} regras={regrasDoCadastro} />
      )}
    </Pagina>
  )
}

function Aviso({ icone, titulo, acao, children }) {
  return (
    <div className="m-auto max-w-sm py-16 text-center">
      <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-borda text-suave">
        <Icone nome={icone} className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium">{titulo}</p>
      <p className="mt-1 text-xs text-suave">{children}</p>
      {acao && <button type="button" onClick={acao[1]} className="botao-secundario mt-4 px-3 py-1.5">{acao[0]}</button>}
    </div>
  )
}
