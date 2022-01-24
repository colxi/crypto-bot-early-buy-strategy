@echo off
if exist node_modules\ (
  CALL yarn start:once  
) else (
  echo Initializing dependencies...
  CALL yarn
  CALL yarn start:once
)
exit