# 1. Étape de build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Étape d'exécution (plus légère)
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD npx ts-node -r dotenv/config ./node_modules/typeorm/cli.js migration:run -d dist/dataSource.js && node dist/main