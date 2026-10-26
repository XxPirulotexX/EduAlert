[CmdletBinding()]
param(
    [string]$OutputPath = ''
)

$ErrorActionPreference = 'Stop'
$backendDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composeFile = Join-Path $backendDir 'compose.yaml'

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $backupDir = Join-Path $backendDir 'backups'
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    $stamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
    $OutputPath = Join-Path $backupDir "edualerta-$stamp.dump"
} else {
    $parent = Split-Path -Parent $OutputPath
    if ($parent -and -not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
}

$tempName = "edualerta-backup-$([guid]::NewGuid().ToString('N')).dump"
$tempInside = "/tmp/$tempName"

Push-Location $backendDir
try {
    $dumpCommand = 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f ' + $tempInside
    docker compose -f $composeFile exec -T db sh -ec $dumpCommand
    if ($LASTEXITCODE -ne 0) { throw 'pg_dump falló; no se generó el respaldo.' }

    docker compose -f $composeFile cp "db:$tempInside" $OutputPath
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible copiar el respaldo fuera del contenedor.' }

    Write-Host "Respaldo generado: $OutputPath" -ForegroundColor Green
}
finally {
    docker compose -f $composeFile exec -T db sh -ec "rm -f '$tempInside'" 2>$null | Out-Null
    Pop-Location
}
