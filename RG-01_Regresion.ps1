
# ============================================================
# RG-01 - Regresion automatizada de EduAlerta
# Verifica flujos ya probados sin modificar datos.
# Requiere backend activo en localhost:8080.
# ============================================================

$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:8080"
$Stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$OutDir = Join-Path (Get-Location).Path "evidencias\pruebas\08_regresion"

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
$Log = Join-Path $OutDir "RG-01_Regresion_$Stamp.log"
$Results = [System.Collections.Generic.List[object]]::new()

function Log([string]$Message) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Add-Content -Path $Log -Value $line -Encoding UTF8
    Write-Host $line
}

function Read-SecretText([string]$Prompt) {
    $secure = Read-Host $Prompt -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        $secure.Dispose()
    }
}

function Login-User {
    param([string]$Label, [string]$Email)

    $password = Read-SecretText "Contrasena para $Label ($Email)"
    try {
        $body = @{
            correo   = $Email
            password = $password
        }

        $response = Invoke-WebRequest `
            -Uri "$BaseUrl/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json -Compress) `
            -TimeoutSec 15 -UseBasicParsing

        $data = $response.Content | ConvertFrom-Json
        if ($response.StatusCode -eq 200 -and $data.accessToken) {
            Log "$Label | Login HTTP 200 | Token omitido del log"
            return [string]$data.accessToken
        }

        Log "$Label | Login sin token utilizable"
        return $null
    }
    catch {
        $code = 0
        if ($_.Exception.Response) {
            try { $code = [int]$_.Exception.Response.StatusCode } catch {}
        }
        Log "$Label | Login fallido | HTTP=$code"
        return $null
    }
    finally {
        $password = $null
        $body = $null
    }
}

function Test-Request {
    param(
        [string]$Id,
        [string]$Name,
        [string]$Path,
        [int[]]$Expected = @(200),
        [string]$Token = $null,
        [string]$Method = "GET",
        [object]$Body = $null,
        [scriptblock]$ValidateJson = $null
    )

    $headers = @{}
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

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
        $response = Invoke-WebRequest @params
        $code = [int]$response.StatusCode
        $content = [string]$response.Content
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
    $detail = ""

    if ($pass -and $ValidateJson -and $content) {
        try {
            $json = $content | ConvertFrom-Json
            $validation = & $ValidateJson $json
            if ($validation -ne $true) {
                $pass = $false
                $detail = "Estructura JSON no coincide con lo esperado"
            }
        }
        catch {
            $pass = $false
            $detail = "No se pudo validar JSON"
        }
    }

    $status = if ($pass) { "OK" } else { "REVISAR" }
    Log "$Id | $Name | HTTP=$code | Esperado=$($Expected -join ',') | $status"
    if ($detail) { Log "$Id | Detalle: $detail" }

    $Results.Add([PSCustomObject]@{
            ID        = $Id
            Prueba    = $Name
            HTTP      = $code
            Esperado  = ($Expected -join ",")
            Resultado = $status
            Detalle   = $detail
        })

    return @{
        Code    = $code
        Content = $content
        Pass    = $pass
    }
}

Log "============================================================"
Log "INICIO RG-01 - REGRESION"
Log "Base URL: $BaseUrl"
Log "Solo lectura; no se ejecutan operaciones CRUD."
Log "============================================================"

# RG-01A: salud de API y base de datos.
Test-Request -Id "RG-01A" `
    -Name "Conectividad API y base de datos" `
    -Path "/api/health/db" `
    -ValidateJson {
    param($j)
    return ($j.status -eq "ok" -and $j.database -eq "edualerta")
} | Out-Null

# RG-01B: autenticacion sin token debe rechazarse.
Test-Request -Id "RG-01B" `
    -Name "Ruta de identidad sin token" `
    -Path "/api/auth/me" `
    -Expected @(401, 403) | Out-Null

# RG-01C: token invalido debe rechazarse.
Test-Request -Id "RG-01C" `
    -Name "Ruta de identidad con token invalido" `
    -Path "/api/auth/me" -Token "token-invalido" `
    -Expected @(401, 403) | Out-Null

# RG-01D: autenticacion administrador.
$adminEmail = Read-Host "Correo del administrador"
$adminToken = Login-User -Label "ADMIN" -Email $adminEmail

if ($adminToken) {
    Test-Request -Id "RG-01D" `
        -Name "Identidad del administrador" `
        -Path "/api/auth/me" -Token $adminToken `
        -ValidateJson {
        param($j)
        return ($j.rol -eq "administrador" -and $j.estado -eq "activo")
    } | Out-Null

    Test-Request -Id "RG-01E" `
        -Name "Gestion de usuarios para administrador" `
        -Path "/api/admin/usuarios" -Token $adminToken `
        -ValidateJson {
        param($j)
        return ($null -ne $j.content -and $null -ne $j.totalElements)
    } | Out-Null

    Test-Request -Id "RG-01F" `
        -Name "Consulta de estudiantes" `
        -Path "/api/estudiantes?pagina=0&tamano=5" `
        -Token $adminToken `
        -ValidateJson {
        param($j)
        return ($null -ne $j.content -and $null -ne $j.totalElements)
    } | Out-Null

    Test-Request -Id "RG-01G" `
        -Name "Consulta de alertas" `
        -Path "/api/alertas?pagina=0&tamano=5" `
        -Token $adminToken `
        -ValidateJson {
        param($j)
        return ($null -ne $j.content -and $null -ne $j.totalElements)
    } | Out-Null

    # Esta ruta respondio 401 en la smoke sin token.
    # Ahora se consulta con el administrador autenticado.
    Test-Request -Id "RG-01H" `
        -Name "Salud del servicio ML con autenticacion" `
        -Path "/api/ml/health" -Token $adminToken `
        -ValidateJson {
        param($j)
        return ($j.status -eq "ok" -and
            $j.service -eq "edualerta-ml-service")
    } | Out-Null
}
else {
    Log "RG-01D a RG-01H OMITIDAS: login administrador fallido."
}

# RG-01I: usuario docente.
$docenteEmail = Read-Host "Correo del usuario docente de prueba"
$docenteToken = Login-User -Label "DOCENTE" -Email $docenteEmail

if ($docenteToken) {
    Test-Request -Id "RG-01I" `
        -Name "Identidad del docente" `
        -Path "/api/auth/me" -Token $docenteToken `
        -ValidateJson {
        param($j)
        return ($j.rol -eq "docente" -and $j.estado -eq "activo")
    } | Out-Null

    Test-Request -Id "RG-01J" `
        -Name "Docente no puede consultar gestion administrativa" `
        -Path "/api/admin/usuarios" -Token $docenteToken `
        -Expected @(403) | Out-Null
}
else {
    Log "RG-01I y RG-01J OMITIDAS: login docente fallido."
}

# Resumen.
Log "============================================================"
Log "RESUMEN RG-01"
$Results | ForEach-Object {
    Log "$($_.ID) | $($_.Resultado) | HTTP=$($_.HTTP) | $($_.Prueba)"
}

$total = $Results.Count
$ok = @($Results | Where-Object Resultado -eq "OK").Count
$review = $total - $ok

Log "Casos registrados: $total"
Log "Correctos: $ok"
Log "Revisar: $review"
Log "Fin RG-01"
Log "Log guardado en: $Log"

Write-Host ""
$Results | Format-Table -AutoSize
Write-Host "Log: $Log"

$adminToken = $null
$docenteToken = $null
