#!/bin/bash
# CoupleApp - Setup Script

echo "🚀 CoupleApp Setup Started"
echo "========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ NPM found: $(npm --version)"
echo ""

# Install backend dependencies
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..
echo ""

# Install frontend dependencies
echo "📦 Installing Frontend Dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
echo ""

echo "✅ Setup Complete!"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "Terminal 1 - Start Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "Terminal 2 - Start Frontend:"
echo "   npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser 💕"
echo ""
