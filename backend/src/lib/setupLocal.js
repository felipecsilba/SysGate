// Conta local do Krakion Desktop: a primeira conta da instalação nasce ativa e admin,
// sem aprovação. Só vale quando o backend foi iniciado pelo app desktop
// (KRAKION_DESKTOP=1, nunca definido na VPS) e o banco ainda não tem nenhum usuário.
function setupLocalDisponivel(env, totalUsuarios) {
  return env.KRAKION_DESKTOP === '1' && totalUsuarios === 0
}

module.exports = { setupLocalDisponivel }
