FROM node:latest

RUN npm i -g npm
RUN npm i -g phantomjs

RUN apt-get update && apt-get install -y git

RUN git clone https://github.com/ember-cli/ember-cli.git ~/ember-cli
RUN cd ~/ember-cli && npm i
RUN curl https://raw.githubusercontent.com/isaacs/nave/master/nave.sh > /usr/local/bin/nave
RUN chmod +x /usr/local/bin/nave

ENTRYPOINT ["/bin/bash"]
