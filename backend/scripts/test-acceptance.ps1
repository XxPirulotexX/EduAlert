    Write-Host 'EduAlerta — prueba local de aceptación (no imprime la contraseña ni el JWT).' -ForegroundColor Cyan
    $email = Read-Host 'Correo de una cuenta administrador/docente vigente'
    $securePassword = Read-Host 'Contraseña' -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)

    $health = Invoke-RestMethod -Uri "$BaseUrl/health/db" -Method GET -ErrorAction Stop
    Assert-True -Condition ($health.status -eq 'ok') -Message 'La API puede consultar PostgreSQL.'

    $loginBody = @{ correo = $email; password = $passwordPlain }
    $login = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -ContentType 'application/json; charset=utf-8' -Body (ConvertTo-Json $loginBody -Compress) -ErrorAction Stop
    if ([string]::IsNullOrWhiteSpace($login.accessToken)) { throw 'Login no devolvió accessToken.' }
    $script:AccessToken = $login.accessToken
    $passwordPlain = $null
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    $bstr = [IntPtr]::Zero
    $securePassword.Dispose()
    $securePassword = $null
    $loginBody = $null
    $login = $null
    Write-Host 'PASS Inicio de sesión y obtención JWT.' -ForegroundColor Green

    $stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss') + '-' + (Get-Random -Minimum 1000 -Maximum 9999)
    $code = "EA-AUTO-$stamp"
    $studentBody = @{
        usuarioId = $null; codigoEstudiantil = $code; nombres = 'Prueba'; apellidos = 'Automatizada'
        estado = 'activo'; grado = '11°'; promedioActual = 3.5; nivelRiesgo = 'sin_evaluar'; observacionesRiesgo = $null
    }

    $analytics = Invoke-Api -Method GET -Path '/analitica/resumen' -Body $null
    Assert-True -Condition ($analytics.distribucionRiesgo -and $analytics.distribucionAlertas) -Message 'Analítica obtiene conteos agregados de PostgreSQL.'

    $page = Invoke-Api -Method GET -Path '/estudiantes?pagina=0&tamano=10' -Body $null
    Assert-True -Condition ($null -ne $page.content -and $page.size -le 10) -Message 'Listado de estudiantes paginado desde el servidor.'
    Assert-ExpectedHttpStatus -Method GET -Path '/estudiantes?pagina=-1&tamano=10' -ExpectedStatus 400 -Body $null

    $createdStudent = Invoke-Api -Method POST -Path '/estudiantes' -Body $studentBody
    $studentId = [long]$createdStudent.id
    Assert-True -Condition ($studentId -gt 0) -Message 'Crear estudiante devuelve identificador.'
    $readStudent = Invoke-Api -Method GET -Path "/estudiantes/$studentId" -Body $null
    Assert-True -Condition ($readStudent.codigoEstudiantil -eq $code) -Message 'Leer estudiante por ID devuelve el registro persistido.'
    Assert-ExpectedHttpStatus -Method POST -Path '/estudiantes' -ExpectedStatus 409 -Body $studentBody

    $updatedStudentBody = @{ usuarioId = $null; codigoEstudiantil = $code; nombres = 'Prueba Editada'; apellidos = 'Automatizada'; estado = 'activo'; grado = '11°'; promedioActual = 3.8; nivelRiesgo = 'sin_evaluar'; observacionesRiesgo = $null }
    $updatedStudent = Invoke-Api -Method PUT -Path "/estudiantes/$studentId" -Body $updatedStudentBody
    Assert-True -Condition ($updatedStudent.nombres -eq 'Prueba Editada') -Message 'Actualizar estudiante persiste los cambios.'
    $filtered = Invoke-Api -Method GET -Path "/estudiantes?texto=$([uri]::EscapeDataString($code))&pagina=0&tamano=10" -Body $null
    Assert-True -Condition (@($filtered.content).Count -ge 1) -Message 'Búsqueda de estudiante se ejecuta en backend.'

    $createdAlert = Invoke-Api -Method POST -Path '/alertas' -Body @{ estudianteId = $studentId; senal = 'Prueba automatizada de aceptación'; nivelRiesgo = 'sin_evaluar' }
    $alertId = [long]$createdAlert.id
    Assert-True -Condition ($alertId -gt 0) -Message 'Crear alerta vinculada al estudiante.'
    $updatedAlert = Invoke-Api -Method PUT -Path "/alertas/$alertId" -Body @{ estudianteId = $studentId; senal = 'Señal editada por prueba automatizada'; nivelRiesgo = 'sin_evaluar' }
    Assert-True -Condition ($updatedAlert.senal -like 'Señal editada*') -Message 'Actualizar alerta persiste los cambios.'
    $statusAlert = Invoke-Api -Method PATCH -Path "/alertas/$alertId/estado" -Body @{ estado = 'En seguimiento' }
    Assert-True -Condition ($statusAlert.estado -eq 'En seguimiento') -Message 'Cambiar estado de alerta.'
    $followup = Invoke-Api -Method POST -Path "/alertas/$alertId/seguimientos" -Body @{ observaciones = 'Seguimiento generado por la prueba de aceptación.' }
    Assert-True -Condition ($followup.id -gt 0) -Message 'Crear seguimiento asociado a una alerta.'
    $followups = Invoke-Api -Method GET -Path "/alertas/$alertId/seguimientos" -Body $null
    Assert-True -Condition (@($followups).Count -ge 1) -Message 'Consultar historial de seguimiento.'

    $date = (Get-Date).ToString('yyyy-MM-dd')
    $resultBody = @{ estudianteId = $studentId; resultado = 'CONTINUIDAD'; fechaObservacion = $date; fuenteEvidencia = 'Prueba de aceptación local'; observaciones = 'Registro temporal para validar CRUD.' }
    $createdResult = Invoke-Api -Method POST -Path '/resultados-academicos' -Body $resultBody
    $resultId = [long]$createdResult.id
    Assert-True -Condition ($resultId -gt 0) -Message 'Crear resultado académico con evidencia registrada.'
    $resultsPage = Invoke-Api -Method GET -Path "/resultados-academicos?estudianteId=$studentId&pagina=0&tamano=10" -Body $null
    Assert-True -Condition (@($resultsPage.content).Count -ge 1) -Message 'Consultar resultados académicos con filtro/paginación.'
    $updatedResult = Invoke-Api -Method PUT -Path "/resultados-academicos/$resultId" -Body @{ estudianteId = $studentId; resultado = 'DESCONOCIDO'; fechaObservacion = $null; fuenteEvidencia = $null; observaciones = 'Resultado dejado pendiente por la prueba.' }
    Assert-True -Condition ($updatedResult.resultado -eq 'DESCONOCIDO' -and -not $updatedResult.verificado) -Message 'Actualizar resultado y limpiar estado de evidencia.'
    Invoke-Api -Method DELETE -Path "/resultados-academicos/$resultId" -Body $null | Out-Null
    $resultId = $null
    Write-Host 'PASS Eliminar resultado académico (HTTP 204).' -ForegroundColor Green

    $prediction = Invoke-Api -Method POST -Path '/ml/modeling/predict' -Body @{
        promedio_actual = 3.0; promedio_periodo_anterior = 3.5; porcentaje_asistencia = 70
        inasistencias_consecutivas = 4; asignaturas_perdidas = 3; entregas_pendientes = 5
        participacion_academica = 2; acompanamiento_familiar = 1
    }
    Assert-True -Condition ($prediction.origen_datos -eq 'sintetico' -and $prediction.es_dato_real -eq $false -and $prediction.probabilidades) -Message 'La API reenvía la predicción ML y conserva el aviso de datos sintéticos.'

    Invoke-Api -Method DELETE -Path "/alertas/$alertId" -Body $null | Out-Null
    $archived = Invoke-Api -Method GET -Path "/alertas/$alertId" -Body $null
    Assert-True -Condition ($archived.estado -eq 'Archivada') -Message 'Eliminar alerta ejecuta archivo lógico, conservando su seguimiento.'
    $alertId = $null

    Invoke-Api -Method DELETE -Path "/estudiantes/$studentId" -Body $null | Out-Null
    $studentId = $null
    Write-Host 'PASS Baja lógica del estudiante (HTTP 204).' -ForegroundColor Green

    Write-Host ''
    Write-Host 'ACEPTACIÓN: todas las comprobaciones terminaron correctamente.' -ForegroundColor Green
    Write-Host 'Los resultados y alertas temporales fueron eliminados/archivados y el estudiante de prueba quedó inactivo.' -ForegroundColor Cyan
 catch {
    $failure = $_
    Write-Host ''
    Write-Host ('FALLO DE ACEPTACION: {0}' -f $failure.Exception.Message) -ForegroundColor Red
    if ($failure.ErrorDetails -and $failure.ErrorDetails.Message) {
        Write-Host $failure.ErrorDetails.Message
    }
    if ($studentId) {
        Write-Host ('Se creo un estudiante temporal con ID {0}; puedes inactivarlo desde la pantalla o la API.' -f $studentId) -ForegroundColor Yellow
    }
    if ($alertId) {
        Write-Host ('Se creo una alerta temporal con ID {0}; puedes archivarla desde la pantalla o la API.' -f $alertId) -ForegroundColor Yellow
    }
    if ($resultId) {
        Write-Host ('Se creo un resultado temporal con ID {0}; puedes eliminarlo desde la pantalla.' -f $resultId) -ForegroundColor Yellow
    }
    $failureExitCode = 1
} finally {
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    if ($securePassword) { $securePassword.Dispose() }
    $passwordPlain = $null
    $script:AccessToken = $null
}

if ($failureExitCode -ne 0) { exit $failureExitCode }
