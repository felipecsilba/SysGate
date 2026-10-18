import { Component } from 'react'
import Icone from './Icone'

// Erro de renderização num módulo não derruba o app inteiro (tela em branco):
// o menu continua funcionando e o módulo mostra o erro. O Layout troca a `key` ao navegar.
export default class LimiteErro extends Component {
  state = { erro: null }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  componentDidCatch(erro, info) {
    console.error('[LimiteErro]', erro, info?.componentStack)
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-perigo/10 text-perigo">
            <Icone nome="fechar" className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">Algo deu errado neste módulo</h3>
          <p className="mt-1.5 text-sm text-suave">O resto do app continua funcionando. Se repetir, me mande esta mensagem:</p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-texto/[0.05] px-3 py-2 text-left font-mono text-xs text-suave">
            {String(this.state.erro?.message || this.state.erro)}
          </pre>
          <button type="button" className="botao-secundario mt-4" onClick={() => this.setState({ erro: null })}>
            Tentar de novo
          </button>
        </div>
      </div>
    )
  }
}
