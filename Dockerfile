# Dockerfile.dev
FROM node:20-alpine

# 全局装 pnpm
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

EXPOSE 4000
CMD ["pnpm", "run", "dev"]
