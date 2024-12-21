"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuario_model_1 = require("../models/usuario.model");
//import bcrypt from 'bcrypt';
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const token_1 = __importDefault(require("../classes/token"));
const autenticacion_1 = require("../middlewares/autenticacion");
const colors_1 = __importStar(require("colors"));
const emqx_auth_models_1 = require("../models/emqx_auth.models");
const devices_1 = require("./devices");
const device_model_1 = __importDefault(require("../models/device.model"));
const template_model_1 = __importDefault(require("../models/template.model"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const userRoutes = (0, express_1.Router)();
//post,get,put,delete ...CRUD->Create, Read, Update, Delete
userRoutes.get('/prueba', (req, resp) => {
    resp.json({
        ok: true,
        mensaje: 'Funciona todo OK-p64!!!!.....'
    });
    //resp.send('Hola IoT-p64');
});
//Crear Usuario
userRoutes.post('/create', (req, resp) => {
    const user = {
        name: req.body.name,
        email: req.body.email,
        password: bcryptjs_1.default.hashSync(req.body.password, 10),
        avatar: req.body.avatar
    };
    usuario_model_1.Usuario.create(user).then(userDB => {
        const tokenUser = token_1.default.getJwtToken({
            _id: userDB._id,
            name: userDB.name,
            email: userDB.email,
            avatar: userDB.avatar
            //No enviar PASSWORD
        });
        resp.json({
            ok: true,
            mensaje: 'Todo ok en create',
            token: tokenUser,
            expiresIn: Date.now() + 30 * 24 * 3600 * 1000,
            user: userDB
        });
    }).catch(err => {
        resp.json({
            ok: false,
            mensaje: 'Error en creación de usuario',
            err
        });
    });
});
//Login
userRoutes.post('/login', (req, resp) => {
    const body = req.body;
    usuario_model_1.Usuario.findOne({ email: body.email }).then(userDB => {
        console.log(colors_1.default.bgCyan('En login:'), body);
        if (!userDB) {
            return resp.json({
                ok: false,
                mensaje: 'Usuario/contraseña no son válidos'
            });
        }
        if (userDB.compararPassword(body.password)) {
            const tokenUser = token_1.default.getJwtToken({
                _id: userDB._id,
                name: userDB.name,
                email: userDB.email,
                avatar: userDB.avatar
                //No enviar PASSWORD
            });
            resp.status(200).json({
                ok: true,
                token: tokenUser,
                expiresIn: Date.now() / 1000 + 30 * 24 * 3600,
                userDB
            });
        }
        else {
            return resp.json({
                ok: false,
                mensaje: 'Usuario/contraseña no son válidos***'
            });
        }
    }).catch(err => {
        console.log('ERROR en LOGIN:', err);
        if (err)
            throw err;
    });
});
//Update-actualizar usuario
userRoutes.put('/update', autenticacion_1.verificaToken, (req, resp) => {
    const user = {
        name: req.body.name,
        password: req.body.password === undefined ? undefined : bcryptjs_1.default.hashSync(req.body.password, 10),
        avatar: req.body.avatar
    };
    console.log(colors_1.default.bgCyan('Nuevos datos:'), user);
    console.log(colors_1.default.bgCyan(req.body.usuario._id));
    usuario_model_1.Usuario.findByIdAndUpdate(req.body.usuario._id, user, { new: true }).then(userDB => {
        if (!userDB) {
            return resp.json({
                ok: false,
                mensaje: 'No existe usuario con ese ID'
            });
        }
        //generar nuevo token con los datos actualizados
        const tokenUser = token_1.default.getJwtToken({
            _id: userDB._id,
            name: userDB.name,
            email: userDB.email,
            avatar: userDB.avatar
        });
        resp.json({
            ok: true,
            token: tokenUser
        });
    }).catch(err => {
        console.log('Error en Update:', err);
        if (err)
            throw err;
    });
});
//obtener información por Token
userRoutes.get('/', [autenticacion_1.verificaToken], (req, resp) => {
    const usuario = req.body.usuario;
    resp.json({
        ok: true,
        usuario,
        expiresIn: req.body.expiresIn
    });
});
//GET MQTT credentials para users Web
userRoutes.get('/getmqttcredentials', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.usuario._id;
        const credentials = yield getWebUserMqttCredenciales(userId);
        resp.json({
            ok: credentials.ok,
            username: credentials.username,
            password: credentials.password
        });
    }
    catch (error) {
        console.log(colors_1.default.bgRed('**********************ERROR getMqttCredenciales**********************'));
        console.log(error);
        return resp.json({ ok: false, username: '', password: '' });
    }
}));
//GET MQTT credentials For Reconnection para users Web
userRoutes.get('/getmqttcredentialsforreconnection', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.usuario._id;
        const credentials = yield getWebUserMqttCredencialesForReconexion(userId);
        resp.json({
            ok: credentials.ok,
            username: credentials.username,
            password: credentials.password
        });
        setTimeout(() => {
            getWebUserMqttCredenciales(userId);
        }, 5000);
    }
    catch (error) {
        console.log(colors_1.default.bgRed('**********************ERROR getMqttCredenciales For Reconexion**********************'));
        console.log(error);
        return resp.json({ ok: false, username: '', password: '' });
    }
}));
//GET MQTT credentials para devices
//userRoutes.get('/getdevicecredentials',async(req:Request,resp:Response)=>{ 
//getdevicecredentials   
userRoutes.post('/getdevicecredentials', (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(colors_1.default.bgCyan('req.body'), req.body);
        console.log(colors_1.default.bgCyan('req.headers'), req.headers);
        var dId = '';
        if (req.body.dId !== undefined) {
            dId = req.body.dId;
        }
        else if (req.headers.did !== undefined) {
            dId = req.headers.did;
        }
        else {
            return resp.json({
                username: '',
                password: '',
                topic: '',
                variables: [{ var1: 'xx1', var2: 'xx2' }]
            });
        }
        console.log(colors_1.default.bgCyan('dId:' + dId));
        //const dId=req.body.dId;
        const device = yield device_model_1.default.findOne({ dId: dId });
        const userId = (device === null) ? '' : device.userId;
        const templateId = (device === null) ? '' : device.templateId;
        var credentials = yield getDeviceMqttCredenciales(dId, userId);
        var template = yield template_model_1.default.find({ _id: templateId });
        var variables = [];
        template[0].widgets.forEach(widget => {
            /*var v=(({variable,variableFullName,variableType, variableSendFreq})=>({
                variable,
                variableFullName,
                variableType,
                variableSendFreq
            }))(widget);*/
            var v1 = {
                variable: widget.variable,
                variableFullName: widget.variableFullName,
                variableType: widget.variableType,
                variableSendFreq: widget.variableSendFreq
            };
            variables.push(v1);
        });
        resp.json({
            username: credentials.username,
            password: credentials.password,
            topic: userId + '/' + dId + '/',
            variables: variables
        });
        setTimeout(() => {
            getDeviceMqttCredenciales(dId, userId);
            console.log('Credenciales del Dispositivo:' + dId + ' actualizadas');
        }, 10000);
    }
    catch (error) {
        console.log(colors_1.default.bgRed('**********************ERROR getdevicecredentials**********************'));
        console.log(error);
        return resp.json({ username: '', password: '', topic: '', variables: [] });
    }
}));
userRoutes.get('/variables', [autenticacion_1.verificaToken], (req, resp) => {
    const usuario = req.body.usuario;
    try {
        const data = {
            ok: true,
            api_port: process.env.API_PORT,
            backend_host: process.env.BACKEND_HOST,
            mongo_host: process.env.MONGO_HOST,
            mqtt_host: process.env.MQTT_HOST,
            mqtt_port: process.env.MQTT_PORT,
            mqtt_SSL_port: process.env.MQTT_SSL_PREFIX,
            axios_base_utl: process.env.AXIOS_BASE_URL
        };
        const data_str = JSON.stringify(data);
        const clave = 'la-clave-es-IoT-p65-1234567890';
        const { encriptado, iv } = encriptarTexto(data_str, clave);
        console.log('Encriptado:', (0, colors_1.bgCyan)(encriptado));
        resp.json({
            ok: true,
            encriptado,
            iv
        });
    }
    catch (error) {
        console.log('**********************ERROR getdevicecredentials**********************'.bgRed);
        console.log(error);
        resp.json({
            ok: false,
            usuario,
            error
        });
    }
});
exports.default = userRoutes;
/*
______ _   _ _   _ _____ _____ _____ _____ _   _  _____
|  ___| | | | \ | /  __ \_   _|_   _|  _  | \ | |/  ___|
| |_  | | | |  \| | /  \/ | |   | | | | | |  \| |\ `--.
|  _| | | | | . ` | |     | |   | | | | | | . ` | `--. \
| |   | |_| | |\  | \__/\ | |  _| |_\ \_/ / |\  |/\__/ /
\_|    \___/\_| \_/\____/ \_/  \___/ \___/\_| \_/\____/
*/
//FUNCION para el encriptar
function encriptarTexto(plainText, secretKey) {
    const iv = crypto_js_1.default.lib.WordArray.random(16);
    const bytesEncriptados = crypto_js_1.default.AES.encrypt(plainText, secretKey, {
        iv: iv,
        mode: crypto_js_1.default.mode.CBC,
        padding: crypto_js_1.default.pad.Pkcs7
    });
    const encriptado = bytesEncriptados.toString();
    return {
        encriptado: encriptado,
        iv: iv.toString()
    };
}
//FUNCION para el descencriptar
function descencriptarTexto(encryptedText, vector_iv, secretKey) {
    const iv = crypto_js_1.default.enc.Hex.parse(vector_iv);
    const descifrado = crypto_js_1.default.AES.decrypt(encryptedText, secretKey, {
        iv: iv,
        mode: crypto_js_1.default.mode.CBC,
        padding: crypto_js_1.default.pad.Pkcs7
    });
    return descifrado.toString(crypto_js_1.default.enc.Utf8);
}
//las credenciales MQTT seran del tipo: "user", "device", "superuser"
//en cada solicitud se cambia el username y el password
function getWebUserMqttCredenciales(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            var rule = yield emqx_auth_models_1.EmqxAuthRule.find({ type: "user", userId: userId });
            if (rule.length == 0) {
                const newRule = {
                    userId: userId,
                    username: (0, devices_1.makeId)(11),
                    password: (0, devices_1.makeId)(11),
                    publish: [userId + "/#"],
                    subscribe: [userId + "/#"],
                    type: "user",
                    time: Date.now(),
                    updatedTime: Date.now()
                };
                const result = yield emqx_auth_models_1.EmqxAuthRule.create(newRule);
                return {
                    ok: true,
                    username: result.username,
                    password: result.password
                };
            }
            else {
                const newUsername = (0, devices_1.makeId)(11);
                const newPassword = (0, devices_1.makeId)(11);
                const result1 = yield emqx_auth_models_1.EmqxAuthRule.updateOne({ type: "user", userId: userId }, { username: newUsername, password: newPassword, updatedTime: Date.now() });
                if (result1.modifiedCount == 1 && result1.matchedCount == 1) {
                    return {
                        ok: true,
                        username: newUsername,
                        password: newPassword
                    };
                }
                else {
                    return { ok: false };
                }
            }
        }
        catch (error) {
            console.log(colors_1.default.bgRed('**********************ERROR getWebUserMqttCredenciales**********************'));
            console.log(error);
            return { ok: false };
        }
    });
}
//en cada solicitud se maneienen el username y el password
function getWebUserMqttCredencialesForReconexion(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            var rule = yield emqx_auth_models_1.EmqxAuthRule.find({ type: "user", userId: userId });
            if (rule.length == 1) {
                return {
                    ok: true,
                    username: rule[0].username,
                    password: rule[0].password
                };
            }
            else {
                return { ok: false };
            }
        }
        catch (error) {
            console.log(colors_1.default.bgRed('**********************ERROR getWebUserMqttCredencialesForReconexion**********************'));
            console.log(error);
            return { ok: false,
                username: '',
                password: ''
            };
        }
    });
}
function getDeviceMqttCredenciales(dId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            var rule = yield emqx_auth_models_1.EmqxAuthRule.find({ type: "device", userId: userId, dId: dId });
            if (rule.length === 0) {
                const newRule = {
                    userId: userId,
                    dId: dId,
                    username: (0, devices_1.makeId)(12),
                    password: (0, devices_1.makeId)(12),
                    publish: [userId + "/" + dId + "/+/sdata"],
                    subscribe: [userId + "/" + dId + "/+/acdata"],
                    type: "device",
                    time: Date.now(),
                    updatedTime: Date.now()
                };
                const result = yield emqx_auth_models_1.EmqxAuthRule.create(newRule);
                return {
                    ok: true,
                    username: result.username,
                    password: result.password
                };
            }
            else {
                const newUsername = (0, devices_1.makeId)(12);
                const newPassword = (0, devices_1.makeId)(12);
                const result_1 = yield emqx_auth_models_1.EmqxAuthRule.updateOne({ type: "device", userId: userId, dId: dId }, { $set: {
                        username: newUsername,
                        password: newPassword,
                        updatedTime: Date.now()
                    } });
                if (result_1.modifiedCount == 1 && result_1.matchedCount == 1) {
                    return {
                        ok: true,
                        username: newUsername,
                        password: newPassword
                    };
                }
                else {
                    return {
                        ok: false,
                        username: '',
                        password: ''
                    };
                }
            }
        }
        catch (error) {
            console.log(colors_1.default.bgRed('**********************ERROR getDeviceUserMqttCredenciales**********************'));
            console.log(error);
            return { ok: false,
                username: '',
                password: ''
            };
        }
    });
}
