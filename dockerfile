# Stage 1 - Build

ARG BASE_IMAGE_TAG = sha-8ac6c280f0265f5f0f533fe3b3130bc1086e3b2a

FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch

COPY . .

RUN pnpm install --offline \
 && pnpm build \
 && pnpm prune --prod


# Stage 2 - Runtime
FROM 409171460637.dkr.ecr.ap-southeast-2.amazonaws.com/base-image:${BASE_IMAGE_TAG} AS runtime


WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/templates ./templates

ENV NODE_ENV=production \
PORT=4000
EXPOSE 4000

USER nonroot

CMD [ "dist/src/main.js"]