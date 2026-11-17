/** FAQ locale : lecture par toute personne connectée, gestion par l'administrateur et les gestionnaires du registre. */
const express = require('express');
const { authMiddleware } = require('../auth');
const { validate, validateQuery, validateParams, idParam } = require('../validation');
const { ok, handle } = require('../envelope');
const S = require('../schemas');
const faq = require('../services/faq');

const router = express.Router();
router.use(authMiddleware);
const meta = { resource: 'faq' };
router.get('/', validateQuery(S.faqList), handle((req, res) => { const { rows, pagination } = faq.list(req.user, req.query); ok(res, rows, meta, pagination); }));
router.get('/:id', validateParams(idParam), handle((req, res) => ok(res, faq.get(req.user, Number(req.params.id)), meta)));
router.post('/', validate(S.faqCreate), handle((req, res) => ok(res, faq.create(req.user, req.body), meta, null, 201)));
router.put('/:id', validateParams(idParam), validate(S.faqUpdate), handle((req, res) => ok(res, faq.update(req.user, Number(req.params.id), req.body), meta)));
router.delete('/:id', validateParams(idParam), handle((req, res) => ok(res, faq.deactivate(req.user, Number(req.params.id)), meta)));
module.exports = router;
