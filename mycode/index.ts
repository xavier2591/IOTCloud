import Server from "./classes/server";
import devicesRoutes from "./routes/devices";
import userRoutes from "./routes/usuario";
import mongoose, { ConnectOptions } from "mongoose";
import colors from "colors";
import bodyParser from "body-parser";
import templatesRoutes from "./routes/templates";
import emqxapiRoutes from "./routes/emqxapi";
import webhookRoutes from "./routes/webhook";
import alarmRoutes from "./routes/alarms";
import dataRoutes from "./routes/dataprovider";
import dotenv from "dotenv";


dotenv.config();

const server=new Server();

//"C:\Program Files\MongoDB\Server\4.4\bin\mongod.exe" --dbpath="c:\dataP64\db"

//Conectar a la Base de Datos
const options:ConnectOptions={
    autoIndex:true,
}

//Conexion a MongoDB
const mongoUserName=process.env.MONGO_USERNAME;
const mongoPassword=process.env.MONGO_PASSWORD;
const mongoHost=process.env.MONGO_HOST;
const mongoPort=process.env.MONGO_PORT;
const mongoDatabase=process.env.MONGO_DATABASE;

const uri=`mongodb://${mongoUserName}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}`;

    //mongoose.connect('mongodb://devuser:devpassword@127.0.0.1:27018/IoT_p65',options)
    mongoose.connect(uri,options)
                .then((msnOk)=>{
                    console.log(colors.bgYellow('Base de Datos-ONLINE'));
                },err1=>{
                    console.log(colors.red('CONEXION a BD fallida'),colors.bgRed(err1));
                }).catch(err2=>{
                    console.log(colors.bgRed('ERROR en conectarse a MongoDB'));
                    if(err2) throw err2;
                })


//Levantar el servidor express
server.start(()=>{
    console.log(`SERVIDOR-P64 corriendo en puerto: ${server.port}`);
})

//Body parser
server.app.use(bodyParser.urlencoded({extended:true}));
server.app.use(bodyParser.json());

//ruta de Usuario
server.app.use('/user',userRoutes);
//Ruta de dispositivos
server.app.use('/api',devicesRoutes);
//Ruta de templates
server.app.use('/widgets',templatesRoutes);

//Activar Ruta para conectarse al EMQX por API
server.app.use('/emqxapi',emqxapiRoutes);

//Activar Ruta para webhook y conectarse al EMQX
server.app.use('/webhook',emqxapiRoutes);
server.app.use('/webhook',webhookRoutes);

//Activar Ruta de alarmas:
server.app.use('/alarm',alarmRoutes);

//Activar Ruta para lectura de datos
server.app.use('/api',dataRoutes);

