@echo off
set "regPath=HKCU\Software\Microsoft\Windows\CurrentVersion\Run"
set "scriptPath=%~dp0/../bin/MangaPresence.exe"
set "scriptName=MangaPresenceStartUp"

set /p "action=Enter 'add' to add the registry value or 'remove' to remove it: "

if not exist "%regPath%" (
    reg add "%regPath%" /f >nul 2>&1
)

if "%action%"=="add" (
    reg delete "%regPath%" /v "%scriptName%" /f >nul 2>&1

    reg add "%regPath%" /v "%scriptName%" /t REG_SZ /d "%scriptPath%" /f >nul 2>&1
    
    echo Registry value added successfully.
) else if "%action%"=="remove" (
    reg delete "%regPath%" /v "%scriptName%" /f >nul 2>&1
    if errorlevel 1 (
        echo Registry value does not exist.
    ) else (
        echo Registry value removed successfully.
    )
) else (
    echo Invalid action. Please enter 'add' or 'remove'.
)

pause