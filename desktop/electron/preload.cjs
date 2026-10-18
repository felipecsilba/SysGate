// Ponte mínima entre a interface e o Electron (contextIsolation + sandbox).
// Expõe só controles da janela, tema, aviso de versão nova, o agente do Betha Admin e a leitura da biblioteca
// de extensões (só dentro da pasta escolhida, somente leitura) — nenhum acesso a Node, arquivos soltos ou IPC genérico.
// .cjs: preload em sandbox não suporta ESM.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('krakion', {
  // Avisa o main da preferência de tema — ele guarda e aplica já na próxima abertura
  tema: {
    definir: preferencia => ipcRenderer.send('tema:definir', preferencia),
  },
  // Agente do Betha Admin: a senha vai para o main uma vez (salvar) e nunca volta para a tela
  betha: {
    status: () => ipcRenderer.invoke('betha:status'),
    salvar: (usuario, senha) => ipcRenderer.invoke('betha:salvar', usuario, senha),
    apagar: () => ipcRenderer.invoke('betha:apagar'),
    esquecer: chave => ipcRenderer.invoke('betha:esquecer', chave),
    renovar: pedido => ipcRenderer.invoke('betha:renovar', pedido),
    aoPasso: callback => {
      const ouvinte = (_evento, texto) => callback(texto)
      ipcRenderer.on('betha:passo', ouvinte)
      return () => ipcRenderer.removeListener('betha:passo', ouvinte)
    },
  },
  // Biblioteca das Extensões (pasta de scripts, fórmulas e relatórios — somente leitura)
  biblioteca: {
    indice: () => ipcRenderer.invoke('biblioteca:indice'),
    ler: id => ipcRenderer.invoke('biblioteca:ler', id),
    buscar: (ids, termo) => ipcRenderer.invoke('biblioteca:buscar', ids, termo),
    mostrar: id => ipcRenderer.invoke('biblioteca:mostrar', id),
    escolherPasta: () => ipcRenderer.invoke('biblioteca:escolher-pasta'),
  },
  // Aviso de versão nova (modo atalho): 'interface' → recarregar; 'completo' → reiniciar
  app: {
    aoNovaVersao: callback => {
      const ouvinte = (_evento, tipo) => callback(tipo)
      ipcRenderer.on('app:nova-versao', ouvinte)
      return () => ipcRenderer.removeListener('app:nova-versao', ouvinte)
    },
    recarregar: () => ipcRenderer.send('app:recarregar'),
    reiniciar: () => ipcRenderer.send('app:reiniciar'),
  },
  janela: {
    minimizar: () => ipcRenderer.send('janela:minimizar'),
    alternarMaximizar: () => ipcRenderer.send('janela:alternar-maximizar'),
    fechar: () => ipcRenderer.send('janela:fechar'),
    estaMaximizada: () => ipcRenderer.invoke('janela:esta-maximizada'),
    aoMudarMaximizada: callback => {
      const ouvinte = (_evento, maximizada) => callback(maximizada)
      ipcRenderer.on('janela:maximizada', ouvinte)
      return () => ipcRenderer.removeListener('janela:maximizada', ouvinte)
    },
  },
})
