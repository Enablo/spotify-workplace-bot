FROM node

ADD . /usr/src/app/

WORKDIR /usr/src/app

RUN npm install -g yarn && \
    yarn install

EXPOSE 3000

CMD node service