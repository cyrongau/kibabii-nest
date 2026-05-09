# Use Node 20 as base
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
# Set build-time environment variable
ARG NEXT_PUBLIC_API_URL=https://api.kibabii.generexcom.com
ARG NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=448930784590-95qosr0f8s9svmd8t197ncdobb8fgvj8.apps.googleusercontent.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
RUN npm run build

# --- Production Image ---
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files for standalone mode
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
