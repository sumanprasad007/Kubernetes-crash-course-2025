FROM node:14 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# Optimize Nginx for high concurrency
RUN echo 'worker_processes auto; \
events { \
  worker_connections 1024; \
} \
http { \
  server { \
    listen 80; \
    server_name localhost; \
    location / { \
      root /usr/share/nginx/html; \
      index index.html index.htm; \
      try_files $uri $uri/ /index.html; \
    } \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
      root /usr/share/nginx/html; \
    } \
  } \
}' > /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
