"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = exports.requireModule = exports.requireAnyPermission = exports.requirePermission = exports.resolveTenant = exports.authOptional = exports.authRequired = void 0;
var auth_middleware_1 = require("./auth.middleware");
Object.defineProperty(exports, "authRequired", { enumerable: true, get: function () { return auth_middleware_1.authRequired; } });
Object.defineProperty(exports, "authOptional", { enumerable: true, get: function () { return auth_middleware_1.authOptional; } });
var tenant_middleware_1 = require("./tenant.middleware");
Object.defineProperty(exports, "resolveTenant", { enumerable: true, get: function () { return tenant_middleware_1.resolveTenant; } });
var iam_middleware_1 = require("./iam.middleware");
Object.defineProperty(exports, "requirePermission", { enumerable: true, get: function () { return iam_middleware_1.requirePermission; } });
Object.defineProperty(exports, "requireAnyPermission", { enumerable: true, get: function () { return iam_middleware_1.requireAnyPermission; } });
var module_middleware_1 = require("./module.middleware");
Object.defineProperty(exports, "requireModule", { enumerable: true, get: function () { return module_middleware_1.requireModule; } });
var error_middleware_1 = require("./error.middleware");
Object.defineProperty(exports, "notFound", { enumerable: true, get: function () { return error_middleware_1.notFound; } });
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return error_middleware_1.errorHandler; } });
//# sourceMappingURL=index.js.map