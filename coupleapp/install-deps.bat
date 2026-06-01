@echo off
echo Installing Backend Dependencies...
cd backend
call npm install
echo.
echo Installing Frontend Dependencies...
cd ..
call npm install
echo.
echo ============================================
echo Dependencies installed successfully!
echo.
echo Next steps:
echo 1. Terminal 1: cd backend && npm run dev
echo 2. Terminal 2: npm run dev
echo.
echo Then test the app at http://localhost:5173
echo ============================================
