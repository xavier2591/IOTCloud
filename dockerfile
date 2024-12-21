#Usar la imagen oficial
FROM node:20.18.0

#RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
#RUN apk add --no-cache python3 make g++


#crear directorio de trabajo
WORKDIR /home/node/app

#Copiar archivos necesarios
COPY mycode/package*.json ./
COPY mycode/tsconfig.json ./

#Copia el código compilado desde la carpeta dist/
COPY mycode/dist ./dist

#Instalar las dependencias
WORKDIR /home/node/app
RUN npm install  

#expone el puerto
EXPOSE 3000

#Comando para iniciar la aplicacion
CMD ["node", "dist"]