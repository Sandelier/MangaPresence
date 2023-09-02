@echo off
set "scriptdir=%~dp0"
cd /d "%scriptdir%..\"
set "parentdir=%cd%"

set "executablepath=%parentdir%\bin\MangaPresence.exe"

cd /d "%parentdir%\bin\"
"%executablepath%" ConsoleShow