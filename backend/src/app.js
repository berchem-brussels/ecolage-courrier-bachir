/**
 * Construction de l'application Express, séparée du démarrage pour que les tests l'utilisent telle quelle.
 * Ordre : proxy, en-têtes, limites, routes libres, routes protégées, MCP, contrat, erreurs (standard v3.2, sections 6 et 10).
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('./auth');
const { ok, fail, AppError } = require('./envelope');
const { TEST_MODE, VERSION } = require('./config');

function buildApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.use(express.json({ limit: '256kb' }));

  const limiter = (limit) => rateLimit({
    windowMs: 60 * 1000, limit: TEST_MODE ? 100000 : limit, standardHeaders: true, legacyHeaders: false,
    handler: (req, res) => fail(res, req, 429, 'TOO_MANY'),
  });
  const reads = limiter(3000);
  const writes = limiter(120);
  app.use('/api/', (req, res, next) => (req.method === 'GET' ? reads : writes)(req, res, next));

  const publicRouter = require('./routes/public');
  app.use('/api', publicRouter);
  app.use('/api/auth', require('./routes/auth'));
  for (const [mount, router] of Object.entries(require('./routes/resources').RESOURCES)) app.use(mount, router);
  app.use('/api/users', require('./routes/users'));
  app.use('/api/pieces', require('./routes/pieces'));
  app.use('/api/consultations', require('./routes/consultations'));
  app.use('/api/settings', require('./routes/settings'));

  const { handleRpc } = require('./mcp');
  const mcpLimiter = rateLimit({
    windowMs: 60 * 1000, limit: Number(process.env.MCP_RATE_MAX || 60), standardHeaders: true, legacyHeaders: false,
    keyGenerator: (req) => `u${req.user.id}`, handler: (req, res) => fail(res, req, 429, 'TOO_MANY'),
  });
  app.post('/api/mcp', authMiddleware, mcpLimiter, (req, res) => {
    const out = handleRpc(req.body || {}, { user: req.user, version: VERSION });
    if (out === null) return res.status(202).end();
    res.json(out);
  });

  const { buildOpenApi } = require('./openapi');
  app.get('/api/openapi.json', authMiddleware, (req, res) => res.json(buildOpenApi(app, VERSION, publicRouter.PUBLIC_ROUTES)));

  app.use('/api', (req, res) => fail(res, req, 404, 'NOT_FOUND'));

  // Gestionnaire d'erreurs unique : code et libellé traduit, détail au journal seulement.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof AppError) return fail(res, req, err.status, err.code, err.details);
    if (err && err.type === 'entity.parse.failed') return fail(res, req, 400, 'BAD_JSON');
    if (err && err.type === 'entity.too.large') return fail(res, req, 413, 'PAYLOAD_TOO_LARGE');
    if (err && /FOREIGN KEY constraint failed/i.test(String(err.message))) return fail(res, req, 409, 'REFERENCE_INVALID');
    console.error('[ERREUR]', err && err.stack ? err.stack : err);
    fail(res, req, 500, 'INTERNAL');
  });

  return app;
}

module.exports = { buildApp, ok };
