/**
 * Confidentialité du courrier entrant (version 0.5.0, CDC CR-001 à CR-005).
 * Monté sur /api/mails avant les routes génériques : « /designable-users » n'est pas un identifiant.
 * Les routes n'ont aucune règle métier : elles valident l'entrée et appellent le service, comme les outils MCP.
 */
const express = require('express');
const { authMiddleware } = require('../auth');
const { validate, validateQuery, validateParams, idParam } = require('../validation');
const { ok, handle } = require('../envelope');
const S = require('../schemas');
const conf = require('../services/confidentiality');

const router = express.Router();
router.use(authMiddleware);

router.get('/designable-users', validateQuery(S.designableList), handle((req, res) => ok(res, conf.designableUsers(req.user, Number(req.query.entity_id)), { resource: 'users' })));

router.put('/:id/confidentiality', validateParams(idParam), validate(S.mailConfidentiality), handle((req, res) => {
  ok(res, conf.setLevel(req.user, Number(req.params.id), req.body), { resource: 'mails' });
}));

router.post('/:id/handover', validateParams(idParam), handle((req, res) => {
  ok(res, conf.handover(req.user, Number(req.params.id)), { resource: 'mails' });
}));

module.exports = router;
