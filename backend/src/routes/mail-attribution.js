/**
 * Attribution et bannettes du courrier entrant (version 0.3.0, CDC CE-060 à CE-062, CE-120).
 * Monté sur /api/mails avant les routes génériques : « /counts » ne doit pas être pris pour un identifiant.
 * Les routes n'ont aucune règle métier : elles valident l'entrée et appellent le service, comme les outils MCP.
 */
const express = require('express');
const { authMiddleware } = require('../auth');
const { validate, validateQuery, validateParams, idParam } = require('../validation');
const { ok, handle } = require('../envelope');
const S = require('../schemas');
const attribution = require('../services/attribution');
const mails = require('../services/mails');

const router = express.Router();
router.use(authMiddleware);

router.get('/counts', validateQuery(S.mailCounts), handle((req, res) => ok(res, attribution.counts(req.user, req.query), { resource: 'mails' })));

router.put('/:id/attribution', validateParams(idParam), validate(S.mailAttribution), handle((req, res) => {
  const m = attribution.attribute(req.user, Number(req.params.id), req.body);
  ok(res, mails.view(req.user, m.id), { resource: 'mails' });
}));

router.put('/:id/agent', validateParams(idParam), validate(S.mailAgent), handle((req, res) => {
  const m = attribution.setAgent(req.user, Number(req.params.id), req.body.agent_id);
  ok(res, mails.view(req.user, m.id), { resource: 'mails' });
}));

router.post('/:id/return', validateParams(idParam), validate(S.mailReturn), handle((req, res) => {
  const m = attribution.returnToSecretariat(req.user, Number(req.params.id), req.body.reason);
  // Le courrier n'a plus de service : la personne qui le renvoie peut ne plus pouvoir le lire.
  let out = null;
  try { out = mails.view(req.user, m.id); } catch (e) { out = { id: m.id, number: m.number, returned: true }; }
  ok(res, out, { resource: 'mails' });
}));

module.exports = router;
