FROM nginx
RUN apt-get update && apt-get install -y -q curl
COPY ./goldstone-server/goldstone/static /usr/share/nginx/html/static
