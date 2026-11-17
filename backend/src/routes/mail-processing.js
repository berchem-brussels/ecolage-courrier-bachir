/**
 * Traitement du courrier entrant (version 0.4.0, CDC CE-070, CE-071, CE-073, CE-079) : prise en charge, clôture,
 * réouverture, commentaires, historique. Monté sur /api/mails avant les routes génériques.
 * Les routes n'ont aucune règle métier : elles valident l'entrée et appellent le service, comme les outils MCP.
 */
const express = require('express');
const { authMiddleware } = require('../auth');
const { validate, validateParams, idParam } = require('../validation');
const { ok, handle } = require('../envelope');
const S = require('../schemas');
const processing = require('../services/processing');
const mails = require('../services/mails');

const router = express.Router();
router.use(authMiddleware);

router.post('/:id/take', validateParams(idParam), handle((req, res) => {
  processing.take(req.user, Number(req.params.id));
  ok(res, mails.view(req.user, Number(req.params.id)), { resource: 'mails' });
}));

router.post('/:id/close', validateParams(idParam), validate(S.mailClose), handle((req, res) => {
  processing.close(req.user, Number(req.params.id), req.body);
  ok(res, mails.view(req.user, Number(req.params.id)), { resource: 'mails' });
}));

router.post('/:id/reopen', validateParams(idParam), validate(S.mailReopen), handle((req, res) => {
  processing.reopen(req.user, Number(req.params.id), req.body.reason);
  ok(res, mails.view(req.user, Number(req.params.id)), { resource: 'mails' });
}));

router.get('/:id/comments', validateParams(idParam), handle((req, res) => ok(res, processing.comments(req.user, Number(req.params.id)), { resource: 'mail-comments' })));

router.post('/:id/comments', validateParams(idParam), validate(S.mailComment), handle((req, res) => {
  ok(res, processing.addComment(req.user, Number(req.params.id), req.body), { resource: 'mail-comments' }, null, 201);
}));

router.get('/:id/history', validateParams(idParam), handle((req, res) => ok(res, processing.history(req.user, Number(req.params.id)), { resource: 'mail-history' })));

module.exports = router;
