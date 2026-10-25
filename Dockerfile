# One container serves the built client and the WebSocket server on the same port.
FROM node:24-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production PORT=8080 TRUST_PROXY=1
EXPOSE 8080
CMD ["npm", "start"]
