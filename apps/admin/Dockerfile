# Stage 1: Build the Vite SPA
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config for pnpm install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ packages/
COPY apps/admin/ apps/admin/

# Install workspace deps needed for admin build
RUN pnpm install --frozen-lockfile

# Build the SPA (tsc --noEmit && vite build)
WORKDIR /app/apps/admin
RUN pnpm build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
