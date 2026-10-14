# Etapa de compilación: Maven y Java viven dentro del contenedor.
# Así los integrantes del equipo no necesitan instalar Maven o el JDK localmente.
FROM maven:3.9.13-eclipse-temurin-21-noble AS build

WORKDIR /workspace

# Copiar primero el descriptor permite reutilizar la caché de dependencias.
COPY pom.xml ./
RUN mvn -B -ntp dependency:go-offline

# Copiar y compilar el código fuente de la API.
COPY src ./src
RUN mvn -B -ntp clean package

# Etapa de ejecución: solo incluye el JRE y el artefacto compilado.
FROM eclipse-temurin:21-jre-noble AS runtime

WORKDIR /app

# Ejecutar el proceso con un usuario sin privilegios administrativos.
RUN useradd --system --uid 10001 --create-home edualerta
COPY --from=build /workspace/target/edualerta-api-0.1.0-SNAPSHOT.jar /app/app.jar

USER 10001
EXPOSE 8080

# Limita de forma razonable el uso de memoria en entornos de desarrollo.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
