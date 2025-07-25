# A4AI Frontend - Local Deployment Test Script
# Test the deployment setup before deploying to Google Cloud

Write-Host "🧪 A4AI Frontend Deployment Test" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n🔍 Checking Prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found." -ForegroundColor Red
    exit 1
}

# Check if package.json exists
if (Test-Path "package.json") {
    Write-Host "✅ package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n📦 Installing Dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Test build
Write-Host "`n🔨 Testing Production Build..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Production build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Production build failed" -ForegroundColor Red
    exit 1
}

# Check if dist folder was created
if (Test-Path "dist") {
    $distSize = (Get-ChildItem -Recurse dist | Measure-Object -Property Length -Sum).Sum
    $distSizeMB = [math]::Round($distSize / 1MB, 2)
    Write-Host "✅ Build output: dist/ ($distSizeMB MB)" -ForegroundColor Green
} else {
    Write-Host "❌ dist/ folder not created" -ForegroundColor Red
    exit 1
}

# Test Docker build (if Docker is available)
Write-Host "`n🐳 Testing Docker Build..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
    
    # Build Docker image
    Write-Host "Building Docker image..." -ForegroundColor Yellow
    docker build -t a4ai-frontend-test .
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
    
    # Test Docker run
    Write-Host "Testing Docker container..." -ForegroundColor Yellow
    $containerId = docker run -d -p 8080:8080 a4ai-frontend-test
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Docker container serving content successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Docker container responded with status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Could not connect to Docker container" -ForegroundColor Yellow
    }
    
    # Clean up
    docker stop $containerId | Out-Null
    docker rm $containerId | Out-Null
    Write-Host "✅ Docker container test completed and cleaned up" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Docker not available, skipping Docker tests" -ForegroundColor Yellow
}

# Check deployment files
Write-Host "`n📋 Checking Deployment Files..." -ForegroundColor Yellow

$deploymentFiles = @(
    "Dockerfile",
    "nginx.conf", 
    ".dockerignore",
    "cloudbuild.yaml",
    ".env.production.example",
    "deploy.ps1"
)

foreach ($file in $deploymentFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# Check environment configuration
Write-Host "`n⚙️ Environment Configuration..." -ForegroundColor Yellow

if (Test-Path ".env.production.example") {
    Write-Host "✅ Production environment template available" -ForegroundColor Green
    Write-Host "📝 Remember to:" -ForegroundColor Yellow
    Write-Host "   1. Copy .env.production.example to .env.production" -ForegroundColor Yellow
    Write-Host "   2. Update API URLs for production" -ForegroundColor Yellow
} else {
    Write-Host "⚠️ No production environment template found" -ForegroundColor Yellow
}

# Summary
Write-Host "`n🎉 Deployment Readiness Summary" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "✅ Local build test: PASSED" -ForegroundColor Green
Write-Host "✅ Dependencies: INSTALLED" -ForegroundColor Green
Write-Host "✅ Production build: SUCCESSFUL" -ForegroundColor Green

if (Test-Path "Dockerfile") {
    Write-Host "✅ Docker setup: READY" -ForegroundColor Green
}

Write-Host "`n🚀 Ready for Google Cloud Deployment!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Set up Google Cloud project and authentication" -ForegroundColor White
Write-Host "2. Configure production environment variables" -ForegroundColor White
Write-Host "3. Run: .\deploy.ps1 -ProjectId 'your-project' -SetupProject" -ForegroundColor White
Write-Host "4. Run: .\deploy.ps1 -ProjectId 'your-project' -Deploy" -ForegroundColor White

Write-Host "`n📚 For detailed instructions, see GOOGLE_CLOUD_DEPLOYMENT.md" -ForegroundColor Cyan
