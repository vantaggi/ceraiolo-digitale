@echo off
setlocal enabledelayedexpansion

title Ceraiolo Digitale Server
echo ========================================
echo    Ceraiolo Digitale - Avvio Server
echo ========================================
echo.

REM Controllo presenza Node.js
echo [1/4] Verifico presenza di Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRORE: Node.js non è installato!
    echo.
    echo Per favore, scarica e installa Node.js da:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✓ Node.js trovato

REM Controllo presenza npm
echo [2/4] Verifico presenza di npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRORE: npm non è installato!
    echo.
    echo npm dovrebbe essere incluso con Node.js.
    echo Riprova dopo aver reinstallato Node.js.
    echo.
    pause
    exit /b 1
)
echo ✓ npm trovato

REM Controllo e installazione serve
echo [3/4] Verifico presenza del server 'serve'...
where serve >nul 2>nul
if %errorlevel% neq 0 (
    echo Server 'serve' non trovato. Installazione in corso...
    echo Questo potrebbe richiedere qualche minuto...
    npm install -g serve
    if %errorlevel% neq 0 (
        echo ERRORE: Installazione di 'serve' fallita!
        pause
        exit /b 1
    )
    echo ✓ Server 'serve' installato con successo
) else (
    echo ✓ Server 'serve' già installato
)

REM Avvio del server
echo.
echo [4/4] Avvio del server per Ceraiolo Digitale...
echo ========================================
echo Server in avvio...
echo.
echo Una volta avviato, apri il browser all'indirizzo:
echo http://localhost:3000
echo.
echo Premi Ctrl+C per fermare il server
echo ========================================

REM Avvia il server in background e apri il browser
start /B serve -s -p 3000
timeout /t 3 /nobreak >nul
start http://localhost:3000

REM Mantieni la finestra aperta
echo.
echo Server avviato! La finestra rimarrà aperta.
echo Premi un tasto qualsiasi per chiudere...
pause >nul