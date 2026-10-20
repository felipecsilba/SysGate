import { Navigate, useParams } from 'react-router-dom'
import { conexaoPorId } from '../../lib/conexoes'
import GoogleDrive from './GoogleDrive'
import Lista from './Lista'

// /conexoes → lista; /conexoes/<id> → tela de configuração daquele serviço
const TELAS = { 'google-drive': GoogleDrive }

export default function Conexoes() {
  const { conector } = useParams()
  if (!conector) return <Lista />
  const Tela = conexaoPorId(conector)?.disponivel && TELAS[conector]
  return Tela ? <Tela /> : <Navigate to="/conexoes" replace />
}
