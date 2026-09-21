@echo off
cd /d "%~dp0"
set CAP_HOSTS=betha,krakionlabs.cloud
set CAP_GET=1
echo Escutando. Deixe esta janela aberta enquanto usa o Betha.
node capture.js
pause
