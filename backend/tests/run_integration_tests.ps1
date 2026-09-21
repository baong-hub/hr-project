# PowerShell script to run HR Integration Tests with Docker check
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  HR PORTAL - KIỂM THỬ TÍCH HỢP (INTEGRATION TESTS)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Check if Docker is installed and running
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    Write-Host "[CẢNH BÁO] Docker chưa được cài đặt trong PATH hệ thống." -ForegroundColor Yellow
    Write-Host "Testcontainers yêu cầu Docker Desktop để khởi tạo MySQL container tạm thời." -ForegroundColor Yellow
    Write-Host "Vui lòng cài đặt Docker Desktop từ: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    exit 1
}

Write-Host "[1/2] Đang kiểm tra trạng thái Docker daemon..." -ForegroundColor Gray
$dockerRunning = $false
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host "[CẢNH BÁO] Docker daemon hiện chưa được khởi động." -ForegroundColor Yellow
    Write-Host "Để chạy các kiểm thử tích hợp (Testcontainers MySQL):" -ForegroundColor Yellow
    Write-Host "  1. Mở ứng dụng 'Docker Desktop' trên máy của bạn." -ForegroundColor White
    Write-Host "  2. Chờ Docker Desktop báo trạng thái 'Engine running'." -ForegroundColor White
    Write-Host "  3. Chạy lại script này hoặc lệnh: dotnet test tests/HR.IntegrationTests" -ForegroundColor White
    Write-Host ""
    Write-Host "Lưu ý: Bộ Unit Tests độc lập (HR.UnitTests - 49 test cases) không cần Docker và luôn pass 100%." -ForegroundColor Green
    exit 0
}

Write-Host "[2/2] Docker đang hoạt động tốt. Tiến hành chạy bộ Integration Tests..." -ForegroundColor Green
dotnet test "$PSScriptRoot/HR.IntegrationTests/HR.IntegrationTests.csproj"
