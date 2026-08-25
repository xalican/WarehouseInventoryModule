@echo off
title Depo & Stok ERP Sunucu Baslatici
color 0A
echo ===================================================
echo   DEPO & STOK ERP MODULU SUNUCULARI BASLATILIYOR
echo ===================================================
echo.
echo 1. .NET Web API (Port 5078) baslatiliyor...
start "DepoStok Web API (Port 5078)" cmd /k "cd /d C:\Users\alica\.gemini\antigravity\scratch\DepoStokModulu\DepoStok.API && dotnet run --urls http://localhost:5078"

echo 2. React Frontend (Port 5173) baslatiliyor...
start "DepoStok React Frontend (Port 5173)" cmd /k "cd /d C:\Users\alica\.gemini\antigravity\scratch\DepoStokModulu\frontend && npm run dev"

echo.
echo ===================================================
echo   SUNUCULAR BASARIYLA AÇILDI!
echo   Arayuz: http://localhost:5173
echo   API: http://localhost:5078
echo ===================================================
timeout /t 5
