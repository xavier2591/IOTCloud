"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
class Server {
    constructor() {
        this.port = Number(process.env.API_PORT);
        this.app = (0, express_1.default)();
        //configuracion express
        this.app.use((0, morgan_1.default)("tiny"));
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({
            extended: true
        }));
        this.app.use((0, cors_1.default)());
    }
    start(callback) {
        this.app.listen(this.port, callback());
    }
}
exports.default = Server;
