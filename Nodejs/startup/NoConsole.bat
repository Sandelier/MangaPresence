@echo off
set "scriptdir=%~dp0"
cd /d "%scriptdir%..\"
set "parentdir=%cd%"

set "executablepath=%parentdir%\bin\bundled.exe"

cd /d "%parentdir%"
wscript.exe "%scriptdir%hidden.vbs" "%executablepath%"