FROM node:22

RUN npm install -g openclaw

WORKDIR /app

COPY openclaw.template.json /app/openclaw.template.json
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 18789

ENTRYPOINT ["/app/docker-entrypoint.sh"]
