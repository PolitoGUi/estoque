FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl postgresql-client

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

# Script to run migrations, seed the DB, and start the app
CMD npx prisma db push --accept-data-loss && npx prisma db seed && npm start
