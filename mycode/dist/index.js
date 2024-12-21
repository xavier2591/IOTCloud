"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./classes/server"));
const devices_1 = __importDefault(require("./routes/devices"));
const usuario_1 = __importDefault(require("./routes/usuario"));
const mongoose_1 = __importDefault(require("mongoose"));
const colors_1 = __importDefault(require("colors"));
const body_parser_1 = __importDefault(require("body-parser"));
const templates_1 = __importDefault(require("./routes/templates"));
const emqxapi_1 = __importDefault(require("./routes/emqxapi"));
const webhook_1 = __importDefault(require("./routes/webhook"));
const alarms_1 = __importDefault(require("./routes/alarms"));
const dataprovider_1 = __importDefault(require("./routes/dataprovider"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const server = new server_1.default();
//"C:\Program Files\MongoDB\Server\4.4\bin\mongod.exe" --dbpath="c:\dataP64\db"
//Conectar a la Base de Datos
const options = {
    autoIndex: true,
};
//Conexion a MongoDB
const mongoUserName = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT;
const mongoDatabase = process.env.MONGO_DATABASE;
const uri = `mongodb://${mongoUserName}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}`;
//mongoose.connect('mongodb://devuser:devpassword@127.0.0.1:27018/IoT_p65',options)
mongoose_1.default.connect(uri, options)
    .then((msnOk) => {
    console.log(colors_1.default.bgYellow('Base de Datos-ONLINE'));
}, err1 => {
    console.log(colors_1.default.red('CONEXION a BD fallida'), colors_1.default.bgRed(err1));
}).catch(err2 => {
    console.log(colors_1.default.bgRed('ERROR en conectarse a MongoDB'));
    if (err2)
        throw err2;
});
//Levantar el servidor express
server.start(() => {
    console.log(`SERVIDOR-P64 corriendo en puerto: ${server.port}`);
});
//Body parser
server.app.use(body_parser_1.default.urlencoded({ extended: true }));
server.app.use(body_parser_1.default.json());
//ruta de Usuario
server.app.use('/user', usuario_1.default);
//Ruta de dispositivos
server.app.use('/api', devices_1.default);
//Ruta de templates
server.app.use('/widgets', templates_1.default);
//Activar Ruta para conectarse al EMQX por API
server.app.use('/emqxapi', emqxapi_1.default);
//Activar Ruta para webhook y conectarse al EMQX
server.app.use('/webhook', emqxapi_1.default);
server.app.use('/webhook', webhook_1.default);
//Activar Ruta de alarmas:
server.app.use('/alarm', alarms_1.default);
//Activar Ruta para lectura de datos
server.app.use('/api', dataprovider_1.default);
