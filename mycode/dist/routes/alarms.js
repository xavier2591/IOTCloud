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
exports.getAlarmRule = void 0;
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const colors_1 = __importDefault(require("colors"));
const environment_1 = require("../models/environment");
const autenticacion_1 = require("../middlewares/autenticacion");
const emqx_alarm_rule_model_1 = __importDefault(require("../models/emqx_alarm_rule.model"));
const alarmRoutes = (0, express_1.Router)();
/*
  ___  ______ _____
 / _ \ | ___ \_   _|
/ /_\ \| |_/ / | |
|  _  ||  __/  | |
| | | || |    _| |_
\_| |_/\_|    \___/
*/
//CREATE ALARM-RULE
alarmRoutes.post('/alarm-rule', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    var newRule = req.body.newRule;
    newRule.userId = req.body.usuario._id;
    console.log('NewRule'.bgCyan, newRule);
    try {
        const respRule = yield createAlarmRule(newRule);
        if (respRule['ok']) {
            return resp.json({
                ok: true,
                emqxRuleId: respRule['emqxRuleId']
            });
        }
        else {
            return resp.json({
                ok: false,
                mensaje: 'Error en creación de Alarm-Rule'
            });
        }
    }
    catch (error) {
        console.log(colors_1.default.bgRed('******ERROR**********'), error);
        return resp.json({
            ok: false,
            mensaje: 'Error desconocido en creación de Alarm-Rule'
        });
    }
}));
//UPDATE ALARM-RULE
alarmRoutes.put('/alarm-rule', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    var rule = req.body.rule;
    //console.log('EN alarm-rule, después de validar Token'.bgBlue);
    try {
        var resp_U = yield updateAlarmRuleStatus(rule.emqxRuleId, rule.status);
        if (resp_U) {
            return resp.json({
                ok: true,
                mensaje: 'Todo ok en actualizar Status de AlarmRule'
            });
        }
        else {
            return resp.json({
                ok: false,
                mensaje: 'Error en actualizar Status de AlarmRule'
            });
        }
    }
    catch (error) {
        console.log('**********************ERROR en PUT- UpdateAlarmRULES***********'.bgRed);
        console.log('Error:', error);
        return resp.json({
            ok: false,
            mensaje: 'Error Desconocido en actualizar Status de AlarmRule'
        });
    }
}));
//DELETE ALARM-RULE
alarmRoutes.delete('/alarm-rule', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    var emqxRuleId = req.body.emqxRuleId;
    try {
        var resp_D = yield deleteAlarmRule(emqxRuleId);
        if (resp_D) {
            return resp.json({
                ok: true,
                mensaje: 'Alarma eliminada'
            });
        }
        else {
            return resp.json({
                ok: false,
                mensaje: 'Error en eliminar Alarma'
            });
        }
    }
    catch (error) {
        console.log('**********************ERROR en DELETE- AlarmRULES***********'.bgRed);
        console.log('Error:', error);
        return resp.json({
            ok: false,
            mensaje: 'Error Desconocido en eliminar AlarmRule'
        });
    }
}));
exports.default = alarmRoutes;
///////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
///////////////////////////////////////////////////////////////////////////////////
//create ALARM
function createAlarmRule(newAlarm) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = environment_1.URL + "/api/v4/rules";
        const topic = newAlarm.userId + "/" + newAlarm.dId + "/" + newAlarm.variable + "/sdata";
        var rawsql = "SELECT username, topic, payload\n FROM \"" + topic + "\"\n";
        rawsql = rawsql + "WHERE payload.value " + newAlarm.condition + " " + newAlarm.value;
        rawsql = rawsql + " AND is_not_null(payload.value)";
        const newRule = {
            rawsql: rawsql,
            actions: [{
                    name: "data_to_webserver",
                    params: {
                        $resource: global.alarmResource.id,
                        payload_tmpl: '{"userId": "' + newAlarm.userId + '", "payload":${payload},"topic":"${topic}" }'
                    }
                }],
            description: "ALARM-RULE",
            enabled: newAlarm.status
        };
        //Crear alarma en EMQX
        const res1 = yield axios_1.default.post(url, newRule, environment_1.auth);
        const datos = res1.data.data;
        //console.log('url de EMQX'.bgCyan,url);
        //console.log('newRule de EMQX'.bgCyan,newRule);
        //console.log('params de newRule de EMQX'.bgCyan,newRule.actions[0].params);
        //console.log('res1.data de EMQX'.bgCyan,res1.data);
        console.log('DATOS de EMQX'.bgCyan, datos);
        if (datos && res1.status === 200) {
            //si la Alarma fue creada en EMQX grabar en la Base de Datos
            const mongoRule = yield emqx_alarm_rule_model_1.default.create({
                userId: newAlarm.userId,
                dId: newAlarm.dId,
                deviceName: newAlarm.deviceName,
                emqxRuleId: datos.id,
                variableFullName: newAlarm.variableFullName,
                variable: newAlarm.variable,
                value: newAlarm.value,
                condition: newAlarm.condition,
                triggerTime: newAlarm.triggerTime,
                status: newAlarm.status,
                counter: 0,
                createdTime: Date.now(),
            });
            var pay_1 = `{"userId":"${newAlarm.userId}","dId":"${newAlarm.dId}", "deviceName":"${newAlarm.deviceName}",`;
            pay_1 = pay_1 + '"payload": ${payload}, "topic":"${topic}", "emqxRuleId": "' + mongoRule.emqxRuleId + '",';
            pay_1 = pay_1 + `"value": ${newAlarm.value} , "condition": "${newAlarm.condition}", "variable": "${newAlarm.variable}", `;
            pay_1 = pay_1 + `"variableFullName": "${newAlarm.variableFullName}", "triggerTime":"${newAlarm.triggerTime}"}`;
            console.log('url_2 de EMQX'.bgCyan, url);
            newRule.actions[0].params.payload_tmpl = pay_1;
            const res2 = yield axios_1.default.put(url + "/" + mongoRule.emqxRuleId, newRule, environment_1.auth);
            if (res2.status === 200) {
                return { ok: true, emqxRuleId: datos.id };
            }
        }
        //Si no tuvo los resultados adecuados devolver False
        return { ok: false };
    });
}
//GET ALARM
function getAlarmRule(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const alarmRules = yield emqx_alarm_rule_model_1.default.find({ userId: userId });
            console.log('AlarmRules de:', colors_1.default.bgMagenta(userId));
            console.log(alarmRules);
            return alarmRules;
        }
        catch (error) {
            console.log('**********************ERROR en getAlarmRULES***********'.bgRed);
            console.log('Error:', error);
            return [];
        }
    });
}
exports.getAlarmRule = getAlarmRule;
//UPDATE ALARM
function updateAlarmRuleStatus(emqxRuleId, status) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = environment_1.URL + "/api/v4/rules/" + emqxRuleId;
        const newRule = { enabled: status };
        const resp = yield axios_1.default.put(url, newRule, environment_1.auth);
        if (resp.data.data && resp.status === 200) {
            yield emqx_alarm_rule_model_1.default.updateOne({ emqxRuleId: emqxRuleId }, { status: status });
            console.log('AlarmRule Status Updated...'.bgCyan);
            return true;
        }
        else {
            return false;
        }
    });
}
//delete ONLY one ALARMRULE
function deleteAlarmRule(emqxRuleId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (emqxRuleId === undefined)
            return false;
        try {
            const url = environment_1.URL + "/api/v4/rules/" + emqxRuleId;
            const resp = yield axios_1.default.delete(url, environment_1.auth);
            console.log('Eliminando ALARMA;'.bgRed, 'url:', url);
            console.log('resp.status'.bgRed, resp.status);
            if (resp.status === 200) {
                const deleted = yield emqx_alarm_rule_model_1.default.deleteOne({ emqxRuleId: emqxRuleId });
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            console.log('**********************ERROR en deleteAlarmRULES***********'.bgRed);
            console.log('Error:', error);
            return false;
        }
    });
}
