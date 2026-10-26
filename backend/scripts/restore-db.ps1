[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupPath
)

$ErrorActionPreference = 'Stop'
$resolvedBackup = (Resolve-Path $BackupPath).Path
if (-not (Test-Path $resolvedBackup -PathType Leaf)) {
    throw "No se encontró el respaldo: $BackupPath"
}

Write-Host 'ADVERTENCIA: la restauración sobrescribe objetos de la base EduAlerta.' -ForegroundColor Yellow
Write-Host "Archivo: $resolvedBackup"
$confirmation = Read-Host 'Escribe RESTAURAR para continuar'
if ($confirmation -cne 'RESTAURAR') {
    Write-Host 'Restauración cancelada.'
    exit 1
}

$backendDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$composeFile = Join-Path $backendDir 'compose.yaml'
$tempName = "edualerta-restore-$([guid]::NewGuid().ToString('N')).dump"
$tempInside = "/tmp/$tempName"
$apiStopped = $false

Push-Location $backendDir
try {
    docker compose -f $composeFile stop api
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible detener la API antes de restaurar.' }
    $apiStopped = $true

    docker compose -f $composeFile cp $resolvedBackup "db:$tempInside"
    if ($LASTEXITCODE -ne 0) { throw 'No fue posible copiar el archivo de respaldo al contenedor.' }

    $restoreCommand = 'pg_restore --clean --if-exists --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB" ' + $tempInside
    docker compose -f $composeFile exec -T db sh -ec $restoreCommand
    if ($LASTEXITCODE -ne 0) { throw 'pg_restore reportó un error. Revisa sus registros antes de usar la base restaurada.' }

    Write-Host 'Restauración completada. Comprueba los datos antes de continuar.' -ForegroundColor Green
}
finally {
    docker compose -f $composeFile exec -T db sh -ec "rm -f '$tempInside'" 2>$null | Out-Null
    if ($apiStopped) {
        docker compose -f $composeFile start api
        if ($LASTEXITCODE -ne 0) { Write-Warning 'La API no inició automáticamente; revisa docker compose logs api.' }
    }
    Pop-Location
}
