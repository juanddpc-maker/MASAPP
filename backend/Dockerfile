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

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
