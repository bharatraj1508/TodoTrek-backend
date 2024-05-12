FROM node:latest
WORKDIR /Documents/Doker/TodoTrek
COPY . /Documents/Doker/TodoTrek/
RUN npm install
EXPOSE 3000
CMD node app.js