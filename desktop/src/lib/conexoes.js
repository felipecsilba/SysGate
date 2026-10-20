import { contem } from './texto.js'

// Catálogo da tela Conexões. "disponivel: false" aparece na lista como "Em breve" (sem ação).
export const CONEXOES = [
  {
    id: 'google-drive',
    nome: 'Google Drive',
    categoria: 'Armazenamento',
    descricao: 'Cópia de segurança do banco local e da biblioteca numa pasta do seu Drive.',
    disponivel: true,
  },
  {
    id: 'claude-api',
    nome: 'Claude API',
    categoria: 'Inteligência artificial',
    descricao: 'Motor dos agentes e da busca na biblioteca de scripts e fórmulas.',
    disponivel: false,
  },
  {
    id: 'gmail',
    nome: 'Gmail',
    categoria: 'E-mail',
    descricao: 'Ler e rascunhar e-mails ligados a chamados e municípios.',
    disponivel: false,
  },
]

export const conexaoPorId = id => CONEXOES.find(c => c.id === id)

export function buscarConexoes(termo) {
  return CONEXOES
    .filter(c => !termo?.trim() || [c.nome, c.descricao, c.categoria].some(t => contem(t, termo)))
    .sort((a, b) => Number(b.disponivel) - Number(a.disponivel))
}
