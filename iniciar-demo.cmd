@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale Node.js 22 antes de executar a demonstracao.
  pause
  exit /b 1
)
echo Abra http://127.0.0.1:4173/ no navegador e mantenha esta janela aberta.
node scripts\serve-demo.mjs
pause
