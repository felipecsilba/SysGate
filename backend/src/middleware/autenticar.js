const jwt = require('jsonwebtoken')

function autenticar(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso não fornecido' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    // Tokens do portal externo (tipo: 'externo') NUNCA acessam rotas internas
    if (payload.tipo === 'externo') {
      return res.status(401).json({ error: 'Token inválido' })
    }
    req.usuario = payload // { id, login, nome, role }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' })
    }
    return res.status(401).json({ error: 'Token inválido' })
  }
}

function exigirAdmin(req, res, next) {
  if (req.usuario?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' })
  }
  next()
}

// Trilho de autenticação do portal externo (Solicitante) — exige claim tipo: 'externo'.
// Tokens internos são rejeitados aqui, e tokens externos são rejeitados no `autenticar`.
function autenticarExterno(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acesso não fornecido' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.tipo !== 'externo') {
      return res.status(401).json({ error: 'Token inválido' })
    }
    req.solicitante = payload // { sid, nome, email, tipo: 'externo' }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' })
    }
    return res.status(401).json({ error: 'Token inválido' })
  }
}

module.exports = autenticar
module.exports.exigirAdmin = exigirAdmin
module.exports.autenticarExterno = autenticarExterno
