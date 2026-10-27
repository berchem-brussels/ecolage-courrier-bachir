/**
 * Paramètres de l'instance modifiables à l'écran (administrateur). Ressource unique : lecture et modification,
 * sans création ni annulation. Les paramètres publics (nom, couleurs, taille maximale d'un fichier) restent servis
 * sans session par GET /api/settings/public.
 */
const express = require('express');
const { authMiddleware, requireRole } = require('../auth');
const { validate } = require('../validation');
const { ok, handle } = require('../envelope');
const S = require('../schemas');
const settings = require('../services/settings');

const router = express.Router();
router.use(authMiddleware);

router.get('/', requireRole('admin'), handle((req, res) => ok(res, settings.get(req.user), { resource: 'settings' })));
router.put('/', requireRole('admin'), validate(S.settingsUpdate), handle((req, res) => ok(res, settings.update(req.user, req.body), { resource: 'settings' })));

module.exports = router;
