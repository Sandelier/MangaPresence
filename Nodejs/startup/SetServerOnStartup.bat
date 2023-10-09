@echo off
chcp 1252 > nul
setlocal enabledelayedexpansion

REM Had to do it like this because I just couldn't get the parent folder any other way.
for %%i in ("%~dp0..") do set "ParentDirectory=%%~fi"

set "ShortcutName=MangaPresence.lnk"
set "TargetExePath=!ParentDirectory!\bin\MangaPresence.exe"
set "StartupFolder=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

set "ShortcutPath=%StartupFolder%\%ShortcutName%"
if exist "%ShortcutPath%" (
    echo Shortcut already exists at %ShortcutPath%
    choice /C YN /M "Do you want to remove the shortcut?"
    if errorlevel 2 (
        echo Shortcut will not be removed.
    ) else (
        del "%ShortcutPath%"
        echo Shortcut removed from %ShortcutPath%
    )
) else (
    echo Shortcut does not exist at %ShortcutPath%
    choice /C YN /M "Do you want to add the shortcut?"
    if errorlevel 2 (
        echo Shortcut will not be added.
    ) else (
        echo Creating shortcut...
        (
        echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
        echo sLinkFile = "%ShortcutPath%"
        echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
        echo oLink.TargetPath = "%TargetExePath%"
        echo oLink.Save
        ) > CreateShortcut.vbs
        cscript /nologo CreateShortcut.vbs
        del CreateShortcut.vbs
        echo Shortcut created at %ShortcutPath%
    )
)

endlocal