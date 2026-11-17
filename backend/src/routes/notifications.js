/** Cloche de notifications de la personne connectée (version 0.3.0, CDC CE-140) : liste et lecture. */
const express = require('express');
const { authMiddleware } = require('../auth');
const { validate, validateQuery } = require('../validation');
const { ok, handle } = require('../envelope');
const S = require('../schemas');
const notifications = require('../services/notifications');

const router = express.Router();
router.use(authMiddleware);

router.get('/', validateQuery(S.notificationList), handle((req, res) => {
  const r = notifications.list(req.user, req.query);
  ok(res, r.rows, { resource: 'notifications', unread: r.unread }, r.pagination);
}));

router.post('/read', validate(S.notificationRead), handle((req, res) => ok(res, notifications.markRead(req.user, req.body.ids), { resource: 'notifications' })));

module.exports = router;
