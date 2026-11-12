@echo off
REM Igual ao 2-escutar, mas grava numa pasta limpa (capturas\investigacao) para o Claude ler so o que importa.
REM Rodar de novo apaga a investigacao anterior.
cd /d "%~dp0"
set CAP_HOSTS=betha
set CAP_GET=1
set CAP_DIR=%~dp0capturas\investigacao
if exist "%CAP_DIR%" rmdir /s /q "%CAP_DIR%"
mkdir "%CAP_DIR%"
echo Escutando (GET incluido) em capturas\investigacao. Deixe esta janela aberta enquanto usa o Betha.
node capture.js
pause
