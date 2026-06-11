# Deploy — VPS Hostinger

**Servidor:** 187.77.230.138 | **Domínio:** krakionlabs.cloud | **OS:** Ubuntu 24.04 LTS
**Repositório:** https://github.com/felipecsilba/SysGate | **Diretório:** `/var/www/krakion`

---

## Stack de produção

- **PM2** — gerencia o processo Node.js do backend (reinicia automaticamente)
- **Nginx** — serve o frontend (`/dist`) e faz proxy `/api` → porta 3001
- **Let's Encrypt (Certbot)** — certificado SSL gratuito (HTTPS)
- **PostgreSQL 16** — banco de dados (localhost da VPS, migrado do SQLite em 2026-06-11)

---

## Fluxo de deploy padrão

```bash
# 1. Fazer commit e push local
git add ...
git commit -m "..."
git push origin master

# 2. SSH na VPS e atualizar
ssh root@187.77.230.138
cd /var/www/krakion && git pull && cd backend && npx prisma db push && cd ../frontend && npm run build && cd ../backend && pm2 restart krakion-backend
```

> **Acesso SSH:** a chave pública do implantador (`~/.ssh/id_ed25519.pub`) está no `authorized_keys` do servidor — deploys rodam sem senha.
>
> **Mudança de schema:** fazer backup antes do `db push`:
> ```bash
> sudo -u postgres pg_dump krakion | gzip > /root/krakion-$(date +%Y%m%d-%H%M%S).sql.gz
> npx prisma db push
> ```

---

## PostgreSQL na VPS

- Serviço: `systemctl status postgresql` (PostgreSQL 16, só escuta em localhost)
- Banco `krakion`, role `krakion` — senha no `DATABASE_URL` do `/var/www/krakion/backend/.env`
- Console: `sudo -u postgres psql -d krakion`
- **Backup**: `sudo -u postgres pg_dump krakion | gzip > /root/krakion-DATA.sql.gz`
- **Migração SQLite → Postgres (2026-06-11)**: dados copiados do `dev.db` com `backend/prisma/migrar-sqlite-postgres.js` (rodado da máquina local via túnel `ssh -L 15432:127.0.0.1:5432`, porque o script exige Node ≥ 22.5 e a VPS tem Node 20). Contagens verificadas tabela a tabela. Os arquivos `prisma/dev.db` e `dev.db.bak-*` foram **mantidos no servidor como fallback** — para rollback de emergência, basta voltar `DATABASE_URL="file:./dev.db"` no `.env`, trocar o provider para `sqlite` no schema e `pm2 restart` (perde os dados criados após a migração).

---

## Comandos úteis na VPS

```bash
# Conectar
ssh root@187.77.230.138

# Status do backend
pm2 status
pm2 logs krakion-backend

# Parar tudo (site fica fora do ar)
pm2 stop krakion-backend && systemctl stop nginx

# Religar tudo
pm2 start krakion-backend && systemctl start nginx

# Renovar SSL (automático, mas pode forçar)
certbot renew
```

---

## Configuração do Nginx

Arquivo: `/etc/nginx/sites-available/krakion`

```nginx
server {
    listen 80;
    server_name krakionlabs.cloud www.krakionlabs.cloud;
    root /var/www/krakion/frontend/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # Fase 0 — rate limit por IP real
    }
}
```

> **Atenção:** este arquivo (`/etc/nginx/sites-available/krakion`) é o nginx **de produção** (PM2). O `frontend/nginx.conf` do repo só vale para o setup Docker — alterações de proxy precisam ser feitas **aqui no servidor** e seguidas de `nginx -t && systemctl reload nginx`.

---

## Variáveis de ambiente na VPS

Arquivo: `/var/www/krakion/backend/.env`

```
DATABASE_URL="postgresql://krakion:<senha>@localhost:5432/krakion"
PORT=3001
JWT_SECRET=krakion_secret_super_seguro_2026
JWT_EXPIRES_IN=8h
PROXY_URL=http://127.0.0.1:8888
```

---

## Proxy de saída — túnel SSH pelo PC do implantador

**Contexto:** O IP da VPS Hostinger (187.77.230.138) está bloqueado pela Betha Cloud para requisições de API. IPs de data center (incluindo proxies comerciais Webshare) também são bloqueados. A solução é rotear as chamadas pelo PC do implantador (IP residencial) via túnel SSH reverso.

**Como funciona:**
```
Backend (VPS) → SSH tunnel (127.0.0.1:8888) → proxy.js (PC) → Betha Cloud
```

**Arquivo proxy.js** — salvo em `C:\Users\Felipe\Desktop\proxy.js`:

```javascript
const net = require('net')
const http = require('http')
const server = http.createServer((req, res) => { res.writeHead(404); res.end() })
server.on('connect', (req, clientSocket, head) => {
  const [hostname, port] = req.url.split(':')
  const serverSocket = net.connect(parseInt(port) || 443, hostname, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
    if (head && head.length) serverSocket.write(head)
    serverSocket.pipe(clientSocket)
    clientSocket.pipe(serverSocket)
  })
  serverSocket.on('error', () => clientSocket.destroy())
  clientSocket.on('error', () => serverSocket.destroy())
})
server.listen(8888, '127.0.0.1', () => console.log('Proxy rodando em localhost:8888'))
```

**Ativar o túnel (toda vez que for usar o sistema em produção):**

CMD 1 — Iniciar o proxy HTTP no PC:
```cmd
node C:\Users\Felipe\Desktop\proxy.js
```

CMD 2 — Criar túnel SSH reverso (deixar aberto):
```cmd
ssh -R 8888:127.0.0.1:8888 root@187.77.230.138 -N
```

**Verificar se está funcionando (na SSH da VPS):**
```bash
curl -x "http://127.0.0.1:8888" "https://api.ipify.org?format=json"
# Deve retornar o IP residencial do PC (ex: 179.216.24.94), não 187.77.230.138
```

**Importante:**
- O túnel só funciona enquanto o PC do implantador estiver ligado e os 2 CMDs abertos
- Se o PC desligar ou a conexão cair, o sistema para de conseguir chamar a Betha
- O `PROXY_URL=http://127.0.0.1:8888` já está no `.env` da VPS

**Nota técnica — axios 1.x + HTTPS:**
O backend usa axios 1.13.x que não suporta o campo `proxy` para HTTPS corretamente. A solução foi usar `httpsAgent: new HttpsProxyAgent(PROXY_URL)` com `proxy: false`, usando o pacote `https-proxy-agent` (já presente como dependência transitória). Essa configuração está em `buildProxyConfig()` nos arquivos `proxy.js` e `endpoints.js`.
