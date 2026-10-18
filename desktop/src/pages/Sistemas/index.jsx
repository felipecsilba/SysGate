import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Confirmar from '../../components/Confirmar'
import Icone from '../../components/Icone'
import Pagina from '../../components/Pagina'
import { endpointsApi, mensagemErro, sistemasApi } from '../../lib/api'
import DetalheSistema from './DetalheSistema'
import ListaSistemas from './ListaSistemas'
import ModalEndpoint from './ModalEndpoint'
import ModalSistema from './ModalSistema'
import ModalSwagger from './ModalSwagger'

export default function Sistemas() {
  const navegar = useNavigate()
  const [sistemas, setSistemas] = useState(null) // null = carregando
  const [selecionadoId, setSelecionadoId] = useState(null)
  const [detalhe, setDetalhe] = useState(null) // sistema com swaggerSpecs
  const [endpoints, setEndpoints] = useState([])
  const [aba, setAba] = useState('endpoints')
  const [busca, setBusca] = useState('')
  const [aviso, setAviso] = useState('')
  const [erro, setErro] = useState('')
  // { tipo: 'sistema' | 'swagger' | 'endpoint' | 'excluirSistema' | 'excluirEndpoint' | 'removerSpec', alvo }
  const [modal, setModal] = useState(null)
  const fechar = useCallback(() => setModal(null), [])
  const alvoDe = tipo => (modal?.tipo === tipo ? modal.alvo : null)

  const carregarSistemas = useCallback(async () => {
    try {
      const lista = await sistemasApi.listar()
      setSistemas(lista)
      setSelecionadoId(atual => (lista.some(s => s.id === atual) ? atual : lista[0]?.id ?? null))
    } catch (err) {
      setErro(mensagemErro(err))
      setSistemas([])
    }
  }, [])

  const carregarDetalhe = useCallback(async id => {
    if (!id) { setDetalhe(null); setEndpoints([]); return }
    const [d, eps] = await Promise.all([sistemasApi.obter(id), endpointsApi.listar(id)])
    setDetalhe(d)
    setEndpoints(eps)
  }, [])

  useEffect(() => { carregarSistemas() }, [carregarSistemas])
  useEffect(() => { carregarDetalhe(selecionadoId) }, [selecionadoId, carregarDetalhe])

  const recarregar = () => Promise.all([carregarSistemas(), carregarDetalhe(selecionadoId)])

  async function salvarSistema(dados) {
    if (modal.alvo) {
      await sistemasApi.atualizar(modal.alvo.id, dados)
      await recarregar()
    } else {
      const novo = await sistemasApi.criar(dados)
      setSelecionadoId(novo.id)
      await carregarSistemas()
    }
  }

  async function excluirSistema() {
    await sistemasApi.excluir(modal.alvo.id)
    setSelecionadoId(null)
    await carregarSistemas()
  }

  async function aposImportar(r) {
    setAviso(`${r.importados} endpoints importados${r.removidos ? ` (${r.removidos} anteriores substituídos)` : ''}.`)
    setTimeout(() => setAviso(''), 5000)
    setAba('endpoints')
    await recarregar()
  }

  async function salvarEndpoint(dados) {
    await endpointsApi.atualizar(modal.alvo.id, dados)
    await carregarDetalhe(selecionadoId)
  }

  async function excluirEndpoint() {
    await endpointsApi.excluir(modal.alvo.id)
    await recarregar()
  }

  async function removerSpec() {
    await endpointsApi.removerSpec(modal.alvo.id)
    await recarregar()
  }

  const botaoNovo = (
    <button type="button" className="botao-secundario h-8 px-3 text-xs" onClick={() => setModal({ tipo: 'sistema', alvo: null })}>
      <Icone nome="mais" className="h-3.5 w-3.5" /> Sistema
    </button>
  )

  return (
    <Pagina titulo="Sistemas" icone="sistemas" acoes={sistemas?.length ? botaoNovo : null}>
      {sistemas === null ? (
        <div className="flex flex-1 items-center justify-center text-sm text-suave">Carregando…</div>
      ) : !sistemas.length ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-acento-suave text-acento">
              <Icone nome="sistemas" className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold">Nenhum sistema ainda</h3>
            <p className="mt-1.5 text-sm text-suave">Traga seus sistemas e endpoints do Krakion web ou cadastre um e importe o Swagger dele.</p>
            {erro && <p className="mt-3 text-sm text-perigo">{erro}</p>}
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" className="botao-primario" onClick={() => navegar('/importar')}>
                <Icone nome="importar" className="h-4 w-4" /> Importar dados
              </button>
              <button type="button" className="botao-secundario" onClick={() => setModal({ tipo: 'sistema', alvo: null })}>Novo sistema</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1">
          <ListaSistemas sistemas={sistemas} selecionadoId={selecionadoId} onSelecionar={setSelecionadoId} busca={busca} onBusca={setBusca} />
          {detalhe ? (
            <DetalheSistema
              sistema={detalhe}
              endpoints={endpoints}
              aba={aba}
              onAba={setAba}
              onImportar={() => setModal({ tipo: 'swagger', alvo: detalhe })}
              onEditar={() => setModal({ tipo: 'sistema', alvo: detalhe })}
              onExcluir={() => setModal({ tipo: 'excluirSistema', alvo: detalhe })}
              onEditarEndpoint={ep => setModal({ tipo: 'endpoint', alvo: ep })}
              onExcluirEndpoint={ep => setModal({ tipo: 'excluirEndpoint', alvo: ep })}
              onRemoverSpec={s => setModal({ tipo: 'removerSpec', alvo: s })}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-suave">Selecione um sistema.</div>
          )}
          {aviso && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-texto px-4 py-2.5 text-sm text-fundo shadow-lg">
              <Icone nome="check" className="h-4 w-4" strokeWidth={2.5} /> {aviso}
            </div>
          )}
        </div>
      )}

      <ModalSistema aberto={modal?.tipo === 'sistema'} sistema={alvoDe('sistema')} onFechar={fechar} onSalvar={salvarSistema} />
      <ModalSwagger
        aberto={modal?.tipo === 'swagger'}
        sistema={alvoDe('swagger')}
        totalAtual={endpoints.length}
        onFechar={fechar}
        onImportado={aposImportar}
      />
      <ModalEndpoint aberto={modal?.tipo === 'endpoint'} endpoint={alvoDe('endpoint')} onFechar={fechar} onSalvar={salvarEndpoint} />
      <Confirmar
        aberto={modal?.tipo === 'excluirSistema'}
        titulo={`Excluir ${alvoDe('excluirSistema')?.nome ?? ''}?`}
        mensagem="O sistema sai da lista e os endpoints dele deixam de aparecer no Sandbox. Os tokens deste sistema nos municípios também são apagados."
        onConfirmar={excluirSistema}
        onFechar={fechar}
      />
      <Confirmar
        aberto={modal?.tipo === 'excluirEndpoint'}
        titulo="Excluir endpoint?"
        mensagem={`${alvoDe('excluirEndpoint')?.metodo ?? ''} ${alvoDe('excluirEndpoint')?.path ?? ''} — volta se você reimportar o Swagger.`}
        onConfirmar={excluirEndpoint}
        onFechar={fechar}
      />
      <Confirmar
        aberto={modal?.tipo === 'removerSpec'}
        titulo="Remover do histórico?"
        mensagem="Só o registro da importação some. Os endpoints criados por ela continuam."
        rotulo="Remover"
        onConfirmar={removerSpec}
        onFechar={fechar}
      />
    </Pagina>
  )
}
