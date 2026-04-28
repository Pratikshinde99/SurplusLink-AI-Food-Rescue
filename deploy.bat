@echo off
REM EcoFeed Deployment Script for Windows
REM Usage: deploy.bat [environment] [action]
REM Example: deploy.bat production up

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
set ACTION=%2

if "%ENVIRONMENT%"=="" set ENVIRONMENT=development
if "%ACTION%"=="" set ACTION=up

if "%ENVIRONMENT%"=="production" (
    set ENV_FILE=.env.production
    set COMPOSE_FILE=docker-compose.prod.yml
) else (
    set ENV_FILE=.env.local
    set COMPOSE_FILE=docker-compose.yml
)

echo.
echo ╔════════════════════════════════════════╗
echo ║       EcoFeed Deployment Script        ║
echo ╚════════════════════════════════════════╝
echo.

if not exist "%ENV_FILE%" (
    echo ✗ Error: %ENV_FILE% not found
    echo Please create %ENV_FILE% first. Use .env.example as a template.
    exit /b 1
)

echo ✓ Environment: %ENVIRONMENT%
echo ✓ Using config: %ENV_FILE%
echo ✓ Compose file: %COMPOSE_FILE%
echo.

if "%ACTION%"=="up" (
    echo Starting deployment...
    docker-compose -f %COMPOSE_FILE% up -d
    timeout /t 3
    echo.
    echo Verifying deployment...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -UseBasicParsing; Write-Host '✓ Backend is healthy' -ForegroundColor Green } catch { Write-Host '✗ Backend is not responding' -ForegroundColor Red }"
    echo.
    echo ╔════════════════════════════════════════╗
    echo ║      Deployment Complete! 🎉           ║
    echo ╚════════════════════════════════════════╝
    echo.
    echo Frontend: http://localhost:3000
    echo Backend:  http://localhost:8000
    echo API Docs: http://localhost:8000/docs
) else if "%ACTION%"=="down" (
    echo Stopping services...
    docker-compose -f %COMPOSE_FILE% down
) else if "%ACTION%"=="restart" (
    echo Restarting services...
    docker-compose -f %COMPOSE_FILE% restart
) else if "%ACTION%"=="rebuild" (
    echo Rebuilding images...
    docker-compose -f %COMPOSE_FILE% build --no-cache
    docker-compose -f %COMPOSE_FILE% up -d
) else if "%ACTION%"=="logs" (
    docker-compose -f %COMPOSE_FILE% logs -f
) else if "%ACTION%"=="ps" (
    docker-compose -f %COMPOSE_FILE% ps
) else (
    echo Unknown action: %ACTION%
    echo Available actions: up, down, restart, rebuild, logs, ps
    exit /b 1
)

endlocal
