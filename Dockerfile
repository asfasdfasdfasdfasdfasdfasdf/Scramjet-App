FROM node:18-alpine

ENV NODE_ENV=production
ARG NPM_BUILD="npm install --omit=dev"
EXPOSE 8080/tcp

LABEL maintainer="Mercury Workshop"
LABEL summary="Scramjet Demo Image"
LABEL description="Example application of Scramjet"

WORKDIR /app

# FIX: Allow the build to pass even if package-lock.json doesn't exist locally
COPY package*.json ./

RUN apk add --upgrade --no-cache python3 make g++
RUN $NPM_BUILD

COPY . .

ENTRYPOINT [ "node" ]
# FIX: Adjusted to launch 'index.js' in the root folder instead of 'src/index.js'
CMD ["index.js"]
