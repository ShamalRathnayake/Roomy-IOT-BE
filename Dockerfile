
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY ./.husky ./.husky

RUN npm ci

COPY . ./

RUN npm run build



FROM node:20 AS release

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.husky ./.husky

RUN npm install --omit=dev 

EXPOSE 4000

CMD ["npm", "start"] 