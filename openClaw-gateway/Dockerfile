FROM node:22

RUN npm install -g openclaw

ENV OPENCLAW_GATEWAY_TOKEN=6f5b698c6f63e3ccbf908956dc332a93fbda3e3edbf7baed

EXPOSE 18789

CMD ["openclaw", "gateway", "--port", "18789", "--allow-unconfigured"]