"""
============================================================
EDUALERTA - EMPAQUETADOR DEL PROYECTO
============================================================

Genera un único archivo TXT con:

1. Información general del proyecto
2. Estructura completa de carpetas y archivos
3. Código completo de los archivos relevantes

Uso:

    python empaquetador.py

También permite indicar otra ruta:

    python empaquetador.py --ruta "C:\\ruta\\EduAlerta"

El resultado será:

    EDUALERTA_PROYECTO.txt

El archivo .txt está pensado para ser leído y analizado
posteriormente para revisar todo el proyecto.

============================================================
"""

from pathlib import Path
from datetime import datetime
import argparse
import sys
import os


# ============================================================
# CONFIGURACIÓN
# ============================================================

VERSION = "2.0.0"

NOMBRE_SALIDA = "EDUALERTA_PROYECTO.txt"


# Extensiones que serán incluidas
EXTENSIONES_INCLUIDAS = {
    # TypeScript / JavaScript
    ".ts",
    ".tsx",
    ".js",
    ".jsx",

    # Estilos
    ".css",
    ".scss",
    ".sass",
    ".less",

    # Web
    ".html",

    # Configuración
    ".json",
    ".xml",
    ".yml",
    ".yaml",

    # Documentación
    ".md",
    ".txt",

    # SVG
    ".svg",

    # Python
    ".py",

    # Java
    ".java",

    # SQL
    ".sql",

    # Otros archivos de configuración
    ".properties",
    ".gradle",
}


# ============================================================
# DIRECTORIOS QUE NO SE INCLUIRÁN
# ============================================================

DIRECTORIOS_IGNORADOS = {
    "node_modules",
    ".git",
    ".github",
    ".vscode",
    ".idea",

    "dist",
    "build",
    "www",
    "coverage",

    ".cache",
    ".vite",

    "__pycache__",
    ".pytest_cache",

    "venv",
    ".venv",
    "env",

    "target",

    # Carpeta donde se guarda el resultado
    "paquetes",
}


# ============================================================
# ARCHIVOS QUE NO SE INCLUIRÁN
# ============================================================

ARCHIVOS_IGNORADOS = {
    # Variables de entorno
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test",

    # Dependencias
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",

    # Archivos temporales
    ".DS_Store",
    "Thumbs.db",

    # Resultado anterior
    NOMBRE_SALIDA,
}


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

def obtener_raiz(ruta):
    """
    Obtiene y valida la ruta raíz del proyecto.
    """

    raiz = Path(ruta).resolve()

    if not raiz.exists():
        print(f"[ERROR] La ruta no existe:")
        print(raiz)
        sys.exit(1)

    if not raiz.is_dir():
        print(f"[ERROR] La ruta no es una carpeta:")
        print(raiz)
        sys.exit(1)

    return raiz


def directorio_ignorado(nombre):
    """
    Determina si una carpeta debe ser ignorada.
    """

    return nombre.lower() in {
        x.lower()
        for x in DIRECTORIOS_IGNORADOS
    }


def archivo_ignorado(nombre):
    """
    Determina si un archivo debe ser ignorado.
    """

    nombre_lower = nombre.lower()

    # Ignorar .env y similares
    if nombre_lower.startswith(".env"):
        return True

    return nombre_lower in {
        x.lower()
        for x in ARCHIVOS_IGNORADOS
    }


def extension_permitida(archivo):
    """
    Determina si el archivo tiene una extensión
    que nos interesa analizar.
    """

    return archivo.suffix.lower() in EXTENSIONES_INCLUIDAS


# ============================================================
# DESCUBRIR ARCHIVOS
# ============================================================

def descubrir_archivos(raiz):
    archivos = []

    for carpeta_actual, carpetas, archivos_actuales in os.walk(raiz):

        carpetas[:] = [
            carpeta
            for carpeta in carpetas
            if not directorio_ignorado(carpeta)
        ]

        for nombre in archivos_actuales:
            archivo = Path(carpeta_actual) / nombre
            if archivo_ignorado(nombre):
                continue
            if not extension_permitida(archivo):
                continue
            archivos.append(archivo)

    archivos.sort(
        key=lambda archivo: str(
            archivo.relative_to(raiz)
        ).lower()
    )

    return archivos


# ============================================================
# LEER ARCHIVO
# ============================================================

def leer_archivo(archivo):
    """
    Lee el contenido de un archivo intentando varias
    codificaciones.
    """

    codificaciones = [
        "utf-8",
        "utf-8-sig",
        "cp1252",
        "latin-1",
    ]

    for codificacion in codificaciones:

        try:

            return archivo.read_text(
                encoding=codificacion
            )

        except UnicodeDecodeError:
            continue

        except Exception as error:

            return (
                "[ERROR AL LEER EL ARCHIVO]\n"
                f"{error}"
            )

    return "[NO SE PUDO LEER EL ARCHIVO]"


# ============================================================
# ESTRUCTURA DEL PROYECTO
# ============================================================

def generar_arbol(raiz):
    """
    Genera un árbol completo de la estructura.
    """

    lineas = []

    lineas.append(
        raiz.name + "/"
    )

    def recorrer(carpeta, prefijo=""):

        elementos = []

        try:
            elementos = sorted(
                carpeta.iterdir(),
                key=lambda x: (
                    not x.is_dir(),
                    x.name.lower()
                )
            )
        except PermissionError:
            return

        elementos = [
            elemento
            for elemento in elementos
            if not (
                elemento.is_dir()
                and directorio_ignorado(elemento.name)
            )
        ]

        elementos = [
            elemento
            for elemento in elementos
            if not (
                elemento.is_file()
                and archivo_ignorado(elemento.name)
            )
        ]

        for indice, elemento in enumerate(elementos):

            ultimo = indice == len(elementos) - 1

            simbolo = "└── " if ultimo else "├── "

            if elemento.is_dir():

                lineas.append(
                    prefijo
                    + simbolo
                    + elemento.name
                    + "/"
                )

                nuevo_prefijo = (
                    prefijo + "    "
                    if ultimo
                    else prefijo + "│   "
                )

                recorrer(
                    elemento,
                    nuevo_prefijo
                )

            else:

                lineas.append(
                    prefijo
                    + simbolo
                    + elemento.name
                )

    recorrer(raiz)

    return "\n".join(lineas)


# ============================================================
# INFORMACIÓN GENERAL
# ============================================================

def generar_informacion(raiz, archivos):
    """
    Genera la cabecera del TXT.
    """

    ahora = datetime.now()

    total_lineas = 0
    total_bytes = 0

    for archivo in archivos:

        try:

            contenido = leer_archivo(
                archivo
            )

            total_lineas += len(
                contenido.splitlines()
            )

            total_bytes += archivo.stat().st_size

        except Exception:
            pass

    texto = []

    texto.append(
        "=" * 80
    )

    texto.append(
        "EDUALERTA - PROYECTO COMPLETO"
    )

    texto.append(
        "=" * 80
    )

    texto.append("")

    texto.append(
        f"Versión del empaquetador: {VERSION}"
    )

    texto.append(
        f"Fecha de generación: "
        f"{ahora.strftime('%Y-%m-%d %H:%M:%S')}"
    )

    texto.append(
        f"Ruta del proyecto: {raiz}"
    )

    texto.append(
        f"Archivos analizados: {len(archivos)}"
    )

    texto.append(
        f"Líneas aproximadas: {total_lineas}"
    )

    texto.append(
        f"Tamaño aproximado: "
        f"{total_bytes / 1024:.2f} KB"
    )

    texto.append("")

    texto.append(
        "NOTA DE SEGURIDAD:"
    )

    texto.append(
        "Los archivos .env y otros archivos "
        "sensibles son excluidos automáticamente."
    )

    texto.append("")

    texto.append(
        "=" * 80
    )

    texto.append(
        "ESTRUCTURA DEL PROYECTO"
    )

    texto.append(
        "=" * 80
    )

    texto.append("")

    texto.append(
        generar_arbol(raiz)
    )

    texto.append("")

    return "\n".join(texto)


# ============================================================
# CÓDIGO COMPLETO
# ============================================================

def generar_codigo(raiz, archivos):
    """
    Agrega al TXT el contenido completo de cada archivo.
    """

    resultado = []

    resultado.append(
        "=" * 80
    )

    resultado.append(
        "CÓDIGO COMPLETO DEL PROYECTO"
    )

    resultado.append(
        "=" * 80
    )

    resultado.append("")

    for numero, archivo in enumerate(
        archivos,
        start=1
    ):

        relativo = archivo.relative_to(
            raiz
        )

        contenido = leer_archivo(
            archivo
        )

        resultado.append(
            "\n"
            + "#" * 80
        )

        resultado.append(
            f"# ARCHIVO {numero}/{len(archivos)}"
        )

        resultado.append(
            f"# RUTA: {relativo}"
        )

        resultado.append(
            "#" * 80
        )

        resultado.append("")

        resultado.append(
            contenido
        )

        resultado.append("")

    return "\n".join(resultado)


# ============================================================
# GENERAR TXT
# ============================================================

def generar_txt(raiz):
    """
    Genera el archivo EDUALERTA_PROYECTO.txt
    """

    archivos = descubrir_archivos(
        raiz
    )

    print(
        f"[INFO] Archivos encontrados: "
        f"{len(archivos)}"
    )

    informacion = generar_informacion(
        raiz,
        archivos
    )

    codigo = generar_codigo(
        raiz,
        archivos
    )

    contenido_final = (
        informacion
        + "\n\n"
        + codigo
    )

    salida = raiz / NOMBRE_SALIDA

    salida.write_text(
        contenido_final,
        encoding="utf-8"
    )

    return salida, archivos


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description=(
            "Generador del TXT completo del proyecto EduAlerta."
        )
    )

    parser.add_argument(
        "--ruta",
        default=".",
        help=(
            "Ruta del proyecto. "
            "Si no se indica, utiliza la carpeta actual."
        )
    )

    args = parser.parse_args()

    print()
    print("=" * 80)
    print(
        "        EDUALERTA - EMPAQUETADOR"
    )
    print("=" * 80)
    print()

    raiz = obtener_raiz(
        args.ruta
    )

    print(
        f"[INFO] Proyecto:"
    )

    print(
        f"       {raiz}"
    )

    print()

    print(
        "[INFO] Analizando estructura..."
    )

    try:

        salida, archivos = generar_txt(
            raiz
        )

        print()

        print(
            "[OK] Empaquetado completado."
        )

        print()

        print(
            f"[OK] Archivos incluidos: "
            f"{len(archivos)}"
        )

        print()

        print(
            "[OK] Archivo generado:"
        )

        print(
            f"     {salida}"
        )

        print()

        print("=" * 80)

        print(
            "Puedes abrir EDUALERTA_PROYECTO.txt "
            "y compartirlo para revisar el proyecto."
        )

        print("=" * 80)

        print()

    except Exception as error:

        print()
        print(
            "[ERROR] Ocurrió un problema:"
        )

        print(
            error
        )

        print()

        sys.exit(1)


# ============================================================
# EJECUCIÓN
# ============================================================

if __name__ == "__main__":
    main()