FROM node:22

RUN npm install -g openclaw

EXPOSE 18789

CMD ["openclaw", "gateway", "--port", "18789", "--host", "0.0.0.0", "--allow-unconfigured"]