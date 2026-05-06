FROM node:22-slim AS base
RUN npm i -g pnpm@latest

# ── Install + build the monorepo ──
FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
COPY apps/api/prisma.config.ts apps/api/
RUN pnpm install --frozen-lockfile

COPY packages/core/ packages/core/
COPY apps/api/ apps/api/
RUN pnpm --filter @yfwdecimal/core build
RUN cd apps/api && npx prisma generate
RUN pnpm --filter @yfwdecimal/api build

# ── Production image ──
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/core/package.json ./packages/core/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=build /app/apps/api/src/generated ./apps/api/src/generated

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/index.js"]
