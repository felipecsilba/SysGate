@echo off
REM Captura o catalogo de contexto do editor de formulas (variaveis, metodos e classes de cada tipo).
REM Com esta janela aberta, abra no Betha UMA formula de cada tipo (Configurando > Formulas). Nao precisa salvar.
REM Grava em capturas\formulas. Rodar de novo apaga a captura anterior.
cd /d "%~dp0"
set CAP_HOSTS=betha
set CAP_GET=1
set CAP_DIR=%~dp0capturas\formulas
if exist "%CAP_DIR%" rmdir /s /q "%CAP_DIR%"
mkdir "%CAP_DIR%"
echo Escutando em capturas\formulas. Abra uma formula de cada tipo no Betha; feche esta janela ao terminar.
node capture.js
pause
