FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:${PORT:-8080}/health', r => process.exit(r.statusCode===200?0:1))"

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.js"]
