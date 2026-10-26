
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY ml-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY ml-service/main.py /app/ml-service/main.py
COPY dataset-trabajo/raw /app/dataset-trabajo/raw

# Crear el usuario de ejecucion sin privilegios administrativos.
RUN useradd --system --uid 10001 --create-home mlservice \
    && mkdir -p /app/ml-service/models \
    && chown -R mlservice:mlservice /app/ml-service

WORKDIR /app/ml-service

USER 10001

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
