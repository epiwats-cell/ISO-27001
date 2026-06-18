FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files and prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build Next.js (without standalone)
RUN npm run build

# Create data directories
RUN mkdir -p /var/data/uploads

ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_URL="file:/var/data/iso27001.db"
ENV UPLOAD_DIR="/var/data"

EXPOSE 8080

CMD ["node", "scripts/start.js"]
