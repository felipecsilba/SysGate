@echo off
title SysGate - Gerenciador de Servidores
SET NM=node_modules

:menu
cls
echo.
echo  ==========================================
echo     SysGate - Gerenciador de Servidores
echo  ==========================================
echo.
echo   [1]  Iniciar  (Backend + Frontend)
echo   [2]  Parar
echo   [3]  Reiniciar
echo   [4]  Status das portas
echo   [0]  Sair
echo.
set /p opcao=  Opcao: 

if "%opcao%"=="1" goto iniciar
if "%opcao%"=="2" goto parar
if "%opcao%"=="3" goto reiniciar
if "%opcao%"=="4" goto status
if "%opcao%"=="0" exit
goto menu

:iniciar
echo.
echo  Verificando dependencias do Backend...
if not exist "%~dp0backend\%NM%" (
    echo  Instalando dependencias do Backend...
    cd /d "%~dp0backend" && npm install && cd /d "%~dp0"
)
echo  Verificando dependencias do Frontend...
if not exist "%~dp0frontend\%NM%" (
    echo  Instalando dependencias do Frontend...
    cd /d "%~dp0frontend" && npm install && cd /d "%~dp0"
)
echo  Verificando banco de dados...
if not exist "%~dp0backend\prisma\dev.db" (
    echo  Criando banco de dados...
    cd /d "%~dp0backend" && npx prisma db push && cd /d "%~dp0"
)
echo.
echo  Iniciando Backend (porta 3001)...
start "SysGate Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 /nobreak >nul
echo  Iniciando Frontend (porta 3000)...
start "SysGate Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo  Backend  : http://localhost:3001
echo  Frontend : http://localhost:3000
echo.
pause
goto menu

:parar
echo.
echo  Encerrando servidores...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001"') do taskkill /PID %%a /F >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do taskkill /PID %%a /F >nul 2>nul
echo  Pronto.
echo.
pause
goto menu

:reiniciar
echo.
echo  Encerrando servidores...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001"') do taskkill /PID %%a /F >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do taskkill /PID %%a /F >nul 2>nul
timeout /t 2 /nobreak >nul
echo  Reiniciando...
if not exist "%~dp0backend\%NM%" (
    cd /d "%~dp0backend" && npm install && cd /d "%~dp0"
)
if not exist "%~dp0frontend\%NM%" (
    cd /d "%~dp0frontend" && npm install && cd /d "%~dp0"
)
if not exist "%~dp0backend\prisma\dev.db" (
    cd /d "%~dp0backend" && npx prisma db push && cd /d "%~dp0"
)
start "SysGate Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 /nobreak >nul
start "SysGate Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo  Backend  : http://localhost:3001
echo  Frontend : http://localhost:3000
echo.
pause
goto menu

:status
echo.
echo  Portas em uso:
echo.
netstat -aon | findstr ":3000"
netstat -aon | findstr ":3001"
echo.
pause
goto menu
