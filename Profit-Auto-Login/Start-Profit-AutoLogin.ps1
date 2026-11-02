[CmdletBinding()]
param(
    [ValidateRange(1, 5)]
    [int]$SoLanThu = 3
)

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'Profit Auto Login'

Write-Host ''
Write-Host 'PROFIT AUTO LOGIN' -ForegroundColor Cyan
Write-Host 'Thông tin đăng nhập chỉ được nhập vào hộp thoại Windows và dùng trong bộ nhớ.' -ForegroundColor DarkGray
Write-Host 'Công cụ chỉ thử lại khi lỗi kết nối tạm thời; không lặp lại khi sai mật khẩu.' -ForegroundColor DarkGray
Write-Host ''

$credential = Get-Credential -Message 'Nhập User ID và mật khẩu Profit'
if ($null -eq $credential) {
    Write-Host 'Đã hủy.' -ForegroundColor Yellow
    exit 0
}

$payload = @{
    user     = $credential.UserName
    password = $credential.GetNetworkCredential().Password
} | ConvertTo-Json -Compress

try {
    $payload | & node (Join-Path $PSScriptRoot 'profit-auto-login.js') $SoLanThu
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Remove-Variable payload, credential -ErrorAction SilentlyContinue
}

