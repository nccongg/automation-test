FROM node:20-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN mkdir -p /app/screenshots

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-5000}/api/health" || exit 1

CMD ["node", "src/app.js"]
