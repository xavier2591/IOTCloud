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
const axios_1 = __importDefault(require("axios"));
const colors_1 = __importDefault(require("colors"));
const environment_1 = require("../models/environment");
const emqxapiRoutes = (0, express_1.Router)();
global.saverResource = null;
global.alarmResource = null;
///////////////////////////////////////////////////////////
// EMQX ADMINISTRACIÓN DE RECURSOS
///////////////////////////////////////////////////////////
function listaRecursos() {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoint = '/api/v4/resources/';
        yield axios_1.default.get(`${environment_1.URL}${endpoint}`, environment_1.auth)
            .then(resp => {
            //console.log(colors.bgCyan('Response data:'),resp.data.data);
            const data = resp.data.data;
            const size = data.length;
            console.log('Response longitud-data:', size);
            if (size === 0) {
                console.log('\n******************Creating EMQX Webhook Resources************'.bgMagenta);
                crearRecursos();
            }
            else if (size == 2) {
                data.forEach(resource => {
                    if (resource.description === "alarm-webhook") {
                        console.log('******** RECURSO DE ALARM ENCONTRADO *******'.bgYellow);
                        global.alarmResource = resource;
                        console.log('******** RECURSO DE ALARM ENCONTRADO *******'.bgYellow);
                        console.log("\n");
                    }
                    if (resource.description === "saver-webhook") {
                        console.log('******** RECURSO DE SAVER ENCONTRADO*******'.bgBlue);
                        global.saverResource = resource;
                        console.log('******** RECURSO DE SAVER ENCONTRADO*******'.bgBlue);
                        console.log("\n");
                    }
                });
            }
            else {
                printWarning();
            }
        }).catch(err => {
            console.log(colors_1.default.bgRed('******ERROR**********'), err);
        });
    });
}
function crearRecursos() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const url = environment_1.URL + "/api/v4/resources";
            const data1 = {
                "type": "web_hook",
                "config": {
                    url: "http://localhost:3000/webhook/saver",
                    headers: {
                        token: process.env.EMQX_API_TOKEN
                    },
                    method: "POST"
                },
                description: "saver-webhook"
            };
            const data2 = {
                "type": "web_hook",
                "config": {
                    url: "http://localhost:3000/webhook/alarm",
                    headers: {
                        token: process.env.EMQX_API_TOKEN
                    },
                    method: "POST"
                },
                description: "alarm-webhook"
            };
            const res1 = yield axios_1.default.post(url, data1, environment_1.auth);
            if (res1.status === 200) {
                console.log("Recurso SAVER creado!!!...".green);
            }
            const res2 = yield axios_1.default.post(url, data2, environment_1.auth);
            if (res2.status === 200) {
                console.log("Recurso ALARM creado!!!...".green);
            }
            setTimeout(() => {
                console.log('************CREACIÓN DE RECURSOS EXITOSA********'.bgGreen);
                listaRecursos();
            }, 1000);
        }
        catch (error) {
            console.log('*************ERROR CREANDO RECURSOS*************'.bgRed);
            console.log(error);
        }
    });
}
function printWarning() {
    let i = 0;
    if (i < 5) {
        console.log(colors_1.default.red("Delete ALL webhook EMQX resources and restart Node"));
        setTimeout(() => {
            listaRecursos();
            i++;
        }, 1000);
        printWarning();
    }
}
setTimeout(() => {
    listaRecursos();
}, 10000);
exports.default = emqxapiRoutes;
