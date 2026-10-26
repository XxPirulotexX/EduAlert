$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:8080"
$Stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$OutDir = Join-Path (Get-Location).Path "evidencias\pruebas\07_smoke"
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
$Log = Join-Path $OutDir "SM-01_Smoke_$Stamp.log"
$Results = [System.Collections.Generic.List[object]]::new()
$Token = $null

function Log($text) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $text"
    Add-Content -Path $Log -Value $line -Encoding UTF8
    Write-Host $line
}

function Test-Http {
    param(
        [string]$Id,
        [string]$Name,
        [string]$Path,
        [int[]]$Expected = @(200),
        [string]$Bearer = $null,
        [string]$Method = "GET",
        [object]$Body = $null
    )

    $headers = @{}
    if ($Bearer) { $headers["Authorization"] = "Bearer $Bearer" }

    $params = @{
        Uri             = "$BaseUrl$Path"
        Method          = $Method
        Headers         = $headers
        TimeoutSec      = 15
        UseBasicParsing = $true
        ErrorAction     = "Stop"
    }
    if ($null -ne $Body) {
        $params["ContentType"] = "application/json"
        $params["Body"] = ($Body | ConvertTo-Json -Compress)
    }

    $code = 0
    $content = ""
    try {
        $r = Invoke-WebRequest @params
        $code = [int]$r.StatusCode
        $content = [string]$r.Content
    }
    catch {
        if ($_.Exception.Response) {
            try {
                $code = [int]$_.Exception.Response.StatusCode
                $stream = $_.Exception.Response.GetResponseStream()
                if ($stream) {
                    $reader = [IO.StreamReader]::new($stream)
                    $content = $reader.ReadToEnd()
                    $reader.Dispose()
                }
            }
            catch {}
        }
    }

    $pass = $Expected -contains $code
    $result = if ($pass) { "OK" } else { "REVISAR" }
    Log "$Id | $Name | HTTP=$code | Esperado=$($Expected -join ',') | $result"

    # No guardar respuestas completas, credenciales ni tokens.
    $Results.Add([PSCustomObject]@{
            ID        = $Id
            Prueba    = $Name
            HTTP      = $code
            Esperado  = ($Expected -join ",")
            Resultado = $result
        })

    return @{
        Code    = $code
        Content = $content
        Pass    = $pass
    }
}

Log "============================================================"
Log "INICIO SM-01 - SMOKE TEST"
Log "Base URL: $BaseUrl"
Log "============================================================"

# SM-01A: base de datos
$db = Test-Http -Id "SM-01A" -Name "Conexion API a base de datos" `
    -Path "/api/health/db"

# SM-01B: salud del servicio ML mediante el backend
$ml = Test-Http -Id "SM-01B" -Name "Salud del servicio ML via API" `
    -Path "/api/ml/health"

# SM-01C: autenticacion con administrador
$email = Read-Host "Correo del administrador"
$secure = Read-Host "Contrasena del administrador" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)

try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    $loginBody = @{ correo = $email; password = $password }

    $login = Test-Http -Id "SM-01C" -Name "Login administrador" `
        -Path "/api/auth/login" -Method "POST" -Body $loginBody

    if ($login.Code -eq 200) {
        try {
            $loginData = $login.Content | ConvertFrom-Json
            $Token = [string]$loginData.accessToken
        }
        catch {}
    }
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    $secure.Dispose()
    $password = $null
    $loginBody = $null
}

if ($Token) {
    # SM-01D: identidad
    $me = Test-Http -Id "SM-01D" -Name "Consultar identidad autenticada" `
        -Path "/api/auth/me" -Bearer $Token

    # SM-01E: lectura de estudiantes
    $students = Test-Http -Id "SM-01E" -Name "Consultar estudiantes" `
        -Path "/api/estudiantes?pagina=0&tamano=5" -Bearer $Token

    # SM-01F: lectura de alertas
    $alerts = Test-Http -Id "SM-01F" -Name "Consultar alertas" `
        -Path "/api/alertas?pagina=0&tamano=5" -Bearer $Token
}
else {
    Log "SM-01D | OMITIDA: no se obtuvo token."
    Log "SM-01E | OMITIDA: no se obtuvo token."
    Log "SM-01F | OMITIDA: no se obtuvo token."
}

Log "============================================================"
Log "RESUMEN"
$Results | ForEach-Object {
    Log "$($_.ID) | $($_.Resultado) | HTTP=$($_.HTTP) | $($_.Prueba)"
}
$total = $Results.Count
$passed = @($Results | Where-Object Resultado -eq "OK").Count
$review = $total - $passed
Log "Ejecutadas: $total"
Log "Coinciden con lo esperado: $passed"
Log "Revisar: $review"
Log "Fin SM-01"
Log "Log: $Log"

# Resumen de consola; no imprimir el token.
$Token = $null
$Results | Format-Table -AutoSize
Write-Host "Log generado en: $Log"
