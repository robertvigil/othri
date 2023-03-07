FROM gitpod/workspace-base

RUN sudo apt-get update \
 && sudo apt-get install -y \
  nodejs \
  npm \
  sshfs \
  rsync \
  && sudo rm -rf /var/lib/apt/lists/*
