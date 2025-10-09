@echo off

setlocal enabledelayedexpansion

title Ceraiolo Digitale Server

echo ========================================
echo Ceraiolo Digitale - Avvio Server
echo ========================================
echo.

REM Controllo presenza Node.js
echo [1/4] Verifico presenza di Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js non trovato!
    echo.
    echo Tentativo di installazione automatica tramite Winget...
    echo Questo richiede alcuni minuti. Attendere...
    echo.
    
    REM Verifica se Winget è disponibile
    where winget >nul 2>nul
    if %errorlevel% neq 0 (
        echo ERRORE: Winget non è disponibile su questo sistema!
        echo.
        echo Per favore, scarica e installa Node.js manualmente da:
        echo https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
    
    REM Installa Node.js con Winget
    winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    
    if %errorlevel% neq 0 (
        echo.
        echo ERRORE: Installazione automatica di Node.js fallita!
        echo.
        echo Per favore, installa Node.js manualmente da:
        echo https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo ✓ Node.js installato con successo!
    echo.
    echo IMPORTANTE: È necessario riavviare questo script per applicare
    echo le modifiche alle variabili d'ambiente.
    echo.
    echo Chiudi questa finestra e riavvia il file start-server.bat
    echo.
    pause
    exit /b 0
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
