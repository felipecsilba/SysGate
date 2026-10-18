import { Barras, Caixa, Chips, ListaIds, Numero, Ponto, SEV, STATUS_CAMPO, Secao, TIPO_NOTA, Trecho, fmtN, fmtPct } from './pecas'

// Painel da direita do laudo Por Fonte: um componente por tipo de item.

function Cabecalho({ estilo, titulo, mono, sub, children }) {
  return (
    <header>
      <p className={`flex items-center gap-1.5 text-xs font-medium ${estilo.texto}`}><Ponto classe={estilo.ponto} /> {estilo.rotulo}</p>
      <h3 className={`mt-1 break-all text-lg font-semibold ${mono ? 'font-mono' : ''}`}>{titulo}</h3>
      {sub && <p className="text-sm text-suave">{sub}</p>}
      {children}
    </header>
  )
}

// ─── Regra ────────────────────────────────────────────────────────────────────

export function DetalheRegra({ r, dimensoes = [], semCabecalho = false }) {
  const falhou = r.faltam > 0
  return (
    <div>
      {!semCabecalho && <Cabecalho
        estilo={SEV[r.severidade] || SEV.na}
        titulo={r.nome}
        sub={r.severidade === 'na'
          ? 'Nenhum registro se enquadra nesta regra.'
          : falhou
            ? <><b className="font-semibold text-texto">{fmtN(r.faltam)}</b> de {fmtN(r.aplicaveis)} registros ({fmtPct(r.faltam / r.aplicaveis)}) com o problema</>
            : <>Os {fmtN(r.aplicaveis)} registros verificados estão corretos</>}
      />}

      <div className={`${semCabecalho ? '' : 'mt-5'} space-y-2`}>
        {r.severidade === 'na' && (
          <Caixa icone="duvida" titulo="Não foi conferida">
            Nenhum registro do arquivo atende à condição desta regra, então ela não foi verificada. Isso não é aprovação.
          </Caixa>
        )}
        {r.porque && (
          <Caixa icone="alerta" titulo={falhou ? 'Consequência' : 'Por que esta regra existe'} cor={falhou ? SEV[r.severidade]?.texto : 'text-suave'}>
            {r.porque}
          </Caixa>
        )}
        {falhou && r.comoCorrigir && <Caixa icone="lampada" titulo="Como corrigir" cor="text-acento">{r.comoCorrigir}</Caixa>}
        {r.naoSabemos && <Caixa icone="duvida" titulo="O que não sabemos">{r.naoSabemos}</Caixa>}
      </div>

      {falhou && dimensoes.length > 0 && (
        <Secao titulo="Onde se concentra" extra="registros com o problema">
          <div className="max-w-xl space-y-4">
            {dimensoes.map(d => (
              <div key={d.rotulo}>
                <p className="mb-1.5 text-xs font-medium">{d.rotulo}</p>
                <Barras total={d.total} itens={d.valores.map(v => ({ chave: v.valor, rotulo: v.valor, qtd: v.qtd, cor: 'bg-perigo/50' }))} />
              </div>
            ))}
          </div>
        </Secao>
      )}

      {falhou && (
        <Secao titulo="O que está no arquivo × o esperado" extra={`${Math.min(3, r.exemplos?.length || 0)} exemplo(s)`}>
          {(r.exemplos || []).map(ex => <Trecho key={ex.id} exemplo={ex} regra={r} />)}
          {r.faltam > (r.exemplos || []).length && (
            <p className="text-xs text-suave">+ {fmtN(r.faltam - r.exemplos.length)} outro(s) registro(s) com o mesmo problema.</p>
          )}
        </Secao>
      )}

      {falhou && (
        <Secao titulo="Ids afetados" extra={fmtN(r.ids?.length || 0)}>
          <ListaIds ids={r.ids || []} />
        </Secao>
      )}

      <Secao titulo="Onde a regra procura">
        <Chips itens={r.onde || []} />
        {r.esperado && !falhou && <p className="mt-2 text-xs text-suave">Esperado: <code className="font-mono">{r.esperado}</code></p>}
      </Secao>
    </div>
  )
}

// ─── Campo ────────────────────────────────────────────────────────────────────

const TIPO_ROTULO = { enum: 'enum', numero: 'número', data: 'data', texto: 'texto', booleano: 'sim/não', lista: 'lista', misto: 'tipos mistos' }
const fmtValor = n => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtData = d => (d ? d.split('-').reverse().join('/') : '—')

export function DetalheCampo({ campo: c, total, regras = [], onAbrirRegra }) {
  const ehValor = /(^|\.)(vl|valor)/i.test(c.campo)
  const regrasDoCampo = regras.filter(r => (r.onde || []).includes(c.campo))
  const tipo = [c.tipo && TIPO_ROTULO[c.tipo], c.tipoCatalogo && c.tipoCatalogo !== c.tipo && `catálogo: ${c.tipoCatalogo}`].filter(Boolean).join(' · ')

  return (
    <div>
      <Cabecalho estilo={STATUS_CAMPO[c.status] || STATUS_CAMPO.vazio} titulo={c.campo} mono sub={c.descricao}>
        {tipo && <p className="mt-0.5 text-xs text-suave">{tipo}</p>}
      </Cabecalho>

      {c.status === 'ausente' ? (
        <div className="mt-5">
          <Caixa icone="duvida" titulo="Não veio no arquivo">
            O catálogo diz que a fonte devolve este campo, mas ele não veio em nenhum registro. Pode ser que o script tenha pedido só alguns campos, ou que a fonte não o devolva para estes registros.
          </Caixa>
        </div>
      ) : (
        <>
          <Secao titulo="Preenchimento">
            <div className="mb-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">{fmtPct(c.pct)}</span>
              <span className="text-sm text-suave">{fmtN(c.preenchidos)} de {fmtN(total)} registros</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-texto/[0.06]">
              <div className={`h-full rounded-full ${STATUS_CAMPO[c.status]?.ponto || 'bg-acento/60'}`} style={{ width: `${c.pct * 100}%` }} />
            </div>
            {c.vazios > 0 && (
              <p className="mt-1.5 text-xs text-suave">
                {fmtN(c.vazios)} vazio{c.vazios !== 1 ? 's' : ''}. Contam como vazio: nulo, texto vazio, objeto vazio, a data 1800-01-01
                {/(^|\.)(id|codigo)/i.test(c.campo) && ' e o 0 (neste campo, 0 é ausência de id)'}.
              </p>
            )}
          </Secao>

          {regrasDoCampo.length > 0 && (
            <Secao titulo="Regras que olham este campo">
              <ul className="space-y-0.5">
                {regrasDoCampo.map(r => (
                  <li key={r.regraId}>
                    <button type="button" onClick={() => onAbrirRegra?.(r.regraId)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-texto/[0.04]">
                      <Ponto classe={(SEV[r.severidade] || SEV.na).ponto} />
                      <span className="flex-1">{r.nome}</span>
                      <span className="text-xs text-suave">{r.faltam > 0 ? `${fmtN(r.faltam)} com falha` : r.severidade === 'na' ? 'não se aplica' : 'ok'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Secao>
          )}

          {c.foraDoEnum.length > 0 && (
            <div className="mt-5">
              <Caixa icone="alerta" titulo="Valores que a fonte não conhece" cor={STATUS_CAMPO.alerta.texto}>
                {c.foraDoEnum.map(v => `${v.valor} ×${fmtN(v.qtd)}`).join('   ')}
              </Caixa>
            </div>
          )}

          {/* número: valor monetário tem soma; id não tem conta que faça sentido */}
          {c.num && c.tipo === 'numero' && (ehValor || c.listaCompleta) && (
            <Secao titulo="Números">
              <div className="grid grid-cols-3 gap-4">
                <Numero rotulo="Menor" valor={ehValor ? fmtValor(c.num.min) : String(c.num.min)} />
                <Numero rotulo="Maior" valor={ehValor ? fmtValor(c.num.max) : String(c.num.max)} />
                {ehValor && <Numero rotulo="Soma" valor={fmtValor(c.num.soma)} />}
              </div>
            </Secao>
          )}

          {/* id, cpf, texto livre: o que importa é se repete */}
          {!c.listaCompleta && !ehValor && c.tipo !== 'data' && c.preenchidos > 0 && (
            <Secao titulo="Unicidade">
              <div className="grid grid-cols-2 gap-4">
                <Numero rotulo="Valores distintos" valor={c.muitos ? 'mais de 50.000' : fmtN(c.distintos)} />
                <Numero rotulo="Aparecem em mais de um registro" valor={fmtN(c.repetidos)} />
              </div>
            </Secao>
          )}

          {c.data && (
            <Secao titulo="Datas" extra="sem contar 1800-01-01">
              <div className="mb-3 grid grid-cols-2 gap-4">
                <Numero rotulo="Mais antiga" valor={fmtData(c.data.min)} />
                <Numero rotulo="Mais recente" valor={fmtData(c.data.max)} />
              </div>
              <Barras total={c.preenchidos} itens={c.anos.map(a => ({ chave: a.ano, rotulo: a.ano, qtd: a.qtd }))} />
            </Secao>
          )}

          {c.valores.length > 0 && (
            <Secao
              titulo={c.listaCompleta ? 'Quantidade por valor' : 'Os que mais se repetem'}
              extra={c.listaCompleta
                ? `${fmtN(c.distintos)} valor${c.distintos !== 1 ? 'es' : ''} distinto${c.distintos !== 1 ? 's' : ''}`
                : `top ${c.valores.length} de ${c.muitos ? 'mais de 50.000' : fmtN(c.distintos)} valores distintos`}
            >
              <Barras
                total={c.preenchidos}
                itens={c.valores.map(v => ({
                  chave: v.valor,
                  rotulo: ehValor ? fmtValor(Number(v.valor)) : v.valor,
                  sub: v.descricao && v.descricao !== v.valor ? v.descricao : v.foraDoEnum ? 'fora do enum' : null,
                  qtd: v.qtd,
                  destaque: v.foraDoEnum,
                }))}
              />
            </Secao>
          )}
          {!c.listaCompleta && c.valores.length === 0 && c.preenchidos > 0 && c.tipo !== 'data' && (
            <p className="mt-4 text-xs text-suave">Nenhum valor se repete: cada registro tem um valor próprio.</p>
          )}
        </>
      )}

      {c.enumAceitos?.length > 0 && (
        <Secao titulo="Valores aceitos pela fonte" extra={`${c.enumAceitos.filter(a => a.presente).length} de ${c.enumAceitos.length} aparecem no arquivo`}>
          <div className="flex flex-wrap gap-1">
            {c.enumAceitos.map(a => (
              <code key={a.key} title={a.descricao}
                className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${a.presente ? 'bg-acento-suave text-acento' : 'bg-texto/[0.04] text-suave/70'}`}>
                {a.key}
              </code>
            ))}
          </div>
        </Secao>
      )}
    </div>
  )
}

// ─── Resumo dos campos do arquivo ─────────────────────────────────────────────

export function ResumoCampos({ perfil, semCatalogo, cadastro }) {
  const { total, foraDoEnum, ausentes, desconhecidos, parciais, sempreVazios, sempreCheios } = perfil
  return (
    <div>
      <h3 className="text-lg font-semibold">Campos do arquivo</h3>
      <p className="mt-0.5 text-sm text-suave">
        O arquivo comparado com o catálogo da fonte <code className="font-mono">{cadastro}</code>. É informação, não veredito:
        campo vazio só vira erro quando uma regra diz que algo quebra sem ele.
      </p>

      <div className="mt-5 grid grid-cols-4 gap-4">
        <Numero rotulo="Sempre preenchidos" valor={fmtN(sempreCheios)} />
        <Numero rotulo="Parciais" valor={fmtN(parciais.length)} />
        <Numero rotulo="Sempre vazios" valor={fmtN(sempreVazios.length)} />
        <Numero rotulo="Não vieram" valor={fmtN(ausentes.length)} />
      </div>

      {semCatalogo && (
        <div className="mt-5">
          <Caixa icone="duvida" titulo="Fonte fora do catálogo">
            Não dá para conferir campos ausentes nem valores de enum — só o preenchimento. Importe a Checagem em Configurações → Importar dados.
          </Caixa>
        </div>
      )}

      {foraDoEnum.length > 0 && (
        <Secao titulo="Valores fora do enum" extra="a fonte não conhece estes valores">
          <ul className="space-y-1 text-xs">
            {foraDoEnum.map(e => (
              <li key={e.campo}>
                <code className="font-mono">{e.campo}</code> <span className="text-suave">({e.tipo}):</span>{' '}
                {e.valores.map(v => <span key={v.valor} className="mr-2 font-mono text-amber-600 dark:text-amber-400">{v.valor} <span className="text-suave">×{fmtN(v.qtd)}</span></span>)}
              </li>
            ))}
          </ul>
        </Secao>
      )}

      {parciais.length > 0 && (
        <Secao titulo="Preenchimento parcial" extra="0 em id, texto vazio e data 1800-01-01 contam como vazio">
          <Barras total={total} itens={parciais.map(l => ({ chave: l.campo, rotulo: l.campo, sub: `${fmtN(l.vazios)} vazio${l.vazios !== 1 ? 's' : ''}`, qtd: l.preenchidos, cor: 'bg-sky-500/70' }))} />
        </Secao>
      )}

      {ausentes.length > 0 && <Secao titulo="Não vieram no arquivo" extra="o catálogo lista, mas não veio em nenhum registro"><Chips itens={ausentes} /></Secao>}
      {sempreVazios.length > 0 && <Secao titulo="Sempre vazios" extra={`vazios nos ${fmtN(total)} registros`}><Chips itens={sempreVazios} /></Secao>}
      {desconhecidos.length > 0 && <Secao titulo="Fora do catálogo" extra="vieram no arquivo, o catálogo não conhece"><Chips itens={desconhecidos} /></Secao>}
    </div>
  )
}

// ─── Notas do cadastro ────────────────────────────────────────────────────────

export function NotasCadastro({ notas, titulo = 'Falta fora do arquivo', embutido = false }) {
  return (
    <div>
      {!embutido && <h3 className="text-lg font-semibold">{titulo}</h3>}
      {!embutido && <p className="mt-0.5 text-sm text-suave">O que este cadastro precisa e não aparece nos campos do registro.</p>}
      <ul className={`${embutido ? '' : 'mt-5'} space-y-2`}>
        {notas.map(n => (
          <li key={n.id} className="rounded-xl border border-borda p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-suave">{TIPO_NOTA[n.tipo] || 'Regra'}</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{n.texto}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
