@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo   NNLOMNE Notify - Validation complete
echo ================================================
echo.
echo [1/3] npm install ...
call npm install
if errorlevel 1 goto :error
echo.
echo [2/3] npm test ...
call npm test
if errorlevel 1 goto :error
echo.
echo [3/3] npm run build ...
call npm run build
if errorlevel 1 goto :error
echo.
echo ================================================
echo   OK - installation, tests et build OK
echo ================================================
pause
exit /b 0

:error
echo.
echo ================================================
echo   ERREUR - une etape a echoue (voir au-dessus)
echo ================================================
pause
exit /b 1
