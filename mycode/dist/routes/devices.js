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
exports.makeId = void 0;
const express_1 = require("express");
const autenticacion_1 = require("../middlewares/autenticacion");
const device_model_1 = __importDefault(require("../models/device.model"));
const token_1 = __importDefault(require("../classes/token"));
const colors_1 = __importDefault(require("colors"));
const axios_1 = __importDefault(require("axios"));
const emqx_saver_rule_model_1 = __importDefault(require("../models/emqx_saver_rule.model"));
const template_model_1 = __importDefault(require("../models/template.model"));
const environment_1 = require("../models/environment");
const alarms_1 = require("./alarms");
const devicesRoutes = (0, express_1.Router)();
//post,get,put,delete ...CRUD->Create, Read, Update, Delete
//POST-Crear nuevo dispositivo
devicesRoutes.post('/device', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const user = req.body.usuario;
    const newDevice = {
        userId: user._id,
        dId: body.dId,
        name: body.name,
        password: makeId(10),
        selected: body.selected,
        templateId: body.templateId,
        templateName: body.templateName,
        createdTime: Date.now()
    };
    yield device_model_1.default.create(newDevice).then((deviceDB) => __awaiter(void 0, void 0, void 0, function* () {
        const resp_emqx = yield createSaverRule(newDevice.userId, newDevice.dId, true);
        if (!resp_emqx) {
            yield device_model_1.default.deleteOne({ userId: newDevice.userId, dId: newDevice.dId });
            return resp.json({
                ok: false,
                mensaje: 'Error en creación de SaverRule,       revisar conexión a EMQX',
            });
        }
        const tokenUser = token_1.default.getJwtToken({
            userId: deviceDB._id,
            dId: deviceDB.dId,
            name: deviceDB.name,
            selected: deviceDB.selected,
            templateId: deviceDB.templateId,
            templateName: deviceDB.templateName
        });
        yield selectDevice(newDevice.userId, newDevice.dId);
        resp.json({
            ok: true,
            mensaje: 'Todo funciona OK en post->device',
            device: deviceDB,
            tokenUser
        });
    })).catch(err => {
        console.log(colors_1.default.bgRed('**********************ERROR EN POST-DEVICE**********'), err);
        resp.json({
            ok: false,
            mensaje: 'Error en creación de Device',
            error: err.errors
        });
    });
}));
//GET-Leer dispositivos
devicesRoutes.get('/device', autenticacion_1.verificaToken, (req, resp) => {
    device_model_1.default.find({ userId: req.body.usuario._id }).then((deviceDB) => __awaiter(void 0, void 0, void 0, function* () {
        if (deviceDB.length === 0) {
            return resp.status(200).json({
                ok: true,
                mensaje: 'No hay dispositivos creados',
                deviceDB
            });
        }
        //desvincular el device DB
        var devices = JSON.parse(JSON.stringify(deviceDB));
        //obtener el SaverRule del Dispositivo
        const saverRules = yield getSaverRules(req.body.usuario._id);
        if (saverRules.length === 0) {
            return resp.json({
                ok: false,
                mensaje: 'ERROR en lectura de SaverRule, no existe',
                deviceDB
            });
        }
        const templates = yield getTemplates(req.body.usuario._id);
        if (templates.length === 0) {
            return resp.json({
                ok: false,
                mensaje: 'ERROR en lectura de Templates, no existe',
                deviceDB
            });
        }
        const alarmas = yield (0, alarms_1.getAlarmRule)(req.body.usuario._id);
        //asignación de saverRules, templates y alarmRules para cada device
        devices.forEach((device, index) => {
            device.saverRule = saverRules.filter(saverRule => saverRule.dId === device.dId)[0];
            if (templates.length > 0) {
                device.template = JSON.parse(JSON.stringify(templates.filter(template => template._id.equals(device.templateId))[0]));
                const _userId = JSON.parse(JSON.stringify(device.userId));
                const dId = JSON.parse(JSON.stringify(device.dId));
                const nameDisp = JSON.parse(JSON.stringify(device.name));
                const templateId = JSON.parse(JSON.stringify(device.templateId));
                const templateName = JSON.parse(JSON.stringify(device.templateName));
                devices[index].template.widgets.forEach(widget => {
                    widget.userId = _userId;
                    widget.selectedDevice.dId = dId;
                    widget.selectedDevice.name = nameDisp;
                    widget.selectedDevice.templateId = templateId;
                    widget.selectedDevice.templateName = templateName;
                    widget.templateId = templateId;
                    widget.templateName = templateName;
                });
            }
            //asignación de alarmas
            if (alarmas !== undefined && alarmas.length > 0) {
                device.alarmRules = alarmas.filter(alarm => alarm.dId === device.dId);
            }
        });
        resp.status(200).json({
            ok: true,
            deviceDB: devices
        });
    })).catch(err => {
        console.log(colors_1.default.bgRed('**********************ERROR EN GET-DEVICE**********'), colors_1.default.red(err));
        resp.json({
            ok: false,
            mensaje: 'Error en GET->Device',
            error: err.errors
        });
    });
});
//PUT-Actualizar dispositivo
devicesRoutes.put('/device', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield device_model_1.default.updateMany({ userId: req.body.usuario._id }, { selected: false });
        yield device_model_1.default.updateOne({ userId: req.body.usuario._id, dId: req.body.dId }, { selected: true });
        resp.json({
            ok: true,
            mensaje: 'Dispositivo seleccionado correctamente'
        });
    }
    catch (err) {
        resp.status(500).json({
            ok: false,
            error: err
        });
    }
}));
//DELETE-Borrar dispositivo
devicesRoutes.delete('/device', autenticacion_1.verificaToken, (req, resp) => {
    device_model_1.default.deleteOne({ userId: req.body.usuario._id, dId: req.query.dId }).then((result) => __awaiter(void 0, void 0, void 0, function* () {
        yield deleteSaverRule(req.query.dId);
        resp.status(200).json({
            ok: true,
            result: result
        });
    })).catch(err => {
        console.log(colors_1.default.bgRed('**********************ERROR EN DELETE-DEVICE**********'), err);
        resp.json({
            ok: false,
            mensaje: 'Error en DELETE->Device',
            error: err.errors
        });
    });
});
//////////////////////////////////////////////////////////////////////////////////
//  RUTAS DE SAVER RULE
//////////////////////////////////////////////////////////////////////////////////
//update saverRule
devicesRoutes.put('/saver-rule', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    const rule = req.body.rule;
    console.log('rule:', colors_1.default.bgCyan(rule));
    try {
        yield updateSaverRule(rule.emqxRuleId, rule.status);
        resp.json({
            ok: true
        });
    }
    catch (error) {
        resp.json({
            ok: false,
            error: error
        });
    }
}));
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// SAVER RULE FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
/*const auth={
    auth:{
        username:"admin",
        password:'emqxsecret'
    }
}*/
//Create SAVERRULE
function createSaverRule(userId, dId, status) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = environment_1.URL + '/api/v4/rules';
        const topic = userId + '/' + dId + '/+/sdata';
        const rawsql = `SELECT topic, payload \nFROM "${topic}" \n WHERE payload.save=1`;
        var newRule = {
            rawsql: rawsql,
            actions: [
                {
                    name: 'data_to_webserver',
                    params: {
                        $resource: global.saverResource.id,
                        payload_tmpl: `{"userId": "${userId}"` + ', "topic":"${topic}","payload":${payload}}'
                    }
                }
            ],
            description: "SAVER-RULE",
            enabled: status
        };
        try {
            const resp = yield axios_1.default.post(url, newRule, environment_1.auth);
            if (resp.status === 200 && resp.data.data) {
                console.log(colors_1.default.green(resp.data.data));
                yield emqx_saver_rule_model_1.default.create({ userId: userId,
                    dId: dId, emqxRuleId: resp.data.data.id, status: status
                });
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.log('**************ERROR CREATE_SAVER_RULE**************'.bgRed);
            console.log(error);
            return false;
        }
    });
}
//GET SAVERRULE
function getSaverRules(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rules = yield emqx_saver_rule_model_1.default.find({ userId: userId });
            return rules;
        }
        catch (error) {
            console.log(colors_1.default.bgRed('**********************ERROR getSaverRules**********************'));
            console.log(error);
            return [];
        }
    });
}
//UPDATE SAVERRULE
function updateSaverRule(emqxRuleId, status) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${environment_1.URL}/api/v4/rules/${emqxRuleId}`;
        const newRule = { enabled: status };
        const resp = yield axios_1.default.put(url, newRule, environment_1.auth);
        if (resp.status === 200 && resp.data.data) {
            yield emqx_saver_rule_model_1.default.updateOne({ emqxRuleId: emqxRuleId }, { status: status });
            console.log('Saver Rule UPDATED'.bgGreen);
            return {
                ok: true,
                action: "updated"
            };
        }
        else {
            return {
                ok: false,
                mensaje: 'NO se actualizó regla:' + emqxRuleId,
                action: "updated"
            };
        }
    });
}
//DELETE SAVERRULE
function deleteSaverRule(dId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mongoRule = yield emqx_saver_rule_model_1.default.findOne({ dId: dId });
            const url = `${environment_1.URL}/api/v4/rules/${mongoRule !== undefined ? mongoRule.emqxRuleId : ""}`;
            const emqxRule = yield axios_1.default.delete(url, environment_1.auth);
            const deleted = yield emqx_saver_rule_model_1.default.deleteOne({ dId: dId });
            return true;
        }
        catch (error) {
            console.log(colors_1.default.bgRed('**********************ERROR deleteSaverRule**********************'));
            console.log(error);
            return false;
        }
    });
}
//SELECT DEVICE
function selectDevice(userId, dId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const resultado = yield device_model_1.default.updateMany({ userId: userId }, { selected: false });
            const resultado2 = yield device_model_1.default.updateOne({ userId: userId, dId: dId }, { selected: true });
            return true;
        }
        catch (error) {
            console.log(colors_1.default.bgRed('**********************ERROR selectDevice**********************'));
            console.log(error);
            return false;
        }
    });
}
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
function getTemplates(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const templates = yield template_model_1.default.find({ userId: userId });
            console.log('templates de getTemplates:'.bgCyan, templates);
            return templates;
        }
        catch (error) {
            console.log(colors_1.default.bgRed('**********************ERROR getTemplates**********************'));
            console.log(error);
            return [];
        }
    });
}
/*
setTimeout(()=>{
    createSaverRule('userID_x1',"dId_771",true);
},2000);*/
function makeId(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
exports.makeId = makeId;
exports.default = devicesRoutes;
