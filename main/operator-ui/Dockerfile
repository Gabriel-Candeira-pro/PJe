FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY src ./src
EXPOSE 80
CMD ["npx","static-server","-p","3002","src"]
