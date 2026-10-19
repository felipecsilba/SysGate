import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import CaixaBusca from '../../components/CaixaBusca'
import { TIPOS_DOC } from '../../lib/documentos'

const vazio = { tipo: 'leis', numero: '', ano: '', assunto: '' }

function CamposDocumento({ dados, mudar, soTipo = false }) {
  const t = TIPOS_DOC.find(x => x.id === dados.tipo)
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="rotulo">Tipo</span>
        <CaixaBusca buscavel={false} opcoes={TIPOS_DOC.map(x => ({ valor: x.id, rotulo: x.rotulo }))} valor={dados.tipo} onEscolher={v => mudar({ tipo: v })} />
      </label>
      {!soTipo && t?.prefixo && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="rotulo">Número</span>
            <input className="campo" value={dados.numero} onChange={e => mudar({ numero: e.target.value })} placeholder="524" />
          </label>
          <label className="block">
            <span className="rotulo">Ano</span>
            <input className="campo" value={dados.ano} onChange={e => mudar({ ano: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="2021" />
          </label>
        </div>
      )}
      {!soTipo && (
        <label className="block">
          <span className="rotulo">{t?.prefixo ? 'Assunto (ementa curta)' : 'Título'}</span>
          <input className="campo" value={dados.assunto} onChange={e => mudar({ assunto: e.target.value })} placeholder={t?.prefixo ? 'PROREFIS' : 'Planilha de alíquotas'} />
        </label>
      )}
    </div>
  )
}

// Anexar: os arquivos vêm do arrastar-e-soltar (caminhos) ou da janela de escolher arquivos (main).
// Com um arquivo só, número/ano/assunto já viram o nome padronizado ("Lei 524-2021 - PROREFIS.pdf").
export function ModalAnexar({ aberto, caminhos = [], tipoInicial, onFechar, onAnexar }) {
  const [dados, setDados] = useState(vazio)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => { if (aberto) { setDados({ ...vazio, tipo: tipoInicial && tipoInicial !== 'anotacoes' ? tipoInicial : 'leis' }); setErro('') } }, [aberto]) // eslint-disable-line react-hooks/exhaustive-deps

  const varios = caminhos.length > 1
  async function confirmar() {
    setOcupado(true); setErro('')
    const r = await onAnexar(dados, caminhos)
    setOcupado(false)
    if (r?.erro) setErro(r.erro)
  }

  return (
    <Modal aberto={aberto} titulo="Anexar documento" largura="max-w-lg" onFechar={onFechar}
      subtitulo={caminhos.length ? `${caminhos.length} arquivo${varios ? 's' : ''}: ${caminhos.map(c => c.split(/[\\/]/).pop()).join(', ')}` : 'Você escolhe o arquivo no próximo passo.'}
      rodape={
        <>
          <button type="button" className="botao-secundario" onClick={onFechar} disabled={ocupado}>Cancelar</button>
          <button type="button" className="botao-primario" onClick={confirmar} disabled={ocupado}>
            {ocupado ? 'Copiando…' : caminhos.length ? 'Anexar' : 'Escolher arquivos…'}
          </button>
        </>
      }>
      <CamposDocumento dados={dados} mudar={p => setDados(d => ({ ...d, ...p }))} soTipo={varios} />
      {varios && <p className="mt-3 text-xs text-suave">Com vários arquivos, cada um mantém o nome original. Dá para ajustar número e assunto depois, um por um.</p>}
      <p className="mt-3 text-xs text-suave">O arquivo é <b className="font-medium text-texto">copiado</b> para a pasta do município — o original fica onde está.</p>
      {erro && <p className="mt-3 text-sm text-perigo">{erro}</p>}
    </Modal>
  )
}

// Editar dados: renomeia o arquivo pelo padrão e/ou muda de tipo (pasta)
export function ModalDados({ aberto, doc, onFechar, onSalvar }) {
  const [dados, setDados] = useState(vazio)
  const [erro, setErro] = useState('')
  useEffect(() => { if (aberto && doc) { setDados({ tipo: doc.tipo, numero: doc.numero, ano: doc.ano, assunto: doc.assunto }); setErro('') } }, [aberto, doc])

  async function salvar() {
    const r = await onSalvar(dados)
    if (r?.erro) setErro(r.erro)
  }

  return (
    <Modal aberto={aberto} titulo="Dados do documento" subtitulo={doc?.arquivo} largura="max-w-lg" onFechar={onFechar}
      rodape={<><button type="button" className="botao-secundario" onClick={onFechar}>Cancelar</button><button type="button" className="botao-primario" onClick={salvar}>Salvar</button></>}>
      <CamposDocumento dados={dados} mudar={p => setDados(d => ({ ...d, ...p }))} />
      <p className="mt-3 text-xs text-suave">O arquivo é renomeado na pasta para seguir o padrão (ex.: “Lei 524-2021 - PROREFIS.pdf”).</p>
      {erro && <p className="mt-3 text-sm text-perigo">{erro}</p>}
    </Modal>
  )
}
