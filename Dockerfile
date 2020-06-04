# Create node image
FROM node:14.4.0-alpine

# Create app directory
WORKDIR /app

# Copy file to /app directory
COPY . /app

# install dependencies
RUN npm install pm2 -g \
  && npm install @nestjs/cli rimraf -g \
  # compile typescript
  && npm run build \
  # Remove dev dependencies
  && npm prune --production --silent \
  # Remove unused file/folder
  && rm -rf src \
  && rm tsconfig.json Dockerfile .dockerignore

# Expose port 5010
EXPOSE 5010

# run node dist/server.js
CMD [ "pm2-runtime", "dist/main.js" ]