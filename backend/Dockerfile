# Use Node 20 as base
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for Prisma generation
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# --- Production Image ---
FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy only the necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/fix_db_urls.js ./fix_db_urls.js
COPY --from=builder /app/import_local_data.js ./import_local_data.js
COPY --from=builder /app/production_fix_urls.js ./production_fix_urls.js

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 9000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
