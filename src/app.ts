import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import { resolveTenant, notFound, errorHandler } from './middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import sessionRoutes from './routes/session.routes';
import tenantRoutes from './routes/tenant.routes';
import menuRoutes from './routes/menu.routes';
import permissionRoutes from './routes/permission.routes';
import policyRoutes from './routes/policy.routes';
import aclRoutes from './routes/acl.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(resolveTenant);

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/users`, userRoutes);
app.use(`${config.apiPrefix}/roles`, roleRoutes);
app.use(`${config.apiPrefix}/sessions`, sessionRoutes);
app.use(`${config.apiPrefix}/tenants`, tenantRoutes);
app.use(`${config.apiPrefix}/menus`, menuRoutes);
app.use(`${config.apiPrefix}/permissions`, permissionRoutes);
app.use(`${config.apiPrefix}/policies`, policyRoutes);
app.use(`${config.apiPrefix}/acl`, aclRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
