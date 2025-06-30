FROM node:18-alpine
LABEL author="programmer-timmy"
LABEL org.opencontainers.image.source https://github.com/Programmer-Timmy/MineMonitor

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]

