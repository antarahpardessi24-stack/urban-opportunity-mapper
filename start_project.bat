
@echo off
title Urban Opportunity Mapper

cd /d "D:\Career\Urban Opportunity Mapper"

if not exist ".venv\Scripts\python.exe" (
    echo ERROR: Python virtual environment not found.
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: Frontend package.json not found.
    pause
    exit /b 1
)

start "UOM Backend" cmd /k "cd /d ""D:\Career\Urban Opportunity Mapper"" && call .venv\Scripts\activate.bat && python -m uvicorn backend.main:app --reload"

timeout /t 3 /nobreak >nul

start "UOM Frontend" cmd /k "cd /d ""D:\Career\Urban Opportunity Mapper\frontend"" && npm run dev"

pause
