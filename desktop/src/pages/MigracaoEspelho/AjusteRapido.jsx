import { useMemo, useState } from 'react'
import Abas from '../../components/Abas'
import Icone from '../../components/Icone'
import { duplicadas, lerRegistros } from '../../lib/ajustesMigracao'
import { Aviso, ScriptPronto } from './comum'
import CorrecaoReceitas from './CorrecaoReceitas'
import ExclusaoAjuste from './ExclusaoAjuste'

const num = n => Number(n).toLocaleString('pt-BR')
const ROTULO_CAMPO = { descricao: 'Descrição', abreviatura: 'Abreviatura' }

// Arquivo lido por ajuste sobrevive à troca de aba/módulo enquanto o app está aberto (a aba Corrigir lê o mesmo)
const guardado = {}

// Aba "3. Corrigir" de cada ajuste que já tem correção automática
const CORRECAO = { 'receitas-duplicadas': CorrecaoReceitas }

// Ajuste rápido: 1) script pronto para exportar o CSV no Studio · 2) leitura que aponta o que corrigir · 3) correção
export default function AjusteRapido({ ajuste }) {
  const [aba, setAba] = useState(guardado[ajuste.id]?.texto ? 'ler' : 'exportar')
  const Correcao = CORRECAO[ajuste.id]
  // Limpeza (ajuste.exclusao): exportar → excluir. Os demais: exportar → ler → corrigir.
  const abas = ajuste.exclusao
    ? [{ id: 'exportar', rotulo: '1. Exportar' }, { id: 'excluir', rotulo: '2. Excluir' }]
    : [{ id: 'exportar', rotulo: '1. Exportar' }, { id: 'ler', rotulo: '2. Ler resultado' }, ...(Correcao ? [{ id: 'corrigir', rotulo: '3. Corrigir' }] : [])]
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-borda px-4 py-2.5">
        <h3 className="text-[15px] font-semibold">{ajuste.rotulo}</h3>
        <div className="flex-1" />
        <Abas abas={abas} atual={aba} onMudar={setAba} />
      </div>
      {aba === 'exportar'
        ? (
          <ScriptPronto cadastro={ajuste.cadastro} titulo={`Exportar ${ajuste.cadastro.rotulo.toLowerCase()}`}>
            <p>{ajuste.porque}</p>
            <p className="mt-1">Rode no Studio{ajuste.exclusao ? ' da procuradoria' : ''}, baixe o <span className="font-mono">{ajuste.cadastro.arquivo}</span> e carregue na aba “2. {ajuste.exclusao ? 'Excluir' : 'Ler resultado'}”. A saída do console (<span className="font-mono">imprimir item</span>) também serve: é só colar.</p>
          </ScriptPronto>
        )
        : aba === 'excluir' ? <ExclusaoAjuste ajuste={ajuste} />
          : aba === 'ler' ? <Leitura ajuste={ajuste} /> : <Correcao ajuste={ajuste} arquivo={guardado[ajuste.id]} />}
    </div>
  )
}

function Leitura({ ajuste }) {
  const [arquivo, setArquivo] = useState(guardado[ajuste.id] || { nome: '', texto: '' })
  const [filtro, setFiltro] = useState('todos')
  const [mesmoTipo, setMesmoTipo] = useState(false)
  const [colado, setColado] = useState('')
  const tipo = ajuste.tipo.campo

  const leitura = useMemo(() => (arquivo.texto ? lerRegistros(arquivo.texto, ajuste.cadastro) : null), [arquivo, ajuste])
  const grupos = useMemo(() => (leitura && !leitura.faltando.length ? duplicadas(leitura.registros, { tipo, mesmoTipo }) : null), [leitura, tipo, mesmoTipo])
  const contagem = campo => grupos?.filter(g => g.campo === campo).length ?? 0
  const visiveis = (grupos || []).filter(g => filtro === 'todos' || g.campo === filtro)

  async function escolher(e) {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (!arq) return
    usar({ nome: arq.name, texto: await arq.text() })
  }
  function usar(novo) {
    guardado[ajuste.id] = novo
    setArquivo(novo)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="space-y-3 border-b border-borda p-4 text-[13px]">
        <div className="flex items-start gap-3">
          <p className="flex-1 text-suave">
            Carregue o <span className="font-mono">{ajuste.cadastro.arquivo}</span> ou cole a saída do console. A leitura aponta descrição e
            abreviatura repetidas (sem diferenciar maiúsculas e espaços) — por padrão <strong className="text-texto">em qualquer {ajuste.tipo.rotulo}</strong>,
            porque a Betha recusa a descrição repetida mesmo entre TAXA e IMPOSTO.
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
              placeholder='23:32:47 - {"id":864455,"descricao":"ALVARÁ DE CONSTRUÇÃO",...}' />
            <button type="button" className="botao-secundario !px-3 !py-1.5 text-xs" disabled={!colado.trim()} onClick={() => usar({ nome: 'texto colado', texto: colado })}>Ler</button>
          </div>
        )}
        {arquivo.nome && (
          <p className="text-suave">
            Lido: <span className="font-mono text-texto">{arquivo.nome}</span>{leitura && ` (${leitura.formato === 'console' ? 'console do Studio' : 'CSV'})`}
            {' · '}<button type="button" className="underline hover:text-texto" onClick={() => { setColado(''); usar({ nome: '', texto: '' }) }}>limpar</button>
          </p>
        )}
        {leitura?.faltando.length > 0 && (
          <p className="text-perigo">O arquivo não tem a(s) coluna(s) {leitura.faltando.join(', ')}. Use o CSV do script da aba “1. Exportar”.</p>
        )}
        {grupos && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-suave"><strong className="text-texto">{num(leitura.registros.length)}</strong> {ajuste.cadastro.rotulo.toLowerCase()} lidas</span>
            <Abas
              abas={[
                { id: 'todos', rotulo: 'Todos', contador: grupos.length },
                { id: 'descricao', rotulo: 'Descrição', contador: contagem('descricao') },
                { id: 'abreviatura', rotulo: 'Abreviatura', contador: contagem('abreviatura') },
              ]}
              atual={filtro} onMudar={setFiltro} />
            <label className="flex items-center gap-1.5 text-xs text-suave">
              <input type="checkbox" checked={mesmoTipo} onChange={e => setMesmoTipo(e.target.checked)} className="h-3.5 w-3.5 accent-[rgb(var(--acento))]" />
              só na mesma {ajuste.tipo.rotulo}
            </label>
          </div>
        )}
        {grupos && contagem('descricao') > 0 && (
          <Aviso>
            Descrição repetida é o que faz o salvar do crédito voltar 422. Em cada grupo, a receita <strong>sem template</strong> não está no
            cadastro único (em geral criada pela migração) — é a candidata a ajustar pela tela. A com template já espelha nos outros sistemas.
            Depois, estimule de novo os créditos que falharam.
          </Aviso>
        )}
      </div>

      {grupos && !grupos.length && (
        <p className="flex items-center gap-2 p-6 text-sm text-emerald-600 dark:text-emerald-400"><Icone nome="check" className="h-4 w-4" /> Nenhuma descrição ou abreviatura repetida{mesmoTipo ? ` na mesma ${ajuste.tipo.rotulo}` : ''}.</p>
      )}

      <div className="space-y-3 p-4">
        {visiveis.map(g => (
          <section key={`${g.campo}|${g.tipo}|${g.valor}`} className="overflow-hidden rounded-xl border border-borda">
            <header className="flex flex-wrap items-center gap-2 border-b border-borda bg-texto/[0.03] px-3 py-2 text-[13px]">
              <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${g.campo === 'descricao' ? 'bg-perigo/10 text-perigo' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'}`}>
                {ROTULO_CAMPO[g.campo]} repetida
              </span>
              <span className="font-medium">“{g.valor}”</span>
              <span className="text-suave">· {g.tipo || `${ajuste.tipo.rotulo} vazia`} · {g.registros.length} registros</span>
            </header>
            <table className="w-full text-[13px]">
              <thead className="text-left text-[11px] uppercase tracking-wider text-suave">
                <tr><th className="w-24 px-3 py-1.5 font-semibold">ID</th><th className="px-2 py-1.5 font-semibold">Descrição</th><th className="w-28 px-2 py-1.5 font-semibold">Abreviatura</th><th className="w-40 px-2 py-1.5 font-semibold">{ajuste.tipo.rotulo}</th><th className="px-3 py-1.5 font-semibold">Template</th></tr>
              </thead>
              <tbody>
                {g.registros.map(r => (
                  <tr key={r.id} className="border-t border-borda/60">
                    <td className="px-3 py-1.5 font-mono">{r.id}</td>
                    <td className="px-2 py-1.5">{r.descricao}</td>
                    <td className="px-2 py-1.5 font-mono">{r.abreviatura}</td>
                    <td className="px-2 py-1.5 text-xs">{r[tipo]}</td>
                    <td className="truncate px-3 py-1.5 font-mono text-[11px]">
                      {r.templateId
                        ? <span className="text-suave">{r.templateId}</span>
                        : <span className="font-sans font-medium text-amber-700 dark:text-amber-300">sem template · fora do cadastro único</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  )
}
