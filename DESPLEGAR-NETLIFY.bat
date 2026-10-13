@echo off
chcp 65001 >nul
title Desplegar EV2 Campus en Netlify
cd /d "%~dp0"

echo ============================================================
echo   EV2 CAMPUS - Despliegue en Netlify (sin GitHub)
echo ============================================================
echo.

REM -- 1. Verificar Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado.
  echo Descargalo de https://nodejs.org ^(version LTS^), instalalo
  echo y vuelve a hacer doble clic en este archivo.
  pause
  exit /b 1
)
echo [OK] Node.js detectado:
node --version

REM -- 2. Instalar Netlify CLI si falta
where netlify >nul 2>nul
if errorlevel 1 (
  echo.
  echo Instalando Netlify CLI ^(solo la primera vez, 1-2 min^)...
  call npm install -g netlify-cli
)
echo [OK] Netlify CLI listo.

REM -- 3. Instalar dependencias del proyecto si faltan
if not exist "node_modules" (
  echo.
  echo Instalando dependencias del proyecto ^(solo la primera vez^)...
  call npm install
)

REM -- 4. Login (abre el navegador solo si no hay sesion)
echo.
echo Verificando sesion de Netlify...
call netlify status >nul 2>nul
if errorlevel 1 (
  echo Se abrira el navegador para iniciar sesion en Netlify.
  call netlify login
)

REM -- 5. Desplegar (la primera vez pregunta: elegir "Create & configure a new project")
echo.
echo ============================================================
echo   Compilando y desplegando... (3-6 minutos)
echo   Si es la primera vez, responde las preguntas:
echo     - "Create ^& configure a new project"
echo     - Team: el de tu cuenta  -  Nombre: ev2-campus
echo ============================================================
echo.
call netlify deploy --build --prod

echo.
echo ============================================================
echo   Si arriba aparece "Website URL", el despliegue quedo listo.
echo   Para publicar cambios futuros: doble clic a este archivo.
echo ============================================================
pause
