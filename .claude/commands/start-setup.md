Configura a chave SSH para que o /start funcione sem precisar digitar senha.

Execute os passos abaixo **em ordem** usando as ferramentas disponíveis:

## Passo 1 — Gera a chave SSH (se ainda não existir)

Execute via Bash:
```bash
ls "~/.ssh/krakion_tunnel" 2>/dev/null && echo "JA_EXISTE" || echo "NAO_EXISTE"
```

Se retornar `NAO_EXISTE`, gere a chave:
```bash
ssh-keygen -t ed25519 -f "~/.ssh/krakion_tunnel" -N "" -C "krakion-tunnel"
```

## Passo 2 — Copia a chave pública para a VPS

Execute via Bash (vai pedir a senha pela última vez):
```bash
cat "~/.ssh/krakion_tunnel.pub" | ssh root@187.77.230.138 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo CHAVE_COPIADA"
```

## Passo 3 — Testa a conexão sem senha

Execute via Bash:
```bash
ssh -i "~/.ssh/krakion_tunnel" -o StrictHostKeyChecking=no -o ConnectTimeout=8 root@187.77.230.138 "echo CONEXAO_OK"
```

Se retornar `CONEXAO_OK` → setup concluído com sucesso.

## Passo 4 — Configura PM2 para iniciar automaticamente no boot da VPS

Execute via Bash:
```bash
ssh -i "~/.ssh/krakion_tunnel" -o StrictHostKeyChecking=no root@187.77.230.138 "pm2 startup systemd -u root --hp /root 2>&1 | tail -3 && pm2 save && echo PM2_STARTUP_OK"
```

## Passo 5 — Confirme ao usuário

Informe que o setup está completo e que a partir de agora `/start` funciona sem senha.
Instrua o usuário a fechar este setup e usar `/start` normalmente.
