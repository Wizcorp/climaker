@ECHO OFF

SETLOCAL

SET "NODE_EXE=%~dp0\node.exe"
IF NOT EXIST "%NODE_EXE%" (
  SET "NODE_EXE=node"
  )

IF EXIST "%~dp0\climaker-cli.js" (
  "%NODE_EXE%" "%~dp0\climaker-cli.js" %*
  )

IF EXIST "%~dp0\climaker-cli.js" (
  exit /b %ERRORLEVEL%
  )

SET "CLI_JS=%~dp0\node_modules\climaker\bin\climaker-cli.js"
FOR /F "delims=" %%F IN ('CALL "npm" prefix -g') DO (
  SET "PREFIX_CLI_JS=%%F\node_modules\climaker\bin\climaker-cli.js"
  )
IF EXIST "%PREFIX_CLI_JS%" (
  SET "CLI_JS=%PREFIX_CLI_JS%"
  )

IF EXIST "%~dp0\climaker-cli.js" (
  SET "CLI_JS=%~dp0\climaker-cli.js"
  )

"%NODE_EXE%" "%CLI_JS%" %*
