# Manifeste, version 0.4.0 du 17/11/2026

Archive `courrier-v0_4_0.tar.gz`, un seul dossier `courrier/`. La 0.4.0 est l'étape 4 du planning (traitement) et reprend tout le contenu de la 0.3.1, **dernière version publiée sur GitHub** : la demande de fusion de la 0.4.0 porte donc seulement les changements listés ci-dessous.

## Dépendances

Aucune dépendance ajoutée ni changée. Les numéros de version passent à 0.4.0 dans les deux `package.json` et leurs verrous (seule ligne modifiée ; `npm ci` relit les verrous sans erreur).

## Suites jouées le 17/11/2026 (Node 22.23.4, bac à sable, npm 10.9.9)

| Suite | Commande | Résultat recopié de la sortie |
| --- | --- | --- |
| Serveur | `cd backend && npm test` | tests 174, pass 174, fail 0, skipped 0 |
| Écrans, axe-core FR et NL, traductions, étiquettes, champs nommés, connexion, tickets, aide, FAQ, attribution, bannettes, cloche, traitement | `cd frontend && npm test` | Test Files 9 passed, Tests 160 passed, 1 skipped |
| Contrôle strict des captures | `cd frontend && npm run help:check` | Tests 22 passed |
| Typage, accessibilité statique, construction | `npx tsc -b`, `npm run a11y`, `npm run build` | 0 erreur, 0 erreur, built |
| Audit serveur et interface | `npm audit --omit=dev` dans les deux dossiers | found 0 vulnerabilities |
| Audit des fiches | `npm run help:audit` sur l'instance de démonstration | 1 test réussi |
| Script de recette | `recette.mjs` sur l'instance de démonstration (navigateur sans affichage) | 38 contrôles OK, « Tous les contrôles sont conformes » |
| Recette de la FAQ | `recette-faq.mjs`, deux passages de suite | 5 contrôles OK chaque fois |
| Recette de l'attribution et du traitement | `recette-agent.mjs` | 69 contrôles OK, comptes de test désactivés et courrier fictif annulé à la fin |
| Preuves d'échec | Contrôles contournés un à un sur des copies | Serveur : 24 sur 24 détectés ; interface : 15 sur 15 détectés (`docs/SECURITE.md`) |

Les captures de l'aide ne changent pas depuis la 0.3.0 : 20 par langue.

## Fichiers nouveaux depuis la 0.3.1 (9)

- `NOTES_LIVRAISON_v0.4.0.md`
- `backend/src/routes/mail-processing.js`
- `backend/src/services/close-reasons.js`
- `backend/src/services/processing.js`
- `backend/tests/traitement.test.js`
- `docs/fonctionnel/traitement.md`
- `frontend/src/components/CloseReasonsCard.tsx`
- `frontend/src/components/TraitementCard.tsx`
- `frontend/src/test/traitement.test.tsx`

## Fichiers modifiés depuis la 0.3.1 (47)

- `CHANGELOG.md`
- `DECISIONS.md`
- `ECARTS-CDC.md`
- `ETAT.md`
- `MANIFESTE.md`
- `README.md`
- `backend/package-lock.json`
- `backend/package.json`
- `backend/src/app.js`
- `backend/src/database.js`
- `backend/src/i18n-server.js`
- `backend/src/mcp.js`
- `backend/src/routes/resources.js`
- `backend/src/schemas.js`
- `backend/src/services/access.js`
- `backend/src/services/attribution.js`
- `backend/src/services/entities.js`
- `backend/src/services/mails.js`
- `backend/tests/attribution.test.js`
- `backend/tests/mcp.test.js`
- `backend/tests/securite.test.js`
- `docs/APRES-DEPLOIEMENT.md`
- `docs/SECURITE.md`
- `docs/en/ARCHITECTURE.md`
- `docs/fonctionnel/attribution.md`
- `docs/fr/ARCHITECTURE.md`
- `docs/nl/ARCHITECTURE.md`
- `frontend/help-capture/audit-fiches.spec.ts`
- `frontend/help-capture/demo-server.cjs`
- `frontend/help-capture/recette-agent.mjs`
- `frontend/help-capture/recette-faq.mjs`
- `frontend/help-capture/recette.mjs`
- `frontend/package-lock.json`
- `frontend/package.json`
- `frontend/src/components/AttributionCard.tsx`
- `frontend/src/components/MailDrawer.tsx`
- `frontend/src/components/NotificationBell.tsx`
- `frontend/src/help/topics/bannettes.ts`
- `frontend/src/help/topics/register.ts`
- `frontend/src/help/topics/types.ts`
- `frontend/src/hints.ts`
- `frontend/src/i18n.ts`
- `frontend/src/pages/BannettesPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/TypesPage.tsx`
- `frontend/src/test/attribution.test.tsx`
- `frontend/src/test/pages.test.tsx`

## Fichiers retirés

Aucun.

## Ce qui est simulé ou incomplet

Base `sql.js` : maquette d'atelier, données fictives uniquement ; aucun courrier ni aucun scan réel avant PostgreSQL (étape 8) et l'accord de Renaud. Pas de tâches liées, de statut « Répondu », de délais, de rappels ni d'escalades à cette étape. Voir `ETAT.md`, section 5.
