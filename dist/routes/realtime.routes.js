"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../middleware");
const realtime_service_1 = require("../services/realtime.service");
const router = (0, express_1.Router)();
router.use(middleware_1.authRequired);
// Server-Sent Events endpoint
router.get('/sse', (0, realtime_service_1.createSSEHandler)());
exports.default = router;
//# sourceMappingURL=realtime.routes.js.map