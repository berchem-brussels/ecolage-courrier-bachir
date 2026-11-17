/** Personnes d'un service qui traitent son courrier (version 0.3.0) : sert à nommer un agent. Monté sur /api/services. */
const express = require('express');
const { authMiddleware } = require('../auth');
const { validateQuery, validateParams, idParam } = require('../validation');
const { ok, handle } = require('../envelope');
const S = require('../schemas');
const attribution = require('../services/attribution');

const router = express.Router();
router.use(authMiddleware);

router.get('/:id/members', validateParams(idParam), validateQuery(S.serviceMembers), handle((req, res) => {
  ok(res, attribution.members(req.user, Number(req.params.id), req.query), { resource: 'service-members' });
}));

module.exports = router;
