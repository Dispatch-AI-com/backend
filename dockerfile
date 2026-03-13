# Stage 1 - Build
ARG BASE_IMAGE_TAG=latest


FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch

COPY . .

RUN pnpm install --offline \
 && pnpm build \
 && pnpm prune --prod





FROM 409171460637.dkr.ecr.ap-southeast-2.amazonaws.com/base-image:${BASE_IMAGE_TAG} AS runtime

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/templates ./templates

ENV NODE_ENV=production \
PORT=4000
EXPOSE 4000


RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -m appuser

USER appuser

CMD [ "Node","dist/src/main.js"]

