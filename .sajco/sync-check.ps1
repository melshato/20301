# =====================================================================
# sync-check.ps1 — مقارنة ملفات AR مع EN للتأكد من تطابق الدوال
# الاستخدام: .\sync-check.ps1
# =====================================================================

$ErrorActionPreference = 'SilentlyContinue'
$root    = Split-Path $MyInvocation.MyCommand.Path
$arDir   = $root
$enDir   = Join-Path $root "en"
$warnings = @()
$ok       = @()

# الأزواج المراد مقارنتها
$pairs = @(
    "app-core.js",
    "custody.html",
    "maintenance.html",
    "devices.html",
    "users.html",
    "branches.html",
    "calibration-alerts.html",
    "leave-request.html",
    "device-history.html",
    "user-custody-history.html",
    "employee-profile.html",
    "dashboard.html",
    "head-surveyor-dashboard.html",
    "notification-center.html"
)

# --- استخراج أسماء الدوال من نص ---
function Get-Functions($content) {
    $patterns = @(
        'function\s+(\w+)\s*\(',          # function foo(
        'window\.(\w+)\s*=\s*(async\s*)?\(', # window.foo = (
        'window\.(\w+)\s*=\s*(async\s*)?function', # window.foo = function
        'const\s+(\w+)\s*=\s*(async\s*)?\(', # const foo = (
        'async\s+function\s+(\w+)\s*\('   # async function foo(
    )
    $found = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($pat in $patterns) {
        $matches = [regex]::Matches($content, $pat)
        foreach ($m in $matches) {
            $name = $m.Groups[1].Value
            if ($name -and $name.Length -gt 2) { [void]$found.Add($name) }
        }
    }
    return $found
}

# --- مقارنة زوج ---
function Compare-Pair($filename) {
    $arPath = Join-Path $arDir $filename
    $enPath = Join-Path $enDir $filename

    if (-not (Test-Path $arPath)) {
        return @{ status='missing_ar'; file=$filename; msg="AR غير موجود: $filename" }
    }
    if (-not (Test-Path $enPath)) {
        return @{ status='missing_en'; file=$filename; msg="EN غير موجود: en/$filename" }
    }

    $arContent = Get-Content $arPath -Raw -Encoding UTF8
    $enContent = Get-Content $enPath -Raw -Encoding UTF8

    $arFuncs = Get-Functions $arContent
    $enFuncs = Get-Functions $enContent

    $onlyInAr = $arFuncs | Where-Object { -not $enFuncs.Contains($_) }
    $onlyInEn = $enFuncs | Where-Object { -not $arFuncs.Contains($_) }

    return @{
        status    = if ($onlyInAr.Count -eq 0 -and $onlyInEn.Count -eq 0) { 'ok' } else { 'diff' }
        file      = $filename
        onlyInAr  = @($onlyInAr)
        onlyInEn  = @($onlyInEn)
        arCount   = $arFuncs.Count
        enCount   = $enFuncs.Count
    }
}

# =====================================================================
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  SAJCO — AR / EN Sync Checker" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $pairs) {
    $result = Compare-Pair $file

    switch ($result.status) {
        'ok' {
            Write-Host "  OK  $file  ($($result.arCount) دوال)" -ForegroundColor Green
            $ok += $file
        }
        'missing_en' {
            Write-Host "  !!  $($result.msg)" -ForegroundColor Red
            $warnings += $result.msg
        }
        'missing_ar' {
            Write-Host "  !!  $($result.msg)" -ForegroundColor Red
            $warnings += $result.msg
        }
        'diff' {
            Write-Host "  >>  $file  (AR=$($result.arCount), EN=$($result.enCount))" -ForegroundColor Yellow
            if ($result.onlyInAr.Count -gt 0) {
                Write-Host "       موجودة في AR فقط: $($result.onlyInAr -join ', ')" -ForegroundColor Yellow
                $warnings += "$file — في AR فقط: $($result.onlyInAr -join ', ')"
            }
            if ($result.onlyInEn.Count -gt 0) {
                Write-Host "       موجودة في EN فقط: $($result.onlyInEn -join ', ')" -ForegroundColor DarkYellow
                $warnings += "$file — في EN فقط: $($result.onlyInEn -join ', ')"
            }
        }
    }
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  الملخص: $($ok.Count) متطابقة، $($warnings.Count) تحذير" -ForegroundColor $(if ($warnings.Count -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "======================================================" -ForegroundColor Cyan

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "  التحذيرات:" -ForegroundColor Red
    foreach ($w in $warnings) {
        Write-Host "    - $w" -ForegroundColor Red
    }
}
Write-Host ""
