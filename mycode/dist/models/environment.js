"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.URL = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
//export const URL='http://127.0.0.1:8085';
exports.URL = 'http://emqx:8081';
exports.auth = {
    auth: {
        username: 'admin',
        password: `${process.env.EMQX_DEFAULT_APPLICATION_SECRET}`
    }
};
