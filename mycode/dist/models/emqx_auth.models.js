"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmqxAuthRule = void 0;
const mongoose_1 = require("mongoose");
//import uniqueValidator from 'mongoose-unique-validator';
const emqxAuthRuleSchema = new mongoose_1.Schema({
    userId: { type: String, required: [true, 'The userId is mandatory'] },
    dId: { type: String },
    username: { type: String, required: [true, 'The username is mandatory'] },
    password: { type: String, required: [true, 'The password is mandatory'] },
    publish: { type: Array },
    subscribe: { type: Array },
    type: { type: String, required: [true, 'The type is mandatory'] },
    time: { type: Number },
    updatedTime: { type: Number }
});
exports.EmqxAuthRule = (0, mongoose_1.model)('EmqxAuthRule', emqxAuthRuleSchema);
