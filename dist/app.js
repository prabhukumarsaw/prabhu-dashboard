"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = require("./config");
const swagger_1 = require("./config/swagger");
const middleware_1 = require("./middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const session_routes_1 = __importDefault(require("./routes/session.routes"));
const tenant_routes_1 = __importDefault(require("./routes/tenant.routes"));
const menu_routes_1 = __importDefault(require("./routes/menu.routes"));
const permission_routes_1 = __importDefault(require("./routes/permission.routes"));
const policy_routes_1 = __importDefault(require("./routes/policy.routes"));
const acl_routes_1 = __importDefault(require("./routes/acl.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const file_routes_1 = __importDefault(require("./routes/file.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const export_import_routes_1 = __importDefault(require("./routes/export-import.routes"));
const realtime_routes_1 = __importDefault(require("./routes/realtime.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use((0, morgan_1.default)(config_1.config.env === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.windowMs,
    max: config_1.config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use(middleware_1.resolveTenant);
app.get('/health', (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
});
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, { explorer: true }));
app.use(`${config_1.config.apiPrefix}/auth`, auth_routes_1.default);
app.use(`${config_1.config.apiPrefix}/users`, user_routes_1.default);
app.use(`${config_1.config.apiPrefix}/roles`, role_routes_1.default);
app.use(`${config_1.config.apiPrefix}/sessions`, session_routes_1.default);
app.use(`${config_1.config.apiPrefix}/tenants`, tenant_routes_1.default);
app.use(`${config_1.config.apiPrefix}/menus`, menu_routes_1.default);
app.use(`${config_1.config.apiPrefix}/permissions`, permission_routes_1.default);
app.use(`${config_1.config.apiPrefix}/policies`, policy_routes_1.default);
app.use(`${config_1.config.apiPrefix}/acl`, acl_routes_1.default);
app.use(`${config_1.config.apiPrefix}/notifications`, notification_routes_1.default);
app.use(`${config_1.config.apiPrefix}/files`, file_routes_1.default);
app.use(`${config_1.config.apiPrefix}/search`, search_routes_1.default);
app.use(`${config_1.config.apiPrefix}/export-import`, export_import_routes_1.default);
app.use(`${config_1.config.apiPrefix}/realtime`, realtime_routes_1.default);
app.use(middleware_1.notFound);
app.use(middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map