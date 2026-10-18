import { useCallback, useEffect, useMemo, useState } from 'react'
import Abas from '../components/Abas'
import BotaoIcone from '../components/BotaoIcone'
import Busca from '../components/Busca'
import CaixaBusca from '../components/CaixaBusca'
import Confirmar from '../components/Confirmar'
import Icone from '../components/Icone'
import JsonColorido from '../components/JsonColorido'
import MetodoBadge from '../components/MetodoBadge'
import Pagina from '../components/Pagina'
import { mensagemErro, municipiosApi, requisicoesApi } from '../lib/api'
import { agruparPorDia, filtrarHistorico, situacao } from '../lib/historico'
import { StatusBadge } from './Sandbox/PainelResposta'

const TODOS = ''
const semHost = url => url.replace(/^https?:\/\/[^/]+/, '')
const hora = d => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

// Requisições já executadas (município filtra no backend; sistema, situação e busca aqui).
// O token nunca aparece: o backend devolve o Authorization mascarado.
export default function Historico() {
  const [municipios, setMunicipios] = useState([])
  const [municipioId, setMunicipioId] = useState(TODOS)
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [sistemaId, setSistemaId] = useState(TODOS)
  const [sit, setSit] = useState(TODOS)
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [limpar, setLimpar] = useState(false)

  useEffect(() => { municipiosApi.listar().then(setMunicipios).catch(() => {}) }, [])

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      setItens(await requisicoesApi.listar({ municipioId: municipioId || undefined, limite: 500 }))
    } catch (err) {
      setErro(mensagemErro(err))
    } finally {
      setCarregando(false)
    }
  }, [municipioId])
  useEffect(() => { carregar() }, [carregar])

  const sistemas = useMemo(() => {
    const vistos = new Map()
    for (const r of itens) if (r.sistema) vistos.set(r.sistema.id, r.sistema.nome)
    return [...vistos].map(([id, nome]) => ({ valor: String(id), rotulo: nome })).sort((a, b) => a.rotulo.localeCompare(b.rotulo))
  }, [itens])

  const base = useMemo(() => filtrarHistorico(itens, { busca, sistemaId }), [itens, busca, sistemaId])
  const visiveis = useMemo(() => filtrarHistorico(base, { situacao: sit }), [base, sit])
  const grupos = useMemo(() => agruparPorDia(visiveis), [visiveis])
  const contagem = useMemo(() => ({
    sucesso: base.filter(r => situacao(r.statusCode) === 'sucesso').length,
    erro: base.filter(r => situacao(r.statusCode) === 'erro').length,
  }), [base])
  const atual = visiveis.find(r => r.id === selecionado) ?? null
  const nomeMunicipio = municipios.find(m => String(m.id) === municipioId)?.nome

  async function confirmarLimpeza() {
    await requisicoesApi.limpar({ municipioId: municipioId || undefined })
    setSelecionado(null)
    await carregar()
  }

  return (
    <Pagina
      titulo="Histórico"
      icone="historico"
      acoes={
        <>
          <BotaoIcone titulo="Atualizar" icone="atualizar" onClick={carregar} />
          <BotaoIcone titulo={nomeMunicipio ? `Limpar o histórico de ${nomeMunicipio}` : 'Limpar todo o histórico'} icone="lixeira" perigo onClick={() => setLimpar(true)} />
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-borda px-4 py-3">
        <div className="w-56">
          <CaixaBusca
            opcoes={[{ valor: TODOS, rotulo: 'Todos os municípios' }, ...municipios.map(m => ({ valor: String(m.id), rotulo: m.nome }))]}
            valor={municipioId}
            onEscolher={v => { setMunicipioId(v); setSelecionado(null) }}
          />
        </div>
        <div className="w-48">
          <CaixaBusca
            opcoes={[{ valor: TODOS, rotulo: 'Todos os sistemas' }, ...sistemas]}
            valor={sistemaId}
            onEscolher={setSistemaId}
            buscavel={false}
          />
        </div>
        <Abas
          abas={[
            { id: TODOS, rotulo: 'Todas', contador: base.length },
            { id: 'sucesso', rotulo: 'Sucesso', contador: contagem.sucesso },
            { id: 'erro', rotulo: 'Erro', contador: contagem.erro },
          ]}
          atual={sit}
          onMudar={setSit}
        />
        <Busca valor={busca} onMudar={setBusca} placeholder="Path, ID gerado, endpoint…" className="ml-auto w-64" />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto p-3">
          {carregando ? (
            <p className="py-16 text-center text-sm text-suave">Carregando…</p>
          ) : erro ? (
            <p className="py-16 text-center text-sm text-perigo">{erro}</p>
          ) : !visiveis.length ? (
            <p className="py-16 text-center text-sm text-suave">{itens.length ? 'Nada com esses filtros.' : 'Nenhuma requisição executada ainda.'}</p>
          ) : grupos.map(g => (
            <section key={g.rotulo} className="mb-4">
              <h4 className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-suave">{g.rotulo}</h4>
              <ul className="space-y-0.5">
                {g.itens.map(r => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelecionado(r.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                        r.id === selecionado ? 'bg-texto/[0.07]' : 'hover:bg-texto/[0.04]'
                      }`}
                    >
                      <MetodoBadge metodo={r.metodo} />
                      <StatusBadge codigo={r.statusCode} />
                      <code className="min-w-0 flex-1 truncate font-mono text-xs" title={r.url}>{semHost(r.url)}</code>
                      {!municipioId && r.municipio && <span className="hidden shrink-0 text-[11px] text-suave xl:inline">{r.municipio.nome}</span>}
                      {r.idGerado && <span className="max-w-[9rem] shrink-0 truncate font-mono text-[11px] text-suave" title={r.idGerado}>id {r.idGerado}</span>}
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-suave">{hora(r.criadoEm)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {itens.length >= 500 && <p className="px-2 pb-2 text-[11px] text-suave">Mostrando as 500 mais recentes.</p>}
        </div>

        {atual && <Detalhe r={atual} onFechar={() => setSelecionado(null)} />}
      </div>

      <Confirmar
        aberto={limpar}
        titulo="Limpar histórico"
        mensagem={nomeMunicipio ? `Apaga todas as requisições de ${nomeMunicipio}.` : 'Apaga todas as requisições de todos os municípios.'}
        rotulo="Limpar"
        onConfirmar={confirmarLimpeza}
        onFechar={() => setLimpar(false)}
      />
    </Pagina>
  )
}

function Copiar({ texto, titulo }) {
  const [ok, setOk] = useState(false)
  return (
    <BotaoIcone
      titulo={ok ? 'Copiado!' : titulo}
      icone={ok ? 'check' : 'copiar'}
      ativo={ok}
      className="h-6 w-6"
      onClick={() => navigator.clipboard.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) })}
    />
  )
}

function Detalhe({ r, onFechar }) {
  const linhas = [
    ['Município', r.municipio?.nome],
    ['Sistema', r.sistema?.nome],
    ['Endpoint', r.endpoint?.nome],
    ['Quando', new Date(r.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })],
    ['Duração', r.duracaoMs != null ? `${r.duracaoMs} ms` : null],
  ].filter(([, v]) => v)

  return (
    <aside className="flex w-[46%] max-w-2xl shrink-0 flex-col border-l border-borda">
      <header className="flex items-center gap-2 border-b border-borda px-4 py-3">
        <MetodoBadge metodo={r.metodo} />
        <StatusBadge codigo={r.statusCode} />
        <code className="min-w-0 flex-1 truncate font-mono text-xs" title={r.url}>{semHost(r.url)}</code>
        <Copiar texto={r.url} titulo="Copiar URL" />
        <BotaoIcone titulo="Fechar" icone="fechar" className="h-6 w-6" onClick={onFechar} />
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <dl className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5 text-xs">
          {linhas.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-suave">{k}</dt>
              <dd className="min-w-0 truncate">{v}</dd>
            </div>
          ))}
          {r.idGerado && (
            <div className="contents">
              <dt className="self-center text-suave">ID gerado</dt>
              <dd className="flex min-w-0 items-center gap-1">
                <span className="truncate font-mono font-medium">{r.idGerado}</span>
                <Copiar texto={r.idGerado} titulo="Copiar ID" />
              </dd>
            </div>
          )}
        </dl>
        {r.body != null && <JsonColorido dados={r.body} titulo="Enviado" alturaMax="32vh" />}
        {r.resposta != null
          ? <JsonColorido dados={r.resposta} titulo="Resposta" alturaMax="40vh" />
          : <p className="flex items-center gap-2 text-xs text-suave"><Icone nome="nuvem" className="h-4 w-4" /> Sem corpo de resposta.</p>}
      </div>
    </aside>
  )
}
