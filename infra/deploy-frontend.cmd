@echo off
set "GITBASH=%ProgramFiles%\Git\bin\bash.exe"
if not exist "%GITBASH%" (
  echo Git Bash nao encontrado em "%GITBASH%". Instale o Git for Windows.
  exit /b 1
)
"%GITBASH%" "%~dp0deploy-frontend.sh" %*
