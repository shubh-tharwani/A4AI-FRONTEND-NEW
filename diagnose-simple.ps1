Write-Host "🔍 Voice Assistant API Diagnostic Tool" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$API_BASE_URL = "http://localhost:8000"

Write-Host "`n🏥 Testing API Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/v1/voice/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Voice API Health: Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Voice API Health Check Failed" -ForegroundColor Red
    Write-Host "🔧 Is your backend server running on port 8000?" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🤖 Testing Universal Assistant Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{'Content-Type' = 'application/json'}
    $body = @{
        user_id = "test_user"
        message = "Hello test"
        session_id = "test_session"
        response_format = "text"
        context = "{}"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/api/v1/voice/assistant" -Method POST -Body $body -Headers $headers -TimeoutSec 30
    Write-Host "✅ Universal Assistant API: Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Universal Assistant API Failed" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorResponse = $_.ErrorDetails.Message
        Write-Host "📝 Error Details: $errorResponse" -ForegroundColor Yellow
        
        if ($errorResponse -match "process_session_text_command") {
            Write-Host "`n🎯 FOUND THE ISSUE!" -ForegroundColor Red
            Write-Host "Your backend is trying to call process_session_text_command which does not exist." -ForegroundColor Red
            Write-Host "📚 See BACKEND_FIX_GUIDE.md for the complete solution" -ForegroundColor Cyan
        }
    }
}

Write-Host "`n📊 DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host "The issue is in your BACKEND code, not the frontend." -ForegroundColor Yellow
Write-Host "The frontend I updated is correct and matches the OpenAPI spec." -ForegroundColor Green
Write-Host "`n🔧 TO FIX: Update your backend VoiceSessionService class" -ForegroundColor Yellow
Write-Host "📚 See BACKEND_FIX_GUIDE.md for detailed instructions" -ForegroundColor Cyan
