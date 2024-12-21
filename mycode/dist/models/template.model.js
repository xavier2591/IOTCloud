"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const templateSchema = new mongoose_1.Schema({
    userId: { type: String, required: [true, 'The userId is mandatory'] },
    name: { type: String, required: [true, 'The name is mandatory'] },
    description: { type: String },
    createdTime: { type: Number, required: [true] },
    widgets: { type: Array, default: [] }
});
const Template = (0, mongoose_1.model)('Template', templateSchema);
exports.default = Template;
