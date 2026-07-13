# Stage 1: Build Next.js
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Install Python for cloudscraper bridge (needed by API routes)
RUN apk add --no-cache python3 py3-pip
RUN pip3 install --break-system-packages cloudscraper

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
