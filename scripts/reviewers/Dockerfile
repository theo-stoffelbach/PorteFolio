FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914

ARG CODEX_CLI_VERSION=0.146.0

RUN npm install --global "@openai/codex@${CODEX_CLI_VERSION}" \
    && npm cache clean --force

WORKDIR /workspace

ENTRYPOINT []
