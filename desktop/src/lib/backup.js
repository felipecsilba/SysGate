// Exibição do backup (cartão em Conexões → Google Drive)

export function tamanhoLegivel(bytes) {
  const unidades = ['B', 'KB', 'MB', 'GB']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < unidades.length - 1) { v /= 1024; i++ }
  const texto = i === 0 || v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10) / 10).replace('.', ',')
  return `${texto} ${unidades[i]}`
}

export function resumoBackup(ultimo) {
  const enviado = (ultimo.enviados || [])
    .map(e => `${e.tipo === 'banco' ? 'banco' : e.secao} (${tamanhoLegivel(e.tamanho)})`)
    .join(' · ')
  return { enviado, semMudanca: ultimo.pulados?.length ? ultimo.pulados.join(', ') : null }
}
