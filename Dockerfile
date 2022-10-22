# STAGE 1
# Get the base node images
# This version needs to be change as we upgrade the node version
# In first step we are pulling the base node image which has shell to build the NextJS application
FROM node:16-slim AS base
# Set working directory
WORKDIR /base

# Copy root level package files and install any root dependency
COPY package.json pnpm-lock.yaml .npmrc ./

RUN corepack enable
RUN corepack prepare

RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --ignore-scripts \
    | grep -v "cross-device link not permitted\|Falling back to copying packages from store"
# Copy required packages
COPY . .


# STAGE 2
# Build the nextJs app
FROM base AS build

ENV NODE_ENV=production

WORKDIR /build

COPY --from=base /base ./

RUN pnpm run build


# STAGE 3 — Final image
# NextJS build will create generated JS and CSS in .next directory. We will need this for our application to run
# All public folder contents will be needed as well . This folder contains static assets.
# Copy build output
FROM node:16-slim

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /build/package*.json ./ 
COPY --from=build /build/pnpm-lock.yaml ./ 
COPY --from=build /build/.npmrc ./ 
COPY --from=build /build/dist ./dist
COPY --from=build /build/config ./config

RUN corepack enable
RUN corepack prepare

RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --ignore-scripts --frozen-lockfile --prod \
    | grep -v "cross-device link not permitted\|Falling back to copying packages from store"

CMD ["pnpm", "start"]