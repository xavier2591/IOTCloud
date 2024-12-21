"use strict";
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
const colors_1 = __importDefault(require("colors"));
const device_model_1 = __importDefault(require("../models/device.model"));
const data_models_1 = __importDefault(require("../models/data.models"));
const notifications_models_1 = __importDefault(require("../models/notifications.models"));
const emqx_alarm_rule_model_1 = __importDefault(require("../models/emqx_alarm_rule.model"));
const mqtt_1 = __importDefault(require("mqtt"));
const autenticacion_1 = require("../middlewares/autenticacion");
var client;
const webhookRoutes = (0, express_1.Router)();
webhookRoutes.post('/alarm', (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.headers.token !== process.env.EMQX_API_TOKEN) {
            return resp.json({
                ok: false,
                mensaje: 'Token incorrecto de webhook'
            });
        }
        const incomingAlarm = req.body;
        updateAlarmCounter(incomingAlarm.emqxRuleId);
        const lastNotif = yield notifications_models_1.default
            .find({ dId: incomingAlarm.dId, emqxRuleId: incomingAlarm.emqxRuleId })
            .sort({ time: -1 }).limit(1);
        if (lastNotif.length === 0) {
            console.log('FIRST TIME ALARM'.bgCyan);
            saveNotificationToMongo(incomingAlarm);
            sendMqttNotif(incomingAlarm);
        }
        else {
            const timeFromLastNotif = (Date.now() - lastNotif[0].time) / 1000; //en segundos
            if (timeFromLastNotif > incomingAlarm.triggerTime) {
                console.log('NUEVA ACTIVACIÓN DE ALARMA'.bgCyan);
                saveNotificationToMongo(incomingAlarm);
                sendMqttNotif(incomingAlarm);
            }
        }
        resp.status(200).json({
            ok: true
        });
    }
    catch (error) {
        console.log(colors_1.default.bgRed('**********************ERROR EN alarm/saver**********'), error);
        resp.json({
            ok: false,
            mensaje: 'ERROR desconocido en alarm/saver',
        });
    }
}));
webhookRoutes.post('/saver', (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    if (req.headers.token !== process.env.EMQX_API_TOKEN) {
        return resp.json({
            ok: false,
            mensaje: 'Token incorrecto de webhook'
        });
    }
    try {
        console.log('Data'.cyan, colors_1.default.bgCyan(data));
        const topicDividido = data.topic.split("/");
        const dId = topicDividido[1];
        const variable = topicDividido[2];
        var resultado = yield device_model_1.default.find({ dId: dId, userId: data.userId });
        if (resultado.length == 1) {
            const datos = {
                userId: data.userId,
                dId: dId,
                variable: variable,
                value: data.payload.value,
                time: Date.now()
            };
            yield data_models_1.default.create(datos);
            console.log('Datos Grabados'.bgCyan, datos);
            return resp.status(200).json({
                ok: true,
                mensaje: 'Datos grabados desde webhook/saver'
            });
        }
        return resp.status(200).json({
            ok: false,
            mensaje: 'Datos NO grabados desde webhook/saver, no existe dId y userId especificados',
            datos: data
        });
    }
    catch (error) {
        console.log(colors_1.default.bgRed('**********************ERROR EN webhook/saver**********'), error);
        resp.json({
            ok: false,
            mensaje: 'ERROR desconocido en webhook/saver',
            datos: data
        });
    }
}));
//GET NOTIFICATIONS
webhookRoutes.get('/notifications', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.usuario._id;
        const notifications = yield getNotifications(userId);
        return resp.json({
            ok: true,
            data: notifications
        });
    }
    catch (error) {
        console.log('***************ERROR en webhook/notifications*********************'.bgRed);
        console.log(error);
        return resp.json({
            ok: false,
            mensaje: 'Error desconocido en get->webhook/notifications',
            data: []
        });
    }
}));
//UPDATE NOTIFICATIONS
webhookRoutes.put('/notifications', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.usuario._id;
        const notificationId = req.body.notifId;
        yield notifications_models_1.default.updateOne({ userId: userId, _id: notificationId }, { readed: true });
        return resp.json({
            ok: true
        });
    }
    catch (error) {
        console.log('***************ERROR en PUT->webhook/notifications*********************'.bgRed);
        console.log(error);
        return resp.json({
            ok: false,
            mensaje: 'Error desconocido en put->webhook/notifications'
        });
    }
}));
exports.default = webhookRoutes;
///////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
///////////////////////////////////////////////////////////////////////////////////
function saveNotificationToMongo(incomingAlarm) {
    try {
        var newNotif = incomingAlarm;
        newNotif.time = Date.now();
        newNotif.readed = false;
        notifications_models_1.default.create(newNotif);
    }
    catch (error) {
        console.log('***************ERROR en saveNotificationToMongo*********************'.bgRed);
        console.log(error);
    }
}
function updateAlarmCounter(emqxRuleId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield emqx_alarm_rule_model_1.default.updateOne({ emqxRuleId: emqxRuleId }, { $inc: { counter: 1 } });
        }
        catch (error) {
            console.log('***************ERROR en updateAlarmCounter*********************'.bgRed);
            console.log(error);
        }
    });
}
function getNotifications(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield notifications_models_1.default.find({ userId: userId, readed: false }).sort({ time: -1 });
            return res;
        }
        catch (error) {
            console.log('***************ERROR en getNotifications*********************'.bgRed);
            console.log(error);
            return [];
        }
    });
}
///////////////////////////////////////////////////////////////////////////////////
// MQTT
///////////////////////////////////////////////////////////////////////////////////
function startMqttClient() {
    const options = {
        port: 1883,
        host: process.env.EMQX_NODE_HOST,
        clientId: "superUserBackend_" + Math.round(Math.random() * 10000),
        //username:'userP65',
        //password:'12345678',
        username: `${process.env.EMQX_SUPERUSER_USER}`,
        password: `${process.env.EMQX_SUPERUSER_PASSWORD}`,
        keepalive: 600,
        reconnectPeriod: 5000,
        protocolId: 'MQIsdp',
        protocolVersion: 3,
        clean: true,
        encoding: 'utf8'
    };
    client = mqtt_1.default.connect('mqtt://127.0.0.1', options);
    client.on('connect', function () {
        console.log('MQTT->CONECCIÓN EXITOSA...'.bgGreen);
    });
    client.on('reconnect', () => {
        console.log('ERROR EN RECONEXIÓN MQTT...'.bgRed);
        //console.log('Error:',error);
    });
    client.on('error', (err1) => {
        console.log('ERROR EN CONEXIÓN MQTT...\n'.bgRed);
        console.log('Error:', err1);
        console.log('options:', options);
    });
}
function sendMqttNotif(notif) {
    const topic = `${notif.userId}/${notif.dId}/${notif.variable}/notif`;
    const msg = `The ${notif.emqxRuleId}, When the ${notif.variableFullName} is ${notif.condition} than ${notif.value} was activated`;
    client.publish(topic, msg);
}
setTimeout(() => {
    startMqttClient();
}, 3000);
