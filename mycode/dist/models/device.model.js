"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose_unique_validator_1 = __importDefault(require("mongoose-unique-validator"));
const deviceSchema = new mongoose_1.Schema({
    userId: { type: String, required: [true, 'The userId is mandatory'] },
    dId: { type: String, unique: true, required: [true, 'The dId is mandatory'] },
    name: { type: String, required: [true, 'The name is mandatory'] },
    password: { type: String, required: [true] },
    selected: { type: Boolean, default: false },
    templateId: { type: String, required: [true] },
    templateName: { type: String, required: [true] },
    createdTime: { type: Number }
});
//Validator
deviceSchema.plugin(mongoose_unique_validator_1.default, { message: 'Error: Device already exist.' });
const Device = (0, mongoose_1.model)('Device', deviceSchema);
exports.default = Device;
