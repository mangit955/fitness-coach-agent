FROM node:22

RUN npm install -g openclaw

RUN mkdir -p /root/.openclaw

COPY openclaw.json /root/.openclaw/openclaw.json

EXPOSE 18789

CMD ["openclaw", "gateway"]
