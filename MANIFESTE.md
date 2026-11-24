# Manifeste, version 0.5.0 du 24/11/2026

Archive `courrier-v0_5_0.tar.gz`, un seul dossier `courrier/`. La 0.5.0 est l'étape 5 du planning, première moitié (confidentialité et E75). Elle reprend tout le contenu de la 0.4.1, **dernière version publiée sur GitHub** (demande de fusion n° 11, `bb5e03c`) : la demande de fusion de la 0.5.0 porte donc seulement les changements listés ci-dessous.

## Dépendances

Aucune dépendance ajoutée ni changée. Les numéros de version passent à 0.5.0 dans les deux `package.json` et leurs verrous (seule ligne modifiée ; `npm ci` relit les verrous sans erreur).

## Suites jouées le 24/11/2026 (Node 22.23.5, bac à sable, npm 10.9.9)

| Suite | Commande | Résultat recopié de la sortie |
| --- | --- | --- |
| Serveur | `cd backend && npm test` | tests 196, pass 196, fail 0 |
| Écrans, axe-core FR et NL, traductions, étiquettes, champs nommés, connexion, tickets, aide, FAQ, attribution, bannettes, cloche, traitement, confidentialité | `cd frontend && npm test` | Test Files 10 passed, Tests 177 passed, 1 skipped |
| Contrôle strict des captures | `cd frontend && npm run help:check` | Tests 22 passed |
| Typage, accessibilité statique, construction | `npx tsc -b`, `npm run a11y`, `npm run build` | 0 erreur, 0 erreur, built |
| Audit serveur et interface | `npm audit --omit=dev` dans les deux dossiers | found 0 vulnerabilities |
| Audit des fiches | `npm run help:audit` sur l'instance de démonstration | 1 test réussi |
| Scripts de recette | `recette.mjs`, `recette-faq.mjs`, `recette-agent.mjs`, `recette-e55.mjs`, `recette-confidentialite.mjs` sur l'instance de démonstration (navigateur sans affichage) | 38, 5, 69, 36 et 37 contrôles OK, « Tous les contrôles sont conformes » à chaque fois |
| Routes et outils MCP | collecte sur le serveur de test | 98 routes ; 92 outils exposés ; test de parité réussi |
| Preuves d'échec | Contrôles contournés un à un sur le code réel (`docs/SECURITE.md`) | Serveur : 19 sur 19 détectés ; interface : 13 sur 13 détectés, 1 mutant équivalent |

Non jouées dans cet environnement : les scripts de recette sur NIXUS (adresse interne), à lancer par le conducteur ; la liste de contrôle des notes de livraison.

## Fichiers nouveaux depuis la 0.4.1 (11)

- `NOTES_LIVRAISON_v0.5.0.md`
- `backend/src/routes/mail-confidentiality.js`
- `backend/src/services/confidentiality.js`
- `backend/tests/confidentialite.test.js`
- `docs/fonctionnel/confidentialite.md`
- `frontend/help-capture/recette-confidentialite.mjs`
- `frontend/help-capture/recette-e55.mjs`
- `frontend/help-capture/recette-parcours.mjs`
- `frontend/src/components/ConfidentialityCard.tsx`
- `frontend/src/components/LevelTag.tsx`
- `frontend/src/test/confidentialite.test.tsx`

## Fichiers modifiés depuis la 0.4.1 (37)

- `CHANGELOG.md`
- `DECISIONS.md`
- `ECARTS-CDC.md`
- `ETAT.md`
- `MANIFESTE.md`
- `backend/package-lock.json`
- `backend/package.json`
- `backend/src/app.js`
- `backend/src/database.js`
- `backend/src/i18n-server.js`
- `backend/src/mcp.js`
- `backend/src/schemas.js`
- `backend/src/services/access.js`
- `backend/src/services/attribution.js`
- `backend/src/services/mails.js`
- `backend/src/services/pieces.js`
- `backend/src/services/processing.js`
- `backend/src/services/users.js`
- `backend/tests/api.test.js`
- `docs/APRES-DEPLOIEMENT.md`
- `docs/SECURITE.md`
- `docs/fonctionnel/traitement.md`
- `frontend/help-capture/recette.mjs`
- `frontend/package-lock.json`
- `frontend/package.json`
- `frontend/src/components/AttributionCard.tsx`
- `frontend/src/components/MailDrawer.tsx`
- `frontend/src/components/RegistrationForm.tsx`
- `frontend/src/components/TraitementCard.tsx`
- `frontend/src/help/topics/register.ts`
- `frontend/src/help/topics/registration.ts`
- `frontend/src/hints.ts`
- `frontend/src/i18n.ts`
- `frontend/src/pages/BannettesPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`
- `frontend/src/pages/UsersPage.tsx`
- `frontend/src/test/attribution.test.tsx`

## Ce que cette archive ne contient pas

Ni `node_modules`, ni `dist`, ni rapport de recette, ni capture, ni fichier `.env`, ni base : seulement le code, les tests, les scripts, les documents et la licence.
