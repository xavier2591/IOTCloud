"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const alarmRuleSchema = new mongoose_1.Schema({
    userId: { type: String, required: [true, 'The userId is mandatory'] },
    dId: { type: String, required: [true, 'The dId is mandatory'] },
    deviceName: { type: String, required: [true] },
    emqxRuleId: { type: String, required: [true] },
    variableFullName: { type: String, required: [true] },
    variable: { type: String, required: [true] },
    value: { type: Number, required: [true] },
    condition: { type: String, required: [true] },
    triggerTime: { type: Number, required: [true] },
    status: { type: Boolean, required: [true] },
    counter: { type: Number, required: [true] },
    createdTime: { type: Number, required: [true] }
});
const AlarmRule = (0, mongoose_1.model)('alarmRule', alarmRuleSchema);
exports.default = AlarmRule;
