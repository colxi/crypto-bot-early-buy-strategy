@echo off
if exist node_modules\ (
  CALL yarn start:server  
) else (
  echo Initializing dependencies...
  CALL yarn
  CALL yarn start:server
)
exit