FROM ubuntu:14.04
MAINTAINER Roni Choudhury <roni.choudhury@kitware.com>

# The environment variables beginning with KWDEMO can be used to map this demo
# to the main url space.  See the end of this file.
ENV KWDEMO_READY FALSE

EXPOSE 3000

RUN apt-get update && apt-get install -y \
    python \
    python-pip \
    git \
    npm

RUN pip install \
    tangelo

# XDATA's proxy can't use the git protocol
RUN git config --global url."https://".insteadOf git://

# Clone the repo.
RUN git clone git://github.com/XDATA-Year-3/clique.git -b docker-env
WORKDIR clique

# Need to symlink node to nodejs because Ubuntu names things in a way that npm
# doesn't expect.
RUN ln -s /usr/bin/nodejs /usr/bin/node

# Install gulp, then build clique.
RUN npm install -g gulp
RUN npm install
RUN gulp

# Create a tangelo user
RUN useradd -c "tangelo user" -m -d /home/tangelo -s /bin/bash tangelo
USER tangelo
ENV HOME /home/tangelo

# Set up KWDemo vars.
ENV KWDEMO_NAME Clique Demo
ENV KWDEMO_KEY clique
ENV KWDEMO_SRCURL https://github.com/XDATA-Year-3/clique
ENV KWDEMO_DESC XDATA Clique graph exploration framework
ENV KWDEMO_IMG /clique/assets/clique.svg
ENV KWDEMO_READY TRUE
ENV CLIQUE_HOST 0.0.0.0
ENV CLIQUE_PORT 3000

# Become tangelo.
USER tangelo

# Start the clique application when this image is run.
CMD ["gulp", "serve"]
