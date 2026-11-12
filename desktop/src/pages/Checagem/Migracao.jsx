import { useMemo, useState } from 'react'
import Abas from '../../components/Abas'
import CaixaBusca from '../../components/CaixaBusca'
import Icone from '../../components/Icone'
import { Codigo } from '../Biblioteca/Visualizador'
import { CHECAGENS_MIGRACAO, checagemPorId, checarMigracao, csvCasos, lerRegistrosMigracao, montarScriptExportacao } from '../../lib/checagemMigracao'
import CorrecaoMigracao from './CorrecaoMigracao'
import { Caixa, Ponto, SEV, fmtN } from './pecas'

const ABAS = [
  { id: 'exportar', rotulo: '1. Exportar' },
  { id: 'verificar', rotulo: '2. Verificar' },
]
const LIMITE_LISTA = 500 // casos mostrados na tela; o CSV leva todos

// Escolhas e o arquivo lido sobrevivem à troca de frente/módulo enquanto o app está aberto (o arquivo não sai da máquina)
const lembrado = { checagem: CHECAGENS_MIGRACAO[0].id, aba: 'exportar', arquivos: {} }

// Frente Migração: uma checagem por cadastro do tributos, sobre o .jsonl exportado no Studio.
// As verificações vêm dos erros reais do salvar pela tela (Migração Espelho) — ver lib/checagemMigracao.js.
export default function Migracao() {
  const [checagemId, setChecagemId] = useState(lembrado.checagem)
  const [aba, setAba] = useState(lembrado.aba)
  const checagem = checagemPorId(checagemId)

  function escolherChecagem(id) { lembrado.checagem = id; setChecagemId(id) }
  function mudarAba(a) { lembrado.aba = a; setAba(a) }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-borda px-4 py-2.5">
        <span className="text-xs text-suave">Cadastro</span>
        <div className="w-56">
          <CaixaBusca opcoes={CHECAGENS_MIGRACAO.map(c => ({ valor: c.id, rotulo: c.rotulo }))} valor={checagemId} onEscolher={escolherChecagem} buscavel={false} />
        </div>
        <Abas className="ml-auto" abas={ABAS} atual={aba} onMudar={mudarAba} />
      </div>
      {aba === 'exportar'
        ? <Exportar key={checagem.id} checagem={checagem} onPronto={() => mudarAba('verificar')} />
        : <Verificar key={checagem.id} checagem={checagem} />}
    </div>
  )
}

function Exportar({ checagem, onPronto }) {
  const script = useMemo(() => montarScriptExportacao(checagem), [checagem])
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(script)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 text-[13px] text-suave">
          <h3 className="text-[15px] font-semibold text-texto">Exportar {checagem.rotulo.toLowerCase()}</h3>
          <p className="mt-1">
            Rode no Studio do tributos e baixe o <span className="font-mono">{checagem.arquivo}</span>. Depois carregue em “2. Verificar”.
            O backup completo da Migração Espelho (<span className="font-mono">{checagem.id}-AAAA-MM-DD.jsonl</span>) também serve.
          </p>
        </div>
        <button onClick={copiar} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-borda px-3 py-1.5 text-sm hover:bg-texto/[0.05]">
          <Icone nome={copiado ? 'check' : 'copiar'} className="h-4 w-4" />
          {copiado ? 'Copiado' : 'Copiar script'}
        </button>
        <button onClick={onPronto} className="botao-secundario shrink-0 !px-3 !py-1.5 text-sm">Já tenho o arquivo</button>
      </div>
      <Codigo texto={script} nome="script.txt" />
    </div>
  )
}

function baixarCsv(nome, conteudo) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8' }))
  a.download = nome
  a.click()
  URL.revokeObjectURL(a.href)
}

function Verificar({ checagem }) {
  const [arquivo, setArquivo] = useState(lembrado.arquivos[checagem.id] || null) // { nome, texto }
  const [lendo, setLendo] = useState(false)
  const [selecionada, setSelecionada] = useState(null)

  const leitura = useMemo(() => (arquivo ? lerRegistrosMigracao(arquivo.texto) : null), [arquivo])
  const resultado = useMemo(() => (leitura ? checarMigracao(leitura.registros, checagem) : null), [leitura, checagem])
  const atual = resultado?.find(r => r.verificacao.id === selecionada) ?? resultado?.find(r => r.casos.length) ?? resultado?.[0]

  async function escolher(e) {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (!arq) return
    setLendo(true)
    const novo = { nome: arq.name, texto: await arq.text() }
    lembrado.arquivos[checagem.id] = novo
    setArquivo(novo)
    setSelecionada(null)
    setLendo(false)
  }

  const contar = sev => (resultado ? new Set(resultado.filter(r => r.verificacao.severidade === sev).flatMap(r => r.casos.map(c => c.id))).size : 0)
  const comErro = contar('erro')
  const comAlerta = contar('alerta')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-borda px-4 py-2.5 text-[13px]">
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-borda px-3 py-1.5 text-sm hover:bg-texto/[0.05]">
          <Icone nome="importar" className="h-4 w-4" />
          {lendo ? 'Lendo…' : arquivo ? 'Trocar arquivo' : `Carregar ${checagem.arquivo}`}
          <input type="file" accept=".jsonl,.json,.txt" className="hidden" onChange={escolher} />
        </label>
        {arquivo && (
          <span className="text-suave">
            <span className="font-mono text-texto">{arquivo.nome}</span> · {fmtN(leitura.registros.length)} {checagem.rotulo.toLowerCase()}
            {leitura.descartadas > 0 && ` · ${fmtN(leitura.descartadas)} linha(s) ignorada(s)`}
            {' · '}<strong className={comErro ? 'text-perigo' : 'text-emerald-600 dark:text-emerald-400'}>{fmtN(comErro)} com erro</strong>
            {comAlerta > 0 && <>{' · '}<strong className={SEV.alerta.texto}>{fmtN(comAlerta)} com alerta</strong></>}
          </span>
        )}
      </div>

      {!resultado
        ? <p className="m-auto max-w-sm py-16 text-center text-sm text-suave">Carregue o arquivo exportado no Studio para ver o laudo. O arquivo é lido aqui na tela e não é gravado em lugar nenhum.</p>
        : (
          <div className="flex min-h-0 flex-1">
            <ul className="w-80 shrink-0 space-y-1 overflow-y-auto border-r border-borda p-2">
              {resultado.map(r => {
                const sev = r.casos.length ? SEV[r.verificacao.severidade] ?? SEV.erro : SEV.ok
                const ativa = r === atual
                return (
                  <li key={r.verificacao.id}>
                    <button type="button" onClick={() => setSelecionada(r.verificacao.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${ativa ? 'bg-texto/[0.07] font-medium' : 'hover:bg-texto/[0.04]'}`}>
                      <Ponto classe={sev.ponto} />
                      <span className="flex-1">{r.verificacao.nome}</span>
                      <span className={`tabular-nums ${sev.texto}`}>{r.casos.length ? fmtN(r.casos.length) : sev.rotulo}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {atual && <Detalhe resultado={atual} checagem={checagem} />}
          </div>
        )}
    </div>
  )
}

function Detalhe({ resultado, checagem }) {
  const { verificacao, casos } = resultado
  function exportar() {
    baixarCsv(`${checagem.id}_${verificacao.id}_${new Date().toISOString().slice(0, 10)}.csv`, csvCasos(casos, verificacao, checagem.cadastroEspelho))
  }
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-[15px] font-semibold">{verificacao.nome}</h3>
          <p className="text-[13px] text-suave">
            {casos.length ? `${fmtN(casos.length)} ${checagem.rotulo.toLowerCase()} com o problema` : 'Nenhum caso neste arquivo.'}
            {' · '}{verificacao.severidade === 'erro' ? 'trava o salvar pela tela (estímulo)' : 'alerta: não trava o salvar, mas é problema de dado'}
          </p>
        </div>
        {casos.length > 0 && (
          <button type="button" onClick={exportar} className="botao-secundario shrink-0 !px-3 !py-1.5 text-sm"
            title="No formato do backup da Migração Espelho: depois de corrigir, carregue no Estímulo para reenviar só estes">
            Exportar CSV ({fmtN(casos.length)})
          </button>
        )}
      </div>
      <Caixa icone="alerta" titulo="Por que importa">{verificacao.porque}</Caixa>
      <Caixa icone="lampada" titulo="Como corrigir">{verificacao.comoCorrigir}</Caixa>
      <CorrecaoMigracao key={verificacao.id} resultado={resultado} checagem={checagem} />
      {casos.length > 0 && (
        <table className="w-full text-[13px]">
          <thead className="text-left text-[11px] uppercase tracking-wider text-suave">
            <tr className="border-b border-borda">
              <th className="w-28 px-2 py-1.5 font-semibold">ID</th>
              <th className="px-2 py-1.5 font-semibold">Nome</th>
              <th className="px-2 py-1.5 font-semibold">Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {casos.slice(0, LIMITE_LISTA).map(c => (
              <tr key={c.id} className="border-b border-borda/60">
                <td className="px-2 py-1.5 font-mono">{c.id}</td>
                <td className="px-2 py-1.5">{c.nome}</td>
                <td className="px-2 py-1.5 text-suave">{c.detalhe}</td>
              </tr>
            ))}
          </tbody>
          {casos.length > LIMITE_LISTA && (
            <tfoot><tr><td colSpan={3} className="px-2 py-2 text-xs text-suave">… e mais {fmtN(casos.length - LIMITE_LISTA)} no CSV</td></tr></tfoot>
          )}
        </table>
      )}
    </div>
  )
}
