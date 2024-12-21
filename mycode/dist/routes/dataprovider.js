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
const autenticacion_1 = require("../middlewares/autenticacion");
const data_models_1 = __importDefault(require("../models/data.models"));
const dataRoutes = (0, express_1.Router)();
dataRoutes.get('/chart-data', autenticacion_1.verificaToken, (req, resp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.usuario._id;
        var chartTimeAgo = Number(req.query.chartTimeAgo || 0);
        const dId = req.query.dId;
        const variable = req.query.variable;
        chartTimeAgo = chartTimeAgo * 1000 * 60 * 60 * 24; //el chartTimeAgo convierte días a milisegundos
        if (chartTimeAgo === 0) {
            chartTimeAgo = Date.now();
        }
        const timeAgoMs = Date.now() - chartTimeAgo;
        const data = yield data_models_1.default.find({ userId: userId, dId: dId, variable: variable, "time": { $gt: timeAgoMs } }).sort({ "time": 1 });
        return resp.json({
            ok: true,
            data
        });
    }
    catch (error) {
        console.log(colors_1.default.bgRed('**********************ERROR EN get->chart-data**********'), error);
        resp.json({
            ok: false,
            mensaje: 'ERROR desconocido en get->"/api/chart-data"',
            data: []
        });
    }
}));
exports.default = dataRoutes;
