import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Pagina from '../../components/Pagina'
import Abas from '../../components/Abas'
import CaixaBusca from '../../components/CaixaBusca'
import Icone from '../../components/Icone'
import { checagemApi, mensagemErro, sistemasApi } from '../../lib/api'
import { opcoesCadastros } from '../../lib/checagem'
import PorFonte from './PorFonte'
import PorApi from './PorApi'
import CamposApi from './CamposApi'

// Duas frentes, porque os dois mundos usam nomes diferentes para a mesma coisa: o payload de migração
// fala idPessoa/valorInscrito; o retorno da fonte BFC fala idContribuinte/valorTributoInscrito.
const FRENTES = [
  { id: 'fonte', rotulo: 'Por Fonte' },
  { id: 'api', rotulo: 'Por API' },
]

const ABAS_API = [
  { id: 'verificar', rotulo: 'Verificar payload' },
  { id: 'campos', rotulo: 'Campos' },
]

// Escolhas sobrevivem à troca de módulo enquanto o app está aberto
const lembrado = { frente: 'fonte', sistemaId: null, fonte: null, path: null, abaApi: 'verificar' }

function usarLembrado(chave) {
  const [valor, setValor] = useState(lembrado[chave])
  return [valor, v => { lembrado[chave] = v; setValor(v) }]
}

export default function Checagem() {
  const navegar = useNavigate()
  const [frente, setFrente] = usarLembrado('frente')
  const [sistemaId, setSistemaId] = usarLembrado('sistemaId')
  const [fonte, setFonte] = usarLembrado('fonte')
  const [path, setPath] = usarLembrado('path')
  const [abaApi, setAbaApi] = usarLembrado('abaApi')
  const [sistemas, setSistemas] = useState(null)
  const [regras, setRegras] = useState(null) // frente fonte
  const [cadastros, setCadastros] = useState(null) // frente api
  const [erro, setErro] = useState('')

  useEffect(() => {
    sistemasApi.listar()
      .then(lista => {
        setSistemas(lista)
        if (!lista.some(s => s.id === lembrado.sistemaId)) setSistemaId((lista.find(s => /tributos/i.test(s.nome)) || lista[0])?.id ?? null)
      })
      .catch(e => { setSistemas([]); setErro(mensagemErro(e)) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sistemaId) return
    setRegras(null)
    checagemApi.regras({ sistemaId, frente: 'fonte' })
      .then(setRegras)
      .catch(e => { setRegras([]); setErro(mensagemErro(e)) })
  }, [sistemaId])

  const carregarCadastros = useCallback(() => {
    if (!sistemaId) return
    checagemApi.cadastros({ sistemaId })
      .then(setCadastros)
      .catch(e => { setCadastros([]); setErro(mensagemErro(e)) })
  }, [sistemaId])

  useEffect(() => {
    if (frente === 'api') { setCadastros(null); carregarCadastros() }
  }, [frente, carregarCadastros])

  const fontes = useMemo(() => [...new Set((regras || []).map(r => r.cadastro))].sort(), [regras])
  useEffect(() => {
    if (regras && !fontes.includes(fonte)) setFonte(fontes[0] ?? null)
  }, [fontes]) // eslint-disable-line react-hooks/exhaustive-deps

  const opcoesApi = useMemo(() => opcoesCadastros(cadastros || []), [cadastros])
  const cadastroSel = cadastros?.find(c => c.path === path)
  const regrasDaFonte = useMemo(() => (regras || []).filter(r => r.cadastro === fonte), [regras, fonte])

  let conteudo
  if (sistemas === null) conteudo = <p className="py-16 text-center text-sm text-suave">Carregando…</p>
  else if (!sistemas.length) {
    conteudo = (
      <Aviso icone="sistemas" titulo="Nenhum sistema neste app" acao={['Importar dados', () => navegar('/importar')]}>
        A Checagem usa as regras e a spec de um sistema. Importe os sistemas e a Checagem do Krakion web.
      </Aviso>
    )
  } else if (frente === 'fonte') {
    conteudo = regras === null
      ? <p className="py-16 text-center text-sm text-suave">Carregando regras…</p>
      : !fontes.length
        ? (
          <Aviso icone="importar" titulo="Nenhuma regra de checagem ainda" acao={['Importar dados', () => navegar('/importar')]}>
            As regras, as notas e o catálogo de fontes vêm do Krakion web. Em Importar dados, marque “Checagem”.
          </Aviso>
        )
        : <PorFonte key={`${sistemaId}|${fonte}`} sistemaId={sistemaId} cadastro={fonte} regras={regrasDaFonte} />
  } else if (cadastros === null) conteudo = <p className="py-16 text-center text-sm text-suave">Carregando cadastros…</p>
  else if (!cadastros.length) {
    conteudo = (
      <Aviso icone="sistemas" titulo="Nenhum cadastro com spec" acao={['Ir para Sistemas', () => navegar('/sistemas')]}>
        A frente Por API valida contra os endpoints de criação (POST/PUT/PATCH) importados do Swagger do sistema.
      </Aviso>
    )
  } else if (!cadastroSel) {
    conteudo = (
      <Aviso icone="checagem" titulo="Escolha o cadastro">
        Em “Verificar payload” você cola o JSON de migração e recebe o laudo: o que a spec acusa, o que as regras acusam e o que falta fora do JSON.
        Em “Campos” você marca quais campos são obrigatórios de verdade.
      </Aviso>
    )
  } else {
    conteudo = abaApi === 'campos'
      ? <CamposApi key={`${sistemaId}|${path}`} sistemaId={sistemaId} path={path} onSalvo={carregarCadastros} />
      : <PorApi key={`${sistemaId}|${path}`} sistemaId={sistemaId} path={path} />
  }

  return (
    <Pagina titulo="Checagem" icone="checagem" acoes={<Abas abas={FRENTES} atual={frente} onMudar={setFrente} />}>
      <div className="flex items-center gap-2 border-b border-borda px-4 py-2.5">
        {sistemas?.length > 1 && (
          <div className="w-48">
            <CaixaBusca opcoes={sistemas.map(s => ({ valor: s.id, rotulo: s.nome }))} valor={sistemaId} onEscolher={setSistemaId} buscavel={false} />
          </div>
        )}
        {frente === 'fonte' && fontes.length > 0 && (
          <>
            <span className="text-xs text-suave">Fonte</span>
            <div className="w-56">
              <CaixaBusca opcoes={fontes.map(c => ({ valor: c, rotulo: c }))} valor={fonte} onEscolher={setFonte} />
            </div>
          </>
        )}
        {frente === 'api' && cadastros?.length > 0 && (
          <>
            <span className="text-xs text-suave">Cadastro</span>
            <div className="w-[26rem]">
              <CaixaBusca opcoes={opcoesApi} valor={path} onEscolher={setPath} placeholder={`Buscar entre ${cadastros.length} cadastros…`} />
            </div>
            {cadastroSel && <code className="truncate font-mono text-xs text-suave">{cadastroSel.metodo} {cadastroSel.path}</code>}
            {cadastroSel && <Abas className="ml-auto" abas={ABAS_API} atual={abaApi} onMudar={setAbaApi} />}
          </>
        )}
        {erro && <span className="text-sm text-perigo">{erro}</span>}
      </div>
      {conteudo}
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
