[CmdletBinding()]
param([string]$BaseUrl = 'http://localhost:8080/api')

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')
$securePassword = $null
$passwordPlain = $null
$bstr = [IntPtr]::Zero
$token = $null
$exitCode = 0

function Get-HttpStatus {
    param($ErrorRecord)
    try { return [int]$ErrorRecord.Exception.Response.StatusCode } catch { return 0 }
}

function Get-ShortErrorBody {
    param($ErrorRecord)
    if ($ErrorRecord.ErrorDetails -and $ErrorRecord.ErrorDetails.Message) {
        $message = [string]$ErrorRecord.ErrorDetails.Message
        try {
            $json = $message | ConvertFrom-Json -ErrorAction Stop
            if ($json.message) { return [string]$json.message }
            if ($json.error) { return [string]$json.error }
        } catch { }
        return ($message -replace '\s+', ' ').Substring(0, [Math]::Min(180, ($message -replace '\s+', ' ').Length))
    }
    return [string]$ErrorRecord.Exception.Message
}

try {
    Write-Host 'Diagnóstico de endpoints EduAlerta. No se imprimen contraseña ni JWT.' -ForegroundColor Cyan
    $email = Read-Host 'Correo de la cuenta con la que inicias sesión'
    $securePassword = Read-Host 'Contraseña' -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    $body = @{ correo = $email.Trim(); password = $passwordPlain } | ConvertTo-Json -Compress

    try {
        $login = Invoke-RestMethod -Uri ($BaseUrl + '/auth/login') -Method POST -ContentType 'application/json; charset=utf-8' -Body $body -ErrorAction Stop
        $token = [string]$login.accessToken
        if ([string]::IsNullOrWhiteSpace($token)) { throw 'El endpoint de login no devolvió accessToken.' }
        $role = [string]$login.user.rol
        Write-Host ('PASS  POST /auth/login     HTTP 200 | rol={0}' -f $role) -ForegroundColor Green
    } catch {
        Write-Host ('FAIL  POST /auth/login     HTTP {0} | {1}' -f (Get-HttpStatus $_), (Get-ShortErrorBody $_)) -ForegroundColor Red
        $exitCode = 1
        return
    } finally {
        $passwordPlain = $null
        $body = $null
        $login = $null
        if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
        $bstr = [IntPtr]::Zero
        if ($securePassword) { $securePassword.Dispose() }
        $securePassword = $null
    }

    $headers = @{ Authorization = ('Bearer ' + $token); Accept = 'application/json' }
    $checks = @(
        @{ Path = '/auth/me'; Name = 'GET /auth/me'; AdminOnly = $false },
        @{ Path = '/estudiantes?pagina=0&tamano=1'; Name = 'GET /estudiantes'; AdminOnly = $false },
        @{ Path = '/alertas?pagina=0&tamano=1'; Name = 'GET /alertas'; AdminOnly = $false },
        @{ Path = '/resultados-academicos?pagina=0&tamano=1'; Name = 'GET /resultados-academicos'; AdminOnly = $false },
        @{ Path = '/analitica/resumen'; Name = 'GET /analitica/resumen'; AdminOnly = $false },
        @{ Path = '/ml/health'; Name = 'GET /ml/health'; AdminOnly = $false },
        @{ Path = '/ml/datasets'; Name = 'GET /ml/datasets'; AdminOnly = $false },
        @{ Path = '/admin/usuarios?pagina=0&tamano=1'; Name = 'GET /admin/usuarios'; AdminOnly = $true }
    )

    foreach ($check in $checks) {
        try {
            $null = Invoke-RestMethod -Uri ($BaseUrl + $check.Path) -Method GET -Headers $headers -ErrorAction Stop
            Write-Host ('PASS  {0,-30} HTTP 200' -f $check.Name) -ForegroundColor Green
        } catch {
            $status = Get-HttpStatus $_
            $detail = Get-ShortErrorBody $_
            if ($check.AdminOnly -and $role -ne 'administrador' -and $status -eq 403) {
                Write-Host ('INFO  {0,-30} HTTP 403 (esperado para rol {1})' -f $check.Name, $role) -ForegroundColor Yellow
            } else {
                $color = if ($status -eq 500 -or $status -eq 401 -or $status -eq 403) { 'Red' } else { 'Yellow' }
                Write-Host ('FAIL  {0,-30} HTTP {1} | {2}' -f $check.Name, $status, $detail) -ForegroundColor $color
                $exitCode = 1
            }
        }
    }

    Write-Host ''
    Write-Host 'Interpretación:' -ForegroundColor Cyan
    Write-Host '- HTTP 500 en listados: revisar consulta/repositorio SQL; no equivale a sesión vencida.'
    Write-Host '- HTTP 401 en endpoint protegido: el backend no acepta el JWT que recibe.'
    Write-Host '- HTTP 403: el JWT fue aceptado, pero ese rol no tiene permiso.'
    Write-Host '- HTTP 502/503 en ML: revisar el contenedor ml-service; no debería cerrar sesión.'
} catch {
    Write-Host ('Error del diagnóstico: {0}' -f $_.Exception.Message) -ForegroundColor Red
    $exitCode = 1
} finally {
    $passwordPlain = $null
    $token = $null
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    if ($securePassword) { $securePassword.Dispose() }
}

if ($exitCode -ne 0) { exit $exitCode }
