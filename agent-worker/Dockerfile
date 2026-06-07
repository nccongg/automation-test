FROM python:3.11-slim

# Install system dependencies needed by Playwright/Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Chromium and all its OS-level dependencies via playwright
RUN playwright install chromium --with-deps

COPY . .

RUN mkdir -p /app/screenshots

EXPOSE 8001

# Healthcheck via wget (lighter than httpx in shell)
HEALTHCHECK --interval=30s --timeout=20s --start-period=120s --retries=3 \
  CMD wget -qO- http://localhost:8001/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
