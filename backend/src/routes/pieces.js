/**
 * Pièces (version 0.2.0) : les cinq routes de la ressource et la lecture du contenu.
 * - POST / reçoit un fichier en multipart/form-data (champ « file ») par multer, dans un dossier temporaire du volume
 *   de données ; la session et le jeton anti-CSRF sont contrôlés avant la réception. Le service vérifie ensuite les
 *   droits, la taille et le type réel, puis range le fichier sous un nom généré.
 * - GET /:id/contenu sert le fichier lui-même, authentifié par le cookie de session (standard v3.2, section 8.3) :
 *   c'est l'adresse qu'ouvrent l'aperçu de l'écran et le bouton « Ouvrir ». Seule réponse hors enveloppe avec le MCP
 *   et le contrat OpenAPI, puisqu'elle rend un fichier. Elle peut s'afficher dans un cadre de l'application même
 *   (frame-ancestors 'self'), jamais dans un autre site.
 * - DELETE /:id rejette une pièce de la file avec motif ; rien n'est supprimé.
 */
const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { authMiddleware } = require('../auth');
const { validate, validateQuery, validateParams, idParam, obj } = require('../validation');
const { ok, fail, handle } = require('../envelope');
const S = require('../schemas');
const pieces = require('../services/pieces');

const router = express.Router();
router.use(authMiddleware);

/** Réception d'un seul fichier, plafonnée par le paramètre de l'instance lu à chaque envoi. */
function receive(req, res, next) {
  pieces.cleanTmp();
  const { maxBytes, maxMb } = pieces.limits();
  const upload = multer({
    storage: multer.diskStorage({
      destination: (r, f, cb) => { fs.mkdirSync(pieces.TMP_DIR, { recursive: true }); cb(null, pieces.TMP_DIR); },
      filename: (r, f, cb) => cb(null, `up-${crypto.randomBytes(12).toString('hex')}`),
    }),
    limits: { fileSize: maxBytes, files: 1, fields: 5, fieldNameSize: 50, fieldSize: 1024, parts: 7 },
  }).single('file');
  // Le fichier temporaire ne survit jamais à la réponse : le service le déplace s'il est accepté, sinon il est effacé ici.
  res.on('finish', () => { if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.rmSync(req.file.path, { force: true }); });
  upload(req, res, (err) => {
    if (!err) return next();
    if (req.file && req.file.path) fs.rmSync(req.file.path, { force: true });
    if (err.code === 'LIMIT_FILE_SIZE') return fail(res, req, 413, 'FILE_TOO_LARGE', [`max_mb: ${maxMb}`]);
    if (err instanceof multer.MulterError) return fail(res, req, 400, 'VALIDATION', [`${err.field || 'file'}: ${err.code}`]);
    return next(err);
  });
}

/** Champs texte du dépôt, validés après la réception (déclarés en multipart/form-data dans le contrat OpenAPI). */
const checkFields = validate(S.pieceCreate);
checkFields.ajvContent = 'multipart/form-data';

const contentQuery = obj({ telecharger: { type: 'integer', enum: [0, 1] } });

router.get('/', validateQuery(S.pieceList), handle((req, res) => {
  const { rows, pagination } = pieces.list(req.user, req.query);
  ok(res, rows, { resource: 'pieces' }, pagination);
}));

router.get('/:id', validateParams(idParam), handle((req, res) => ok(res, pieces.get(req.user, Number(req.params.id)), { resource: 'pieces' })));

router.get('/:id/contenu', validateParams(idParam), validateQuery(contentQuery), handle((req, res) => {
  const c = pieces.content(req.user, Number(req.params.id));
  const ascii = c.original_name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const disposition = req.query.telecharger === 1 ? 'attachment' : 'inline';
  res.setHeader('Content-Type', c.mime);
  res.setHeader('Content-Length', String(fs.statSync(c.file).size));
  res.setHeader('Content-Disposition', `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(c.original_name)}`);
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'self'");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Cache-Control', 'private, no-store');
  fs.createReadStream(c.file).on('error', (e) => { console.error('[PIECES] Lecture impossible :', e.message); res.destroy(); }).pipe(res);
}));

router.post('/', receive, checkFields, handle((req, res) => {
  ok(res, pieces.create(req.user, { ...req.body, file: req.file }), { resource: 'pieces' }, null, 201);
}));

router.put('/:id', validateParams(idParam), validate(S.pieceUpdate), handle((req, res) => {
  ok(res, pieces.update(req.user, Number(req.params.id), req.body), { resource: 'pieces' });
}));

router.delete('/:id', validateParams(idParam), validate(S.cancelReason), handle((req, res) => {
  ok(res, pieces.cancel(req.user, Number(req.params.id), req.body.reason), { resource: 'pieces' });
}));

module.exports = router;
