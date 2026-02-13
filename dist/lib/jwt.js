"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function signAccessToken(payload) {
    const tokenPayload = { ...payload, type: 'access' };
    const secret = String(config_1.config.jwt.secret);
    const expiresIn = String(config_1.config.jwt.accessExpiry);
    const issuer = String(config_1.config.jwt.issuer);
    return jsonwebtoken_1.default.sign(tokenPayload, secret, { expiresIn, issuer });
}
function signRefreshToken(payload) {
    const tokenPayload = { ...payload, type: 'refresh' };
    const secret = String(config_1.config.jwt.secret);
    const expiresIn = String(config_1.config.jwt.refreshExpiry);
    const issuer = String(config_1.config.jwt.issuer);
    return jsonwebtoken_1.default.sign(tokenPayload, secret, { expiresIn, issuer });
}
function verifyToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, String(config_1.config.jwt.secret), {
        issuer: String(config_1.config.jwt.issuer),
    });
    return decoded;
}
//# sourceMappingURL=jwt.js.map