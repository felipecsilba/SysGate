Inicia todos os serviços do Krakion para uso em produção.

Execute os passos abaixo em ordem usando as ferramentas disponíveis:

## Passo 1 — Verifica o backend na VPS

Execute via Bash:
```bash
ssh -i ~/.ssh/krakion_tunnel -o StrictHostKeyChecking=no -o ConnectTimeout=8 root@187.77.230.138 "pm2 jlist 2>/dev/null | node -e \"const l=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); const b=l.find(p=>p.name==='krakion-backend'); console.log(b ? b.pm2_env.status : 'not_found')\""
```

- Se retornar `online` → backend OK, prossiga
- Se retornar `stopped` ou `errored` → execute:
```bash
ssh -i ~/.ssh/krakion_tunnel -o StrictHostKeyChecking=no root@187.77.230.138 "pm2 start krakion-backend"
```
- Se der erro de chave SSH → informe ao usuário que a chave SSH ainda não foi configurada e peça para rodar `/start-setup` primeiro

## Passo 2 — Abre o proxy local e o tunnel SSH

Execute via Bash:
```bash
powershell.exe -NoProfile -Command "Start-Process 'C:\Users\Felipe\Desktop\tunnel.bat'"
```

## Passo 3 — Confirme ao usuário

Informe de forma clara:
- Status do backend na VPS (online/offline)
- Que o proxy e tunnel SSH foram abertos nas 2 janelas CMD
- Que o sistema está disponível em https://krakionlabs.cloud
- Lembre que as 2 janelas CMD devem ficar abertas enquanto usar o sistema
