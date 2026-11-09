@echo off
rem Executa infra/deploy-backend.sh com o Git Bash (o "bash" do PowerShell abre o WSL).
set "GITBASH=%ProgramFiles%\Git\bin\bash.exe"
if not exist "%GITBASH%" (
  echo Git Bash nao encontrado em "%GITBASH%". Instale o Git for Windows.
  exit /b 1
)
"%GITBASH%" "%~dp0deploy-backend.sh" %*
