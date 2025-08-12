#!/bin/bash

# Argyle News Ticker Installation Script
echo "🚀 Installing Argyle News Ticker Module..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create cache directory
echo "📁 Creating cache directory..."
mkdir -p server/cache

# Test news fetching
echo "🔍 Testing news fetching..."
npm run fetch-news

if [ $? -eq 0 ]; then
    echo "✅ News fetching test successful"
else
    echo "⚠️  News fetching test failed (this is normal for first run)"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit news.txt to configure your news sources"
echo "2. Start the server: npm run dev"
echo "3. Open your Argyle page to see the ticker"
echo ""
echo "📚 For more information, see NEWS_TICKER_README.md"
echo ""
echo "🚀 Happy news tickering!"
