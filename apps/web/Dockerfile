# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install deps with lockfile
COPY package*.json ./
RUN npm ci

# Copy app source
COPY . .

# Build at image build time (not on container start)
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=512
RUN npx next build --no-lint

EXPOSE 3000
# Start the already-built app
CMD ["npx", "next", "start", "-p", "3000"]