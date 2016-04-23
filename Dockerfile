FROM node:5
MAINTAINER "William Matthews" robophred@gmail.com

WORKDIR /opt/resource
COPY check.js check
COPY in.js in
COPY out.js out

COPY shared.js shared.js
COPY package.json package.json

# TODO: Clean out cached data that apt generates.  See how sonatype/nexus does it.
RUN apt-get update & \
    apt-get install subversion & \
    npm install --quiet

RUN chmod a+x check in out

