FROM nginxinc/nginx-unprivileged:alpine
COPY app/index.html /usr/share/nginx/html/index.html
# Adjust port to 3000 to match deployment and service configs
RUN sed -i 's/8080/3000/g' /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
