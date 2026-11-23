@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Iniciando servidor local do Torino Online...
where node >nul 2>&1
if %errorlevel%==0 (
  node servidor.js
  goto :fim
)
where py >nul 2>&1
if %errorlevel%==0 (
  echo Node.js nao encontrado. Usando Python em http://localhost:3000/index.html
  py -m http.server 3000 --bind 127.0.0.1
  goto :fim
)
where python >nul 2>&1
if %errorlevel%==0 (
  echo Node.js nao encontrado. Usando Python em http://localhost:3000/index.html
  python -m http.server 3000 --bind 127.0.0.1
  goto :fim
)
echo Erro: instale Node.js (https://nodejs.org) ou Python 3 para iniciar o servidor local.
:fim
pause
