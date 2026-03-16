# Stage 1: Builder
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /cloud-sec-builder

COPY requirements.txt .

RUN python -m venv /env && /env/bin/pip install --upgrade pip && \
    /env/bin/pip install -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

RUN groupadd -r cloudsec && useradd -r -g cloudsec -m -d /home/cloudsec cloudsec

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/app/.cache/huggingface \
    TRANSFORMERS_CACHE=/app/.cache/huggingface

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /env /env

ENV PATH="/env/bin:$PATH"

COPY --chown=cloudsec:cloudsec . .

RUN chown -R cloudsec:cloudsec /app && \
    mkdir -p /app/.cache/huggingface && \
    chown -R cloudsec:cloudsec /app/.cache

USER cloudsec

EXPOSE 8000

CMD ["sh", "-c", "python manage.py makemigrations && python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]