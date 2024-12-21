"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usuario = void 0;
const mongoose_1 = require("mongoose");
const mongoose_unique_validator_1 = __importDefault(require("mongoose-unique-validator"));
//import bcrypt from 'bcrypt';
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const usuarioSchema = new mongoose_1.Schema({
    name: { type: String, required: [true, 'The name is mandatory'] },
    avatar: { type: String, default: 'av-1.png' },
    email: { type: String, unique: true, required: [true, 'The email is mandatory'] },
    password: { type: String, required: [true, 'The password is mandatory'] },
});
usuarioSchema.method('compararPassword', function (password = '') {
    if (bcryptjs_1.default.compareSync(password, this.password)) {
        return true;
    }
    else {
        return false;
    }
});
usuarioSchema.plugin(mongoose_unique_validator_1.default, { message: 'Error: ya existe ese email' });
exports.Usuario = (0, mongoose_1.model)('User_P64', usuarioSchema);
