FROM node:22-alpine@sha256:968df39aedcea65eeb078fb336ed7191baf48f972b4479711397108be0966920

ARG CODEX_CLI_VERSION=0.146.0

RUN npm install --global "@openai/codex@${CODEX_CLI_VERSION}" \
    && npm cache clean --force

WORKDIR /workspace

ENTRYPOINT []
