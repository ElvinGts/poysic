# Production Dockerfile for PoySic (Hugging Face Spaces, Koyeb, Render, or any Docker host)
FROM node:20-alpine AS builder

WORKDIR /app

# Salin fail konfigurasi pakej
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Pasang dependencies
RUN cd server && npm install
RUN cd client && npm install

# Salin kod sumber
COPY server ./server
COPY client ./client

# Bina server (TypeScript) dan client (Vite)
RUN cd server && npm run build
RUN cd client && npm run build

# Runtime Image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Port 7860 ialah port lalai untuk Hugging Face Spaces (boleh ditukar melalui env PORT)
ENV PORT=7860

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 7860

CMD ["node", "server/dist/index.js"]
