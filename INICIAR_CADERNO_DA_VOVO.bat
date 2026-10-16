@echo off
title Caderno da Vovo - Servidor PC e Mobile
echo ========================================================
echo   👵 Iniciando o Caderno da Vovo (Backend + Frontend)
echo ========================================================
echo.
start "Caderno da Vovo - API Backend (Porta 3333)" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak >nul
start "Caderno da Vovo - Site & Painel (Porta 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul
start http://localhost:5173
echo Pronto! O Caderno da Vovo foi aberto no seu navegador.
