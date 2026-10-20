# Conexão com o Google Drive — configuração única

O Krakion App conversa com o Drive usando um **app do Google seu**, criado uma vez no Google Cloud. O Google
pede isso de todo programa que acessa o Drive. São uns 10 minutos, sem custo.

## 1. Criar o projeto e ativar a API do Drive

1. Abra <https://console.cloud.google.com/> com a conta Google que tem o Drive (os 5 TB).
2. No seletor de projetos (topo), clique em **Novo projeto**. Nome: `Krakion App`. Crie e selecione o projeto.
3. Menu ☰ → **APIs e serviços** → **Biblioteca**. Busque **Google Drive API** e clique em **Ativar**.

## 2. Tela de consentimento (Google Auth Platform)

1. Menu ☰ → **Google Auth Platform** (ou **APIs e serviços → Tela de permissão OAuth**). Clique em **Começar**.
2. **Informações do app**: nome `Krakion App`, e-mail de suporte = o seu.
3. **Público-alvo**: **Externo**.
4. **Dados de contato**: o seu e-mail. Aceite a política e clique em **Criar**.
5. Em **Acesso a dados** → **Adicionar ou remover escopos**, marque `.../auth/drive.file` ("Ver, editar, criar e
   excluir apenas os arquivos específicos do Google Drive que você usa com este app"). Salve.
6. Em **Público-alvo**, clique em **Publicar app** e confirme **Em produção**.

> ⚠️ **Não pule o passo 6.** Com o app em "Teste", o Google derruba a conexão a cada 7 dias. Como o escopo
> `drive.file` não é sensível, publicar não exige revisão do Google.

## 3. Criar a credencial do tipo "App para computador"

1. **Google Auth Platform** → **Clientes** → **Criar cliente**.
2. Tipo de aplicativo: **App para computador** (Desktop app). Nome: `Krakion App`. Clique em **Criar**.
3. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`) e a **Chave secreta do cliente** (começa
   com `GOCSPX-`). Copie na hora ou baixe o JSON, porque o Google pode não mostrar a chave de novo.

## 4. Colar no Krakion App e conectar

1. Krakion App → botão de **plugue** no canto inferior esquerdo (acima do tema) → **Google Drive** → **Conectar**.
2. Cole o ID e a chave secreta → **Salvar**. A chave fica cifrada pelo Windows nesta máquina.
3. **Conectar ao Google Drive** → o navegador abre no login do Google → escolha a conta → **Continuar**.
   - Se aparecer "O Google não verificou este app": **Avançado → Acessar Krakion App**. O app é o seu.
4. Volte ao Krakion App: o cartão mostra a conta e a pasta **Krakion App** criada no seu Drive.
5. **Testar conexão** grava, lê e apaga um arquivo de teste.

## O que o app consegue (e não consegue) ver

- Escopo `drive.file`: **só os arquivos que o próprio Krakion App criou**. O resto do Drive fica invisível para ele.
- Desconectar revoga a permissão no Google e apaga a credencial local. Os arquivos que já estão na pasta continuam lá.
- Também dá para revogar pelo Google: <https://myaccount.google.com/permissions> → Krakion App → Remover acesso.

## Em outra máquina

O mesmo app do Google serve. Em Conexões, cole o mesmo ID e a mesma chave e conecte de novo. A credencial
cifrada não viaja entre máquinas, porque só o usuário do Windows que a gravou consegue decifrá-la.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| "The OAuth client was not found" / `invalid_client` | ID ou chave copiados errado, ou cliente apagado no Cloud |
| Conecta, mas cai depois de ~7 dias | App ainda em **Teste**: publique (passo 2.6) e conecte de novo |
| "Access blocked: app has not completed verification" | App em Teste e a conta não está entre os usuários de teste: publique (2.6) |
| "Tempo esgotado esperando a autorização" | O login no navegador não foi concluído em 5 minutos; clique em Conectar de novo |
| "A permissão foi revogada ou expirou" | Acesso removido em myaccount.google.com, ou senha da conta trocada; conecte de novo |
