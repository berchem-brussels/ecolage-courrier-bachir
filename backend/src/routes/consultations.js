/**
 * Journal des consultations, en lecture seule (CDC CG-003) : réservé à l'auditeur de l'entité.
 * Le journal s'écrit par l'application à chaque ouverture de fiche et à chaque lecture de pièce ; il ne se crée,
 * ne se modifie et ne s'annule par aucune route, ce qui explique l'absence des quatre autres routes de la ressource.
 */
const express = require('express');
const { authMiddleware } = require('../auth');
const { validateQuery } = require('../validation');
const { ok, handle } = require('../envelope');
const S = require('../schemas');
const consultations = require('../services/consultations');

const router = express.Router();
router.use(authMiddleware);

router.get('/', validateQuery(S.consultationList), handle((req, res) => {
  const { rows, pagination } = consultations.list(req.user, req.query);
  ok(res, rows, { resource: 'consultations' }, pagination);
}));

module.exports = router;
