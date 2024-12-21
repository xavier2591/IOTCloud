"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    userId: { type: String, required: [true, 'the userId is mandatory'] },
    dId: { type: String, required: [true, 'the dId is mandatory'] },
    deviceName: { type: String, required: [true, 'the deviceName is mandatory'] },
    payload: { type: Object },
    emqxRuleId: { type: String, required: [true] },
    topic: { type: String, required: [true] },
    value: { type: Number, required: [true] },
    condition: { type: String, required: [true] },
    variableFullName: { type: String },
    variable: { type: String, required: [true] },
    readed: { type: Boolean, required: [true] },
    time: { type: Number, required: [true] }
});
const Notification = (0, mongoose_1.model)('Notification', notificationSchema);
exports.default = Notification;
