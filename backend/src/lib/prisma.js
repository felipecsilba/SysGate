// Instância ÚNICA de PrismaClient compartilhada por todas as rotas.
// No Postgres cada instância abre seu próprio pool de conexões — uma instância
// por arquivo de rota (padrão antigo do SQLite) esgota o max_connections.
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

module.exports = prisma
