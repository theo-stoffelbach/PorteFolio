FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next standalone's file tracer omits the libvips shared object from sharp 0.35.
# Keep the patched image optimizer functional in the Alpine runtime.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@img/sharp-libvips-linuxmusl-x64/lib ./node_modules/@img/sharp-libvips-linuxmusl-x64/lib
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Next standalone starts directly with Node; npm/npx are build-time-only.
# Removing them also removes npm's bundled node-tar from the runtime image.
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
