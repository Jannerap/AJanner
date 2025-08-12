#!/usr/bin/env node

// Simple test script for the news ticker module
console.log('🧪 Testing Argyle News Ticker Module...\n');

// Test 1: Check if required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
    'news.txt',
    'lists/tech.txt',
    'server/fetchNews.js',
    'server/server.js',
    'web/ticker.js',
    'web/ticker.css',
    'web/index.html',
    'package.json'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Some required files are missing. Please check the installation.');
    process.exit(1);
}

console.log('\n✅ All required files found');

// Test 2: Check package.json dependencies
console.log('\n📦 Checking package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['express', 'feedparser-promised', 'axios', 'cheerio'];
    
    console.log('  Dependencies:');
    requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
            console.log(`    ✅ ${dep}: ${packageJson.dependencies[dep]}`);
        } else {
            console.log(`    ❌ ${dep}: MISSING`);
            allFilesExist = false;
        }
    });
    
    console.log('  Scripts:');
    if (packageJson.scripts) {
        ['fetch-news', 'dev'].forEach(script => {
            if (packageJson.scripts[script]) {
                console.log(`    ✅ ${script}: ${packageJson.scripts[script]}`);
            } else {
                console.log(`    ❌ ${script}: MISSING`);
                allFilesExist = false;
            }
        });
    }
    
} catch (error) {
    console.log(`  ❌ Failed to parse package.json: ${error.message}`);
    allFilesExist = false;
}

// Test 3: Check news.txt format
console.log('\n📰 Checking news.txt format...');
try {
    const newsContent = fs.readFileSync('news.txt', 'utf8');
    const lines = newsContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    console.log(`  Found ${lines.length} source lines:`);
    lines.forEach((line, index) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
            console.log(`    ${index + 1}. ${parts[0]} ${parts[1]}`);
        } else {
            console.log(`    ${index + 1}. INVALID: ${line}`);
            allFilesExist = false;
        }
    });
    
} catch (error) {
    console.log(`  ❌ Failed to read news.txt: ${error.message}`);
    allFilesExist = false;
}

// Test 4: Check if node_modules exists
console.log('\n📚 Checking dependencies...');
if (fs.existsSync('node_modules')) {
    console.log('  ✅ node_modules directory exists');
} else {
    console.log('  ❌ node_modules directory missing - run "npm install" first');
    allFilesExist = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
    console.log('🎉 All tests passed! The news ticker module is ready.');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run fetch-news');
    console.log('2. Run: npm run dev');
    console.log('3. Open your Argyle page to see the ticker');
} else {
    console.log('❌ Some tests failed. Please fix the issues above.');
    console.log('\n💡 Try running: ./install-news-ticker.sh');
}
console.log('='.repeat(50));
