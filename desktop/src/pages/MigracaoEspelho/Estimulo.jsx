import { useEffect, useMemo, useState } from 'react'
import Icone from '../../components/Icone'
import { Aviso } from './comum'
import EnvioTela from './EnvioTela'
import { cadastroDoArquivo, lerBackup, municipiosDoBackup, prevalidarEstimulo } from '../../lib/espelho'

const num = n => Number(n).toLocaleString('pt-BR')

// Backup carregado por cadastro sobrevive à troca de etapa/módulo — o Desfazer usa o mesmo arquivo do Estímulo
const guardado = {}

// modo 'estimulo': "." e volta, pela API da tela · modo 'desfazer': só tira o "." que ficou, também pela tela (espelha)
export default function Estimulo({ cadastro, modo = 'estimulo' }) {
  const desfazer = modo === 'desfazer'
  const [arquivo, setArquivo] = useState(guardado[cadastro.id] || { nome: '', texto: '' })
  useEffect(() => { guardado[cadastro.id] = arquivo }, [arquivo, cadastro.id])
  const campo = cadastro.tela.campo
  const item = cadastro.rotuloItem

  const leitura = useMemo(() => (arquivo.texto ? lerBackup(arquivo.texto, cadastro) : null), [arquivo, cadastro])
  // O tributos pode trazer outras cidades (padrões do sistema): o envio fica no município escolhido
  const municipios = useMemo(() => (leitura ? municipiosDoBackup(leitura.registros) : []), [leitura])
  const [municipio, setMunicipio] = useState(null)
  const municipioSel = municipios.length > 1 ? (municipio ?? municipios[0].municipio) : null
  const registros = useMemo(() => (leitura ? leitura.registros.filter(r => municipioSel == null || r.municipio === municipioSel) : []), [leitura, municipioSel])
  // Arquivo de outro cadastro é bloqueado: o de logradouros, por exemplo, tem id e nome e passaria na tela de bairros
  const dono = leitura ? cadastroDoArquivo(arquivo.nome, leitura.colunas) : null
  const outroCadastro = dono && dono.id !== cadastro.id ? dono : null
  const validacao = useMemo(() => (leitura && !leitura.faltando.length && !outroCadastro ? prevalidarEstimulo(registros, campo) : null), [leitura, registros, campo, outroCadastro])
  const salvar = cadastro.tela.modo === 'salvar'
  const comPonto = desfazer || salvar ? [] : validacao?.itens.filter(i => i.jaTemPonto) || []

  async function escolher(e) {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (arq) setArquivo({ nome: arq.name, texto: await arq.text() })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="space-y-3 border-b border-borda p-4 text-[13px]">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold">{desfazer ? 'Desfazer' : 'Estímulo'} — {cadastro.rotulo.toLowerCase()}</h3>
            {salvar ? (
              <p className="mt-1 text-suave">
                {desfazer
                  ? 'Não se aplica: o estímulo de contribuintes salva o registro como está, sem “.”, então não há nada para desfazer.'
                  : <>Carregue o <span className="font-mono">{cadastro.arquivo}</span> da etapa Backup. Cada registro é lido pela <strong className="text-texto">API da tela</strong>,
                    guardado inteiro no backup e salvo como está — salvar sem mudar já dispara o cadastro único.</>}
              </p>
            ) : desfazer ? (
              <p className="mt-1 text-suave">
                Tira o <strong className="text-texto">“.”</strong> do fim do campo <span className="font-mono">{campo}</span> dos {item} que ficaram marcados, pela <strong className="text-texto">API da tela</strong> —
                a volta espelha na procuradoria. Use o mesmo <span className="font-mono">{cadastro.arquivo}</span> do Estímulo. Já sem ponto
                não é gravado; diferente do backup não é tocado.
              </p>
            ) : (
              <p className="mt-1 text-suave">
                Carregue o <span className="font-mono">{cadastro.arquivo}</span> da etapa Backup. Cada registro ganha <strong className="text-texto">“.”</strong> no
                campo <span className="font-mono">{campo}</span> e volta ao original pela <strong className="text-texto">API da tela</strong>, com a sua sessão do tributos.
                É ela que dispara o cadastro único; a API de migração grava mas não espelha.
              </p>
            )}
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-borda px-3 py-1.5 text-sm hover:bg-texto/[0.05]">
            <Icone nome="importar" className="h-4 w-4" />
            {arquivo.nome ? 'Trocar arquivo' : 'Carregar backup'}
            <input type="file" accept=".csv,.txt" className="hidden" onChange={escolher} />
          </label>
        </div>
        {arquivo.nome && <p className="text-suave">Arquivo: <span className="font-mono text-texto">{arquivo.nome}</span></p>}

        {outroCadastro && (
          <p className="text-perigo">Este arquivo é de <strong>{outroCadastro.rotulo}</strong>. Abra <strong>{outroCadastro.rotulo}</strong> no menu da esquerda e carregue lá.</p>
        )}
        {!outroCadastro && leitura?.faltando.length > 0 && (
          <p className="text-perigo">O arquivo não tem a(s) coluna(s) {leitura.faltando.join(', ')}. Use o CSV gerado pelo script da etapa Backup.</p>
        )}

        {municipios.length > 1 && (
          <label className="flex flex-wrap items-center gap-2 text-suave">
            Município:
            <select className="campo !w-auto !py-1" value={municipioSel} onChange={e => setMunicipio(e.target.value)}>
              {municipios.map(m => <option key={m.municipio} value={m.municipio}>{m.municipio || '(sem município)'} — {num(m.total)}</option>)}
            </select>
            <span className="text-xs">o arquivo tem {num(municipios.length)} municípios; só o escolhido entra no envio</span>
          </label>
        )}

        {validacao && (
          <>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-borda px-2 py-0.5"><strong>{num(validacao.itens.length)}</strong> {item} no backup</span>
              {comPonto.length > 0 && <span className="rounded-md border border-amber-500/40 px-2 py-0.5 text-amber-700 dark:text-amber-300"><strong>{num(comPonto.length)}</strong> já termina(m) com “.”</span>}
              {validacao.foraDoEnvio.length > 0 && <span className="rounded-md border border-borda px-2 py-0.5 text-suave"><strong>{num(validacao.foraDoEnvio.length)}</strong> fora do envio</span>}
            </div>
            {comPonto.length > 0 && (
              <Aviso>
                {num(comPonto.length)} registro(s) já termina(m) com “.” e vai(ão) ficar com “..”. Isso não impede o envio,
                mas confira: pode ser o ponto de uma rodada anterior que não foi desfeita. Estão marcadas na lista.
              </Aviso>
            )}
            {validacao.foraDoEnvio.length > 0 && (
              <p className="text-suave">Fora do envio: {validacao.foraDoEnvio.map(f => `${f.id || '(vazio)'} — ${f.motivo}`).join(' · ')}</p>
            )}
          </>
        )}
      </div>

      {validacao?.itens.length > 0 && !(salvar && desfazer) && <EnvioTela itens={validacao.itens} desfazer={desfazer} cadastro={cadastro} linhas={registros} colunas={leitura.colunas} />}
    </div>
  )
}
