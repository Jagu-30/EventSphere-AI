# EventSphere-AI - Local Dev Environment Bootstrapper (No Docker Needed)
# This script sets up python virtualenvs, installs dependencies, and boots the backend, realtime, and frontend servers.

$baseDir = Get-Location

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   Bootstrapping EventSphere-AI Locally     " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Start Main Backend
Write-Host "`n[1/3] Setting up Main Backend..." -ForegroundColor Green
cd "$baseDir\backend"
if (-not (Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment (.venv)..." -ForegroundColor Gray
    python -m venv .venv
}
Write-Host "Activating virtual environment & installing requirements..." -ForegroundColor Gray
& .venv\Scripts\pip install -r requirements.txt

# Start Backend in a new window
Write-Host "Starting FastAPI Main Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend'; .venv\Scripts\activate; uvicorn app.main:app --reload --port 8000"

# 2. Start Realtime Socket.IO Service
Write-Host "`n[2/3] Setting up Realtime Booking Sync Service..." -ForegroundColor Green
cd "$baseDir\services\booking-service"
Write-Host "Installing npm packages for realtime service..." -ForegroundColor Gray
npm install
# Start Realtime in a new window
Write-Host "Starting Socket.IO Realtime Service on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\services\booking-service'; npm start"

# 3. Start Frontend
Write-Host "`n[3/3] Setting up Next.js 15 Frontend..." -ForegroundColor Green
cd "$baseDir\frontend"
Write-Host "Installing npm packages for Next.js frontend..." -ForegroundColor Gray
npm install
# Start Frontend in a new window
Write-Host "Starting Next.js Dev Server on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\frontend'; npm run dev"

cd $baseDir
Write-Host "`n=============================================" -ForegroundColor Green
Write-Host " All services triggered successfully! " -ForegroundColor Green
Write-Host " - FastAPI docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host " - Frontend portal: http://localhost:3000" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
