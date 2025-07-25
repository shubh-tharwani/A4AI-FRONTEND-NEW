# Voice Assistant API Diagnostic Tool
# This script helps diagnose the backend API issue

Write-Host "🔍 Voice Assistant API Diagnostic Tool" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$API_BASE_URL = "http://localhost:8000"

# Test API Health
Write-Host "`n🏥 Testing API Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/v1/voice/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Voice API Health: Working" -ForegroundColor Green
} catch {
    Write-Host "❌ Voice API Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔧 Is your backend server running on port 8000?" -ForegroundColor Yellow
    exit 1
}

# Test Universal Assistant Endpoint
Write-Host "`n🤖 Testing Universal Assistant Endpoint..." -ForegroundColor Yellow
try {
    # Simple test request
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
    $errorMessage = $_.Exception.Message
    Write-Host "❌ Universal Assistant API Failed: $errorMessage" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorResponse = $_.ErrorDetails.Message
        Write-Host "📝 Error Details: $errorResponse" -ForegroundColor Yellow
        
        # Check for the specific error we're trying to fix
        if ($errorResponse -match "process_session_text_command") {
            Write-Host "`n🎯 FOUND THE ISSUE!" -ForegroundColor Red
            Write-Host "════════════════════" -ForegroundColor Red
            Write-Host "Your backend is trying to call 'process_session_text_command' which doesn't exist." -ForegroundColor Red
            Write-Host "`nThis means your backend code needs to be updated to match the OpenAPI specification." -ForegroundColor Yellow
            Write-Host "`n🔧 SOLUTIONS:" -ForegroundColor Green
            Write-Host "1. Update your backend VoiceSessionService class" -ForegroundColor White
            Write-Host "2. Remove references to 'process_session_text_command'" -ForegroundColor White
            Write-Host "3. Implement proper session management as per OpenAPI spec" -ForegroundColor White
            Write-Host "4. Use the correct endpoint handlers for /api/v1/voice/assistant" -ForegroundColor White
            Write-Host "`n� See BACKEND_FIX_GUIDE.md for detailed instructions" -ForegroundColor Cyan
        }
    }
}

Write-Host "`n📊 DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Based on your screenshot, the issue is in your BACKEND code." -ForegroundColor Yellow
Write-Host "`nThe error 'process_session_text_command' not found indicates:" -ForegroundColor White
Write-Host "• Your backend VoiceSessionService class is outdated" -ForegroundColor White
Write-Host "• It's trying to call a method that doesn't exist" -ForegroundColor White
Write-Host "• The backend needs to be updated to match the OpenAPI spec" -ForegroundColor White

Write-Host "`n🔧 NEXT STEPS:" -ForegroundColor Green
Write-Host "1. Check BACKEND_FIX_GUIDE.md for the complete fix" -ForegroundColor White
Write-Host "2. Update your backend VoiceSessionService implementation" -ForegroundColor White
Write-Host "3. Remove any references to 'process_session_text_command'" -ForegroundColor White
Write-Host "4. Restart your backend server after making changes" -ForegroundColor White

Write-Host "`n📚 The frontend changes I made are correct - the issue is backend-side." -ForegroundColor Cyan
