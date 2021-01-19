FROM node

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY backend/package*.json /usr/src/app/
RUN npm install

# Bundle app source
COPY backend/ /usr/src/app

EXPOSE 80/tcp
CMD [ "node", "src/server.js" ]