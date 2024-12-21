"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const saverRuleSchema = new mongoose_1.Schema({
    userId: { type: String, required: [true] },
    dId: { type: String, required: [true] },
    emqxRuleId: { type: String, required: [true] },
    status: { type: Boolean, required: [true] }
});
const SaverRule = (0, mongoose_1.model)('SaverRule', saverRuleSchema);
exports.default = SaverRule;
