# ============================================================
# Creative Alibi - Cloud Run Dockerfile
# Build: Node.js API server + static files
# ============================================================

FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy server files
COPY server/ server/

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start
CMD ["node", "server/index.js"]
