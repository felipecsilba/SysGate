import { useMemo, useState } from 'react'
import Confirmar from '../../components/Confirmar'
import Icone from '../../components/Icone'
import { lerRegistros, lotesExcluir, separarPorFiltro } from '../../lib/ajustesMigracao'
import { Aviso, Situacao } from './comum'
import { SeletorToken, useEnvioLote, useMunicipioToken } from './envioLote'

const num = n => Number(n).toLocaleString('pt-BR')
const PREVIA = 100 // linhas mostradas antes do envio (a lista inteira pode ter milhares)
const EM_USO = /em uso/i

// Arquivo lido por ajuste sobrevive à troca de aba/módulo enquanto o app está aberto
const guardado = {}

// Exclusão pela Service Layer (token de migração) dos registros do CSV exportado. Em uso: a Betha recusa e o registro fica.
export default function ExclusaoAjuste({ ajuste }) {
  const { exclusao, cadastro } = ajuste
  const [arquivo, setArquivo] = useState(guardado[ajuste.id] || { nome: '', texto: '' })
  const [colado, setColado] = useState('')
  const [todasCidades, setTodasCidades] = useState(false) // padrão: só o município do filtro
  const sel = useMunicipioToken(exclusao.sistema)
  const envio = useEnvioLote(sel, { path: exclusao.path, metodo: 'DELETE' })
  const [confirmar, setConfirmar] = useState(null) // { lotes, rotulo }

  const leitura = useMemo(() => (arquivo.texto ? lerRegistros(arquivo.texto, cadastro) : null), [arquivo, cadastro])
  const { dentro: registros, fora } = useMemo(
    () => separarPorFiltro(leitura && !leitura.faltando.length ? leitura.registros : [], todasCidades ? undefined : cadastro.filtro),
    [leitura, cadastro, todasCidades])
  const lotes = useMemo(() => lotesExcluir(registros, exclusao), [registros, exclusao])
  const nomePorId = useMemo(() => new Map(registros.map(r => [Number(r.id), r])), [registros])

  function usar(novo) {
    guardado[ajuste.id] = novo
    setArquivo(novo)
    envio.limpar()
  }
  async function escolher(e) {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (arq) usar({ nome: arq.name, texto: await arq.text() })
  }

  const { porId, ativo, pendentes, resumo } = envio
  const total = lotes.reduce((n, l) => n + l.ids.length, 0)
  const erros = Object.entries(porId).filter(([, s]) => !s.ok && !s.fila).map(([id, s]) => ({ id: Number(id), ...s }))
  const emUso = erros.filter(e => EM_USO.test(e.mensagem || ''))
  const outrosErros = erros.filter(e => !EM_USO.test(e.mensagem || ''))
  const idsDe = lista => registros.filter(r => lista.some(e => e.id === Number(r.id)))
  const rotulo = exclusao.rotuloItem

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="space-y-3 border-b border-borda p-4 text-[13px]">
        <div className="flex items-start gap-3">
          <p className="flex-1 text-suave">
            Carregue o <span className="font-mono">{cadastro.arquivo}</span> (ou cole a saída do console). Cada registro vai num
            <span className="font-mono"> DELETE {exclusao.path}</span> pela Service Layer, com o token de migração, em lotes de 50.
            O que estiver em uso a Betha recusa — esses ficam e aparecem listados. Os lotes vão em rajada (4 de cada vez) até a Betha
            limitar as chamadas; aí a tela espera e retoma sozinha. Depois, os lotes são consultados em rodadas.
          </p>
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-borda px-3 py-1.5 text-sm hover:bg-texto/[0.05]">
            <Icone nome="importar" className="h-4 w-4" />
            {arquivo.nome ? 'Trocar arquivo' : 'Carregar CSV'}
            <input type="file" accept=".csv,.txt" className="hidden" onChange={escolher} />
          </label>
        </div>
        {!arquivo.texto && (
          <div className="flex items-start gap-2">
            <textarea className="campo h-24 flex-1 font-mono text-[11px]" value={colado} onChange={e => setColado(e.target.value)} spellCheck={false}
              placeholder='00:19:59 - {"id":21101443,"nome":"*****************",...}' />
            <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" disabled={!colado.trim()} onClick={() => usar({ nome: 'texto colado', texto: colado })}>Ler</button>
          </div>
        )}
        {arquivo.nome && (
          <p className="text-suave">
            Lido: <span className="font-mono text-texto">{arquivo.nome}</span>{leitura && ` (${leitura.formato === 'console' ? 'console do Studio' : 'CSV'})`}
            {' · '}<button type="button" className="underline hover:text-texto" disabled={ativo} onClick={() => { setColado(''); usar({ nome: '', texto: '' }) }}>limpar</button>
          </p>
        )}
        {leitura?.faltando.length > 0 && (
          <p className="text-perigo">O arquivo não tem a(s) coluna(s) {leitura.faltando.join(', ')}. Use o CSV do script da aba “1. Exportar”.</p>
        )}
        {cadastro.filtro && leitura && !leitura.faltando.length && (
          <label className="flex items-center gap-1.5 text-suave">
            <input type="checkbox" checked={todasCidades} disabled={ativo} onChange={e => setTodasCidades(e.target.checked)} className="h-3.5 w-3.5 accent-[rgb(var(--acento))]" />
            Incluir outras cidades (padrões do sistema — o usuário recadastra pelo CEP quando precisar)
          </label>
        )}
        {fora > 0 && (
          <p className="text-suave">{num(fora)} registro(s) de outras cidades ignorados ({cadastro.filtro.campo} ≠ {cadastro.filtro.valor}).</p>
        )}
        {todasCidades && (
          <Aviso>
            Na tela, a exclusão dos padrões do sistema vem desabilitada — a base pode ser compartilhada e a API pode recusar.
            Use o “Testar com 1” com um registro de outra cidade antes de soltar o resto. Para exportar todas, deixe
            <span className="font-mono"> ID_MUNICIPIO = ""</span> no script.
          </Aviso>
        )}
        {total > 0 && (
          <Aviso>
            {num(total)} {rotulo} para excluir, em {num(lotes.length)} lote(s). <strong>Exclusão não tem volta</strong> — o CSV é o backup.
            Comece pelo “Testar com 1” e confira na tela antes de soltar o resto.
          </Aviso>
        )}
      </div>

      {total > 0 && (
        <>
          <div className="flex flex-wrap items-end gap-3 border-b border-borda p-4 text-[13px]">
            <SeletorToken sel={sel} />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" disabled={!sel.pronto || ativo}
                onClick={() => setConfirmar({ lotes: lotesExcluir(registros.slice(0, 1), exclusao), rotulo: 'Testar com 1' })}>Testar com 1</button>
              <button type="button" className="botao-primario !px-3 !py-1.5 text-xs" disabled={!sel.pronto || ativo}
                onClick={() => setConfirmar({ lotes, rotulo: `Excluir ${num(total)} ${rotulo}` })}>
                Excluir {num(total)} {rotulo}
              </button>
              {outrosErros.length > 0 && !ativo && (
                <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs"
                  onClick={() => setConfirmar({ lotes: lotesExcluir(idsDe(outrosErros), exclusao), rotulo: 'Reenviar os com erro' })}>
                  Reenviar os {num(outrosErros.length)} com erro
                </button>
              )}
              {pendentes.length > 0 && !ativo && <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={envio.consultarPendentes}>Consultar pendentes ({pendentes.length})</button>}
              {ativo && <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" onClick={envio.parar}>Parar</button>}
            </div>
            {envio.pausa && (
              <p className="w-full text-xs text-amber-700 dark:text-amber-300">
                A Betha limitou as chamadas (cerca de 140 por janela) · tenta de novo às {new Date(envio.pausa).toLocaleTimeString('pt-BR')}
              </p>
            )}
            {resumo.total > 0 && (
              <p className="w-full text-xs text-suave">
                {num(resumo.okN)} excluído(s) · {num(emUso.length)} em uso · {num(outrosErros.length)} com outro erro · {num(resumo.filaN)} na fila
              </p>
            )}
          </div>

          {resumo.total === 0
            ? (
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-fundo text-left text-[11px] uppercase tracking-wider text-suave">
                  <tr className="border-b border-borda">
                    {cadastro.campos.slice(0, 4).map(c => <th key={c.nome} className="px-4 py-2 font-semibold">{c.nome}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {registros.slice(0, PREVIA).map(r => (
                    <tr key={r.id} className="border-b border-borda/60">
                      {cadastro.campos.slice(0, 4).map(c => <td key={c.nome} className={`px-4 py-1.5 ${c.nome === 'id' ? 'font-mono' : ''}`}>{r[c.nome]}</td>)}
                    </tr>
                  ))}
                </tbody>
                {registros.length > PREVIA && (
                  <tfoot><tr><td colSpan={4} className="px-4 py-2 text-xs text-suave">… e mais {num(registros.length - PREVIA)}</td></tr></tfoot>
                )}
              </table>
            )
            : (
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-fundo text-left text-[11px] uppercase tracking-wider text-suave">
                  <tr className="border-b border-borda">
                    <th className="w-28 px-4 py-2 font-semibold">ID</th>
                    <th className="px-2 py-2 font-semibold">{cadastro.campos[1]?.nome}</th>
                    <th className="w-[45%] px-4 py-2 font-semibold">Não excluídos — motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {erros.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-3 text-xs text-suave">Nenhum recusado até agora.</td></tr>
                  )}
                  {erros.map(e => (
                    <tr key={e.id} className="border-b border-borda/60">
                      <td className="px-4 py-1.5 font-mono">{e.id}</td>
                      <td className="px-2 py-1.5">{nomePorId.get(e.id)?.[cadastro.campos[1]?.nome]}</td>
                      <td className="truncate px-4 py-1.5 text-xs"><Situacao s={e} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </>
      )}

      <Confirmar
        aberto={!!confirmar}
        titulo={confirmar ? `${confirmar.rotulo}?` : ''}
        mensagem={confirmar ? `DELETE ${exclusao.path} — ${num(confirmar.lotes.reduce((n, l) => n + l.ids.length, 0))} ${rotulo} em ${num(confirmar.lotes.length)} lote(s), no município ${sel.municipio?.nome}, sistema ${sel.sistemas.find(s => s.id === sel.sistemaId)?.nome}. Exclusão não tem volta.` : ''}
        rotulo="Excluir"
        onConfirmar={() => { const c = confirmar; setConfirmar(null); envio.enviar(c.lotes) }}
        onFechar={() => setConfirmar(null)}
      />
    </div>
  )
}
