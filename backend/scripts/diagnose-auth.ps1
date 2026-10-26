[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://localhost:8080/api'
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')
$securePassword = $null
$passwordPlain = $null
$bstr = [IntPtr]::Zero
$accessToken = $null
$exitCode = 0
$loginSucceeded = $false

function Get-HttpStatus {
    param([Parameter(Mandatory = $true)]$ErrorRecord)
    try { return [int]$ErrorRecord.Exception.Response.StatusCode } catch { return 0 }
}

try {
    Write-Host 'Diagnostico de autenticacion EduAlerta. No se mostrara el JWT ni la contrasena.' -ForegroundColor Cyan
    $email = Read-Host 'Correo de la cuenta ADMINISTRADOR o DOCENTE que falla'
    $securePassword = Read-Host 'Contrasena' -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    $loginBody = @{ correo = $email.Trim(); password = $passwordPlain } | ConvertTo-Json -Compress

    try {
        $login = Invoke-RestMethod -Uri ($BaseUrl + '/auth/login') -Method POST -ContentType 'application/json; charset=utf-8' -Body $loginBody -ErrorAction Stop
        $accessToken = [string]$login.accessToken
        if ([string]::IsNullOrWhiteSpace($accessToken)) {
            Write-Host 'FALLO: login no devolvio accessToken.' -ForegroundColor Red
            $exitCode = 1
        } else {
            $loginSucceeded = $true
            Write-Host ('PASS: POST /auth/login = 200; rol devuelto por API = {0}.' -f $login.user.rol) -ForegroundColor Green
        }
    } catch {
        $status = Get-HttpStatus -ErrorRecord $_
        Write-Host ('FALLO: POST /auth/login devolvio HTTP {0}.' -f $status) -ForegroundColor Red
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
        Write-Host 'El backend no acepto las credenciales o la cuenta no esta activa. Revisa logs de api.'
        $exitCode = 1
    }

    $passwordPlain = $null
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    $bstr = [IntPtr]::Zero
    if ($securePassword) { $securePassword.Dispose() }
    $securePassword = $null
    $loginBody = $null
    $login = $null

    if ($loginSucceeded) {
        $headers = @{ Authorization = ('Bearer ' + $accessToken); Accept = 'application/json' }
        $checks = @(
            @{ Path = '/auth/me'; Name = 'GET /auth/me' },
            @{ Path = '/alertas?pagina=0&tamano=1'; Name = 'GET /alertas' }
        )
        foreach ($check in $checks) {
            try {
                $null = Invoke-RestMethod -Uri ($BaseUrl + $check.Path) -Method GET -Headers $headers -ErrorAction Stop
                Write-Host ('PASS: {0} = 200.' -f $check.Name) -ForegroundColor Green
            } catch {
                $status = Get-HttpStatus -ErrorRecord $_
                Write-Host ('FALLO: {0} devolvio HTTP {1}.' -f $check.Name, $status) -ForegroundColor Red
                if ($_.ErrorDetails -and $_.ErrorDetails.Message) { Write-Host ('Respuesta: {0}' -f $_.ErrorDetails.Message) }
                $exitCode = 1
            }
        }

        Write-Host ''
        Write-Host 'Interpretacion:' -ForegroundColor Cyan
        Write-Host '- Si /auth/me y /alertas devuelven 200, backend y JWT funcionan; revisar localStorage/Authorization del navegador.'
        Write-Host '- Si /auth/login da 200 pero /auth/me da 401, revisar validacion JWT, JWT_SECRET y estado de la cuenta en PostgreSQL.'
        Write-Host '- Si /auth/me da 200 y /alertas da 403, la autenticacion funciona y el problema es el permiso del rol.'
    }
} catch {
    Write-Host ('Error inesperado del diagnostico: {0}' -f $_.Exception.Message) -ForegroundColor Red
    $exitCode = 1
} finally {
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    if ($securePassword) { $securePassword.Dispose() }
    $passwordPlain = $null
    $accessToken = $null
}

if ($exitCode -ne 0) { exit $exitCode }
