@echo off
title SysGate - Deploy Producao

cls
echo.
echo  ==========================================
echo     SysGate - Deploy para Producao
echo     krakionlabs.cloud
echo  ==========================================
echo.
echo  Este script vai conectar no servidor e
echo  atualizar o site com a versao mais recente.
echo.
echo  Certifique-se de ter feito git push antes!
echo.
pause

echo.
echo  Conectando ao servidor e executando deploy...
echo  (Sera solicitada a senha do servidor)
echo.

ssh root@187.77.230.138 "cd /var/www/krakion && git pull && cd frontend && npm run build && cd ../backend && pm2 restart krakion-backend"

echo.
if %ERRORLEVEL% EQU 0 (
    echo  Deploy concluido com sucesso!
    echo  Acesse: https://krakionlabs.cloud
) else (
    echo  Algo deu errado. Verifique a conexao e tente novamente.
)
echo.
pause
