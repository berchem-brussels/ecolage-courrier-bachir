/**
 * Contrat OpenAPI 3.1 généré par introspection des routes Express et de leurs schémas ajv (patron SAGA src/openapi.js).
 * Servi sur GET /api/openapi.json aux personnes connectées. L'adresse du serveur est celle de la requête : rien en dur.
 */
function pathToOpenApi(p) {
  const out = p.replace(/:([A-Za-z_]+)/g, '{$1}');
  return out.length > 1 && out.endsWith('/') ? out.slice(0, -1) : out;
}

/** Parcourt app._router : montages app.use('/api/x', router) et routes directes. */
function collectRoutes(app) {
  const routes = [];
  const walk = (stack, prefix) => {
    for (const layer of stack) {
      if (layer.route) {
        const path = (prefix + layer.route.path).replace(/\/$/, '') || '/';
        for (const method of Object.keys(layer.route.methods)) {
          if (method === '_all') continue;
          const schemas = {};
          let content = 'application/json';
          for (const h of layer.route.stack) {
            if (h.handle && h.handle.ajvSchema) schemas[h.handle.ajvWhere] = h.handle.ajvSchema;
            if (h.handle && h.handle.ajvContent) content = h.handle.ajvContent;
          }
          routes.push({ method: method.toUpperCase(), path, schemas, content, tag: prefix.replace('/api/', '').split('/')[0] || 'core' });
        }
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        let base = '';
        if (layer.regexp && layer.regexp.source) {
          base = layer.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/').replace(/\$$/, '').replace(/[\^$]/g, '');
        }
        walk(layer.handle.stack, base === '/' ? '' : base);
      }
    }
  };
  walk(app._router.stack, '');
  return routes.filter((r) => r.path.startsWith('/api/'));
}

function buildOpenApi(app, version, publicRoutes) {
  const paths = {};
  for (const r of collectRoutes(app)) {
    const p = pathToOpenApi(r.path);
    if (!paths[p]) paths[p] = {};
    const parameters = [];
    for (const m of r.path.matchAll(/:([A-Za-z_]+)/g)) parameters.push({ name: m[1], in: 'path', required: true, schema: { type: 'integer' } });
    if (r.schemas.query) {
      for (const [name, schema] of Object.entries(r.schemas.query.properties || {})) parameters.push({ name, in: 'query', required: false, schema });
    }
    const op = {
      tags: [r.tag],
      summary: `${r.method} ${p}`,
      parameters,
      responses: {
        200: { description: 'Succès : { data, meta[, pagination] }' },
        400: { description: 'VALIDATION ou BAD_JSON' }, 401: { description: 'NO_TOKEN ou BAD_TOKEN' }, 403: { description: 'FORBIDDEN ou CSRF' },
        404: { description: 'NOT_FOUND' }, 409: { description: 'Conflit métier ou REFERENCE_INVALID' }, 413: { description: 'PAYLOAD_TOO_LARGE' },
        429: { description: 'TOO_MANY' }, 500: { description: 'INTERNAL' },
      },
      security: publicRoutes.includes(`${r.method} ${r.path}`) ? [] : [{ cookieAuth: [] }, { bearerAuth: [] }],
    };
    if (r.schemas.body && r.content === 'multipart/form-data') {
      // Dépôt de fichier : champ « file » en binaire, plus les champs texte du schéma.
      const schema = { ...r.schemas.body, properties: { file: { type: 'string', format: 'binary' }, ...r.schemas.body.properties }, required: ['file', ...(r.schemas.body.required || [])] };
      op.requestBody = { required: true, content: { 'multipart/form-data': { schema } } };
    } else if (r.schemas.body) {
      op.requestBody = { required: true, content: { 'application/json': { schema: r.schemas.body } } };
    }
    if (/\/contenu$/.test(r.path)) op.responses[200] = { description: 'Le fichier lui-même (PDF, JPEG ou PNG), hors enveloppe' };
    paths[p][r.method.toLowerCase()] = op;
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'API',
      version,
      description: "Réponse : { data, meta[, pagination] }, meta.envelope = 1. Erreur : { error: true, code, message[, details] }. Écriture par cookie : en-tête X-CSRF-Token obligatoire (jeton rendu par /api/auth/login et /api/auth/me).",
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'app_session' },
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    paths,
  };
}

module.exports = { buildOpenApi, collectRoutes };
