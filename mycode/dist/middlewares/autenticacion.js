"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificaToken = void 0;
const token_1 = __importDefault(require("../classes/token"));
const verificaToken = (req, res, next) => {
    const userToken = req.get('x-token') || '';
    token_1.default.comprobarToken(userToken).then((decoded) => {
        console.log('DECODED:', decoded);
        req.body.usuario = decoded.usuario;
        req.body.expiresIn = decoded.exp;
        next();
    }).catch(err => {
        res.json({
            ok: false,
            mensaje: 'Token no válido, error Token'
        });
    });
};
exports.verificaToken = verificaToken;
