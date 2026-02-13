"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const express_validator_1 = require("express-validator");
function validate(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (errors.isEmpty()) {
        next();
        return;
    }
    res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.type === 'field' ? e.path : 'unknown', message: e.msg })),
    });
}
//# sourceMappingURL=validate.js.map