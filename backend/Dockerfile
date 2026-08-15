FROM node:20-slim

WORKDIR /app

# Prisma necesita OpenSSL para sus motores internos; node:20-alpine no lo trae
# compatible (usa musl en vez de glibc), por eso usamos la variante -slim.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build
# Diagnóstico: muestra en el log de build exactamente dónde quedó main.js,
# para nunca más tener que adivinar la ruta.
RUN echo "=== Contenido de dist/ ===" && find dist -type f -name "*.js" | sort

EXPOSE 3000
# En vez de asumir una ruta fija (dist/main.js o dist/src/main.js), busca el
# archivo main.js donde sea que haya quedado y lo ejecuta directamente.
CMD ["sh", "-c", "npx prisma migrate deploy && node $(find dist -name main.js | head -1)"]
