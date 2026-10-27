/**
 * Fabrique des cinq routes d'une ressource (standard v3.2, section 7.3) : GET /, GET /:id, POST /, PUT /:id,
 * DELETE /:id. DELETE annule ou désactive, avec motif quand la ressource en demande un ; jamais de suppression.
 * Les routes n'ont aucune règle métier : elles valident l'entrée et appellent la fonction de service, qui porte
 * les droits et l'écriture, comme l'outil MCP correspondant.
 */
const express = require('express');
const { authMiddleware } = require('../auth');
const { validate, validateQuery, validateParams, idParam } = require('../validation');
const { ok, handle } = require('../envelope');

function crudRouter({ resource, schemas, list, get, create, update, cancel }) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/', validateQuery(schemas.list), handle((req, res) => {
    const { rows, pagination } = list(req.user, req.query);
    ok(res, rows, { resource }, pagination);
  }));
  router.get('/:id', validateParams(idParam), handle((req, res) => ok(res, get(req.user, Number(req.params.id)), { resource })));
  router.post('/', validate(schemas.create), handle((req, res) => ok(res, create(req.user, req.body), { resource }, null, 201)));
  router.put('/:id', validateParams(idParam), validate(schemas.update), handle((req, res) => {
    ok(res, update(req.user, Number(req.params.id), req.body), { resource });
  }));
  const del = schemas.cancel
    ? [validate(schemas.cancel), handle((req, res) => ok(res, cancel(req.user, Number(req.params.id), req.body.reason), { resource }))]
    : [handle((req, res) => ok(res, cancel(req.user, Number(req.params.id)), { resource }))];
  router.delete('/:id', validateParams(idParam), ...del);
  return router;
}

module.exports = { crudRouter };
