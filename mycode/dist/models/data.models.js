"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const dataSchema = new mongoose_1.Schema({
    userId: { type: String, required: [true, 'The userId is mandatory'] },
    dId: { type: String, required: [true, 'The dId is mandatory'] },
    variable: { type: String, required: [true, 'The variable is mandatory'] },
    value: { type: Number, required: [true, 'The value is mandatory'] },
    time: { type: Number, required: [true, 'The dataTime is mandatory'] },
});
const Data = (0, mongoose_1.model)('Data', dataSchema);
exports.default = Data;
