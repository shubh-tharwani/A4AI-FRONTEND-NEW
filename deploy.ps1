# A4AI Frontend - Google Cloud Deployment Script
# Run this script to deploy your application to Google Cloud Run

param(
    [string]$ProjectId = "",
    [string]$Region = "us-central1",
    [string]$ServiceName = "a4ai-frontend",
    [switch]$SetupProject,
    [switch]$Deploy,
    [switch]$Help
)

function Show-Help {
    Write-Host @"
A4AI Frontend Google Cloud Deployment Script

Usage:
    .\deploy.ps1 -ProjectId "your-project-id" -Deploy
    .\deploy.ps1 -ProjectId "your-project-id" -SetupProject
    .\deploy.ps1 -Help

Parameters:
    -ProjectId      Google Cloud Project ID (required)
    -Region         Deployment region (default: us-central1)
    -ServiceName    Cloud Run service name (default: a4ai-frontend)
    -SetupProject   Setup new Google Cloud project with required APIs
    -Deploy         Deploy the application to Cloud Run
    -Help           Show this help message

Examples:
    # Setup a new project
    .\deploy.ps1 -ProjectId "a4ai-frontend-prod" -SetupProject

    # Deploy to existing project
    .\deploy.ps1 -ProjectId "a4ai-frontend-prod" -Deploy

    # Deploy with custom settings
    .\deploy.ps1 -ProjectId "my-project" -Region "europe-west1" -ServiceName "my-app" -Deploy
"@
}

function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check gcloud CLI
    try {
        gcloud --version | Out-Null
        Write-Host "✅ Google Cloud CLI is installed" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Google Cloud CLI not found. Please install it from https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
        exit 1
    }

    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js is installed ($nodeVersion)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Node.js not found. Please install Node.js 18 or higher" -ForegroundColor Red
        exit 1
    }

    # Check if logged in to gcloud
    try {
        $currentAccount = gcloud auth list --filter=status:ACTIVE --format="value(account)"
        if ($currentAccount) {
            Write-Host "✅ Logged in to Google Cloud as: $currentAccount" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Not logged in to Google Cloud. Run 'gcloud auth login'" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ Error checking Google Cloud authentication" -ForegroundColor Red
        exit 1
    }
}

function Initialize-Project {
    param([string]$ProjectId)
    
    Write-Host "🚀 Setting up Google Cloud project: $ProjectId" -ForegroundColor Yellow
    
    # Set project
    gcloud config set project $ProjectId
    
    # Enable required APIs
    Write-Host "🔧 Enabling required APIs..." -ForegroundColor Yellow
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable storage.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    
    Write-Host "✅ Project setup complete!" -ForegroundColor Green
}

function Start-Deployment {
    param(
        [string]$ProjectId,
        [string]$Region,
        [string]$ServiceName
    )
    
    Write-Host "🚀 Deploying A4AI Frontend to Google Cloud Run..." -ForegroundColor Yellow
    
    # Set project
    gcloud config set project $ProjectId
    
    # Build and deploy
    Write-Host "📦 Building and deploying application..." -ForegroundColor Yellow
    
    gcloud run deploy $ServiceName `
        --source . `
        --platform managed `
        --region $Region `
        --allow-unauthenticated `
        --port 8080 `
        --memory 512Mi `
        --cpu 1 `
        --min-instances 0 `
        --max-instances 100 `
        --set-env-vars "NODE_ENV=production"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        
        # Get service URL
        $serviceUrl = gcloud run services describe $ServiceName --region=$Region --format="value(status.url)"
        Write-Host "🌐 Your application is available at: $serviceUrl" -ForegroundColor Cyan
        
        Write-Host @"

🎉 Deployment Summary:
- Project: $ProjectId
- Service: $ServiceName
- Region: $Region
- URL: $serviceUrl

Next steps:
1. Test your application at the URL above
2. Configure custom domain (optional)
3. Set up monitoring and alerts
4. Configure CI/CD pipeline
"@ -ForegroundColor Green
    }
    else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
}

# Main script logic
if ($Help) {
    Show-Help
    exit 0
}

if (-not $ProjectId) {
    Write-Host "❌ Project ID is required. Use -Help for usage information." -ForegroundColor Red
    exit 1
}

Test-Prerequisites

if ($SetupProject) {
    Initialize-Project -ProjectId $ProjectId
}

if ($Deploy) {
    Start-Deployment -ProjectId $ProjectId -Region $Region -ServiceName $ServiceName
}

if (-not $SetupProject -and -not $Deploy) {
    Write-Host "❌ Please specify either -SetupProject or -Deploy. Use -Help for usage information." -ForegroundColor Red
    exit 1
}
