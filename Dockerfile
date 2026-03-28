# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src/ ./src/
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Create volume mount points
RUN mkdir -p /app/auth_info

# Non-root user for security
# RUN addgroup -S botgroup && adduser -S botuser -G botgroup
# RUN chown -R botuser:botgroup /app
# USER botuser

CMD ["node", "dist/index.js"]
