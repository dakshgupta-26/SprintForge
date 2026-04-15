FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx esbuild src/server.ts --bundle --platform=node --target=node20 --outfile=dist/server.js --external:mongoose --external:bcryptjs --external:bcrypt --external:jsonwebtoken --external:express --external:socket.io --external:cors --external:helmet --external:morgan --external:dotenv --external:express-rate-limit

EXPOSE 5000

CMD ["node", "dist/server.js"]