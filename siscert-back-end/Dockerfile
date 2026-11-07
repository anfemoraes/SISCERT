FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY --from=build /app/dist ./dist
COPY drizzle.config.ts ./drizzle.config.ts
COPY src/db/migrations ./src/db/migrations
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && npm start"]
