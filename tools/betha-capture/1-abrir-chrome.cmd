@echo off
REM Abre um Chrome separado, com porta de depuracao, perfil proprio.
REM O seu Chrome normal continua funcionando do lado, sem interferencia.
set PERFIL=%LOCALAPPDATA%\chrome-betha-debug
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%PERFIL%" --no-first-run --no-default-browser-check https://tributos.betha.cloud
