
# ============================================================
# IT-05 - Pruebas automatizadas de autenticacion y permisos
# Proyecto: EduAlerta
# Requiere: PowerShell 5.1+ y backend en localhost:8080
# No guarda contrasenas ni tokens en el log.
# ============================================================

$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:8080"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ProjectRoot = (Get-Location).Path
$EvidenceDir = Join-Path $ProjectRoot "evidencias\pruebas\04_seguridad"

New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null
$LogPath = Join-Path $EvidenceDir "IT-05_Seguridad_$Timestamp.log"
$Results = [System.Collections.Generic.List[object]]::new()

function Write-Log {
    param([string]$Message)
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Add-Content -Path $LogPath -Value $line -Encoding UTF8
    Write-Host $line
}

function Invoke-TestRequest {
    param(
        [string]$Id,
        [string]$Description,
        [string]$Method = "GET",
        [string]$Path,
        [string]$Token,
        [object]$Body,
        [int[]]$ExpectedStatus = @(200)
    )

    $headers = @{}
    if (-not [string]::IsNullOrWhiteSpace($Token)) {
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
        $params["Body"] = ($Body | ConvertTo-Json -Depth 8 -Compress)
    }

    $status = 0
    $responseText = ""
    $exceptionText = ""

    try {
        $response = Invoke-WebRequest @params
        $status = [int]$response.StatusCode
        $responseText = [string]$response.Content
    }
    catch {
        $exceptionText = $_.Exception.Message

        if ($_.Exception.Response) {
            try {
                $status = [int]$_.Exception.Response.StatusCode
                $stream = $_.Exception.Response.GetResponseStream()
                if ($stream) {
                    $reader = [System.IO.StreamReader]::new($stream)
                    $responseText = $reader.ReadToEnd()
                    $reader.Dispose()
                }
            } catch {}
        }
    }

    # Nunca registrar tokens ni contrasenas.
    $safeBody = $responseText
    if ($safeBody) {
        try {
            $obj = $safeBody | ConvertFrom-Json
            foreach ($property in @(
                "accessToken", "refreshToken", "token",
                "password", "contrasena"
            )) {
                if ($obj -and $obj.PSObject.Properties[$property]) {
                    $obj.$property = "[REDACTADO]"
                }
            }
            $safeBody = $obj | ConvertTo-Json -Depth 8 -Compress
        } catch {
            $safeBody = $safeBody -replace '(?i)"(accessToken|refreshToken|token|password|contrasena)"\s*:\s*"[^"]*"', '"$1":"[REDACTADO]"'
        }
    }

    $passed = $ExpectedStatus -contains $status
    $statusText = if ($passed) { "OK" } else { "REVISAR" }

    Write-Log "$Id | $Description | HTTP=$status | Esperado=$($ExpectedStatus -join ',') | $statusText"
    if ($safeBody) {
        Write-Log "$Id | Respuesta: $safeBody"
    }
    if ($exceptionText -and $status -eq 0) {
        Write-Log "$Id | Error de conexion: $exceptionText"
    }

    $Results.Add([PSCustomObject]@{
        ID = $Id
        Prueba = $Description
        HTTP = $status
        Esperado = ($ExpectedStatus -join ",")
        Resultado = $statusText
    })
}

function Read-CredentialPlainText {
    param([string]$Prompt)

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

function Get-LoginToken {
    param(
        [string]$Label,
        [string]$Email
    )

    $password = Read-CredentialPlainText "Contrasena para $Label ($Email)"
    try {
        $body = @{
            correo = $Email
            password = $password
        }

        $response = Invoke-RestMethod `
            -Uri "$BaseUrl/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json -Compress) `
            -TimeoutSec 15

        if (-not $response.accessToken) {
            Write-Log "$Label | Login sin accessToken en la respuesta."
            return $null
        }

        Write-Log "$Label | Login HTTP correcto; token omitido del log."
        return [string]$response.accessToken
    }
    catch {
        $status = 0
        if ($_.Exception.Response) {
            try { $status = [int]$_.Exception.Response.StatusCode } catch {}
        }
        Write-Log "$Label | Login fallido. HTTP=$status. Detalle: revise la respuesta en la aplicacion."
        return $null
    }
    finally {
        $password = $null
    }
}

Write-Log "============================================================"
Write-Log "INICIO DE PRUEBAS IT-05 - SEGURIDAD"
Write-Log "Base URL: $BaseUrl"
Write-Log "============================================================"

# 1. Verificar que el backend responde.
try {
    $null = Invoke-WebRequest -Uri "$BaseUrl/api/health/db" `
        -TimeoutSec 8 -UseBasicParsing
    Write-Log "Precondicion: backend accesible."
}
catch {
    Write-Log "ERROR: backend no accesible en $BaseUrl. Se detiene el script."
    Write-Log "Inicia los contenedores y vuelve a ejecutar."
    exit 1
}

# 2. Endpoint de identidad sin token e invalid token.
Invoke-TestRequest -Id "IT-05A" `
    -Description "GET /api/auth/me sin token" `
    -Path "/api/auth/me" -ExpectedStatus @(401, 403)

Invoke-TestRequest -Id "IT-05B" `
    -Description "GET /api/auth/me con token invalido" `
    -Path "/api/auth/me" -Token "token-invalido" `
    -ExpectedStatus @(401, 403)

# 3. Administrador.
$adminEmail = Read-Host "Correo del administrador (ej. admin@edualerta.local)"
$adminToken = Get-LoginToken -Label "ADMIN" -Email $adminEmail

if ($adminToken) {
    Invoke-TestRequest -Id "IT-05C" `
        -Description "GET /api/auth/me con administrador" `
        -Path "/api/auth/me" -Token $adminToken `
        -ExpectedStatus @(200)

    Invoke-TestRequest -Id "IT-05D" `
        -Description "GET /api/admin/usuarios con administrador" `
        -Path "/api/admin/usuarios" -Token $adminToken `
        -ExpectedStatus @(200)
}
else {
    Write-Log "IT-05C/IT-05D OMITIDAS: no se obtuvo token de administrador."
}

# 4. Docente: validar identidad y rechazo de ruta administrativa.
$docenteEmail = Read-Host "Correo del usuario DOCENTE de prueba"
$docenteToken = Get-LoginToken -Label "DOCENTE" -Email $docenteEmail

if ($docenteToken) {
    Invoke-TestRequest -Id "IT-05E" `
        -Description "GET /api/auth/me con docente" `
        -Path "/api/auth/me" -Token $docenteToken `
        -ExpectedStatus @(200)

    Invoke-TestRequest -Id "IT-05F" `
        -Description "Docente intenta consultar GET /api/admin/usuarios" `
        -Path "/api/admin/usuarios" -Token $docenteToken `
        -ExpectedStatus @(403)
}
else {
    Write-Log "IT-05E/IT-05F OMITIDAS: no se obtuvo token de docente."
}

# 5. Resumen final.
Write-Log "============================================================"
Write-Log "RESUMEN FINAL"
$Results | ForEach-Object {
    Write-Log "$($_.ID) | $($_.Resultado) | HTTP=$($_.HTTP) | $($_.Prueba)"
}

$total = $Results.Count
$ok = @($Results | Where-Object { $_.Resultado -eq "OK" }).Count
$review = $total - $ok

Write-Log "Total ejecutadas: $total"
Write-Log "Coinciden con lo esperado: $ok"
Write-Log "Revisar: $review"
Write-Log "Fin de pruebas."
Write-Log "Log guardado en: $LogPath"

Write-Host ""
Write-Host "RESUMEN"
$Results | Format-Table -AutoSize
Write-Host "Log: $LogPath"
