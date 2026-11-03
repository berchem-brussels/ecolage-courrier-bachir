# Manifeste, version 0.2.6 du 03/11/2026

Archive `courrier-v0_2_6.tar.gz`, un seul dossier `courrier/`. Point de départ : la version 0.2.5, publiée sur GitHub. La 0.2.6 reprend du gabarit 1.3.0 les tickets de l'application (standard v3.3, section 13.5), adaptés aux rôles par entité ; deuxième version du lot « connexion, tickets, aide par écran ».

## Dépendances

Aucune dépendance ajoutée, changée ni montée de génération ; les deux verrous ne changent que par le numéro de version. Les deux numéros de version passent à 0.2.6.

## Suites jouées le 03/11/2026 (Node 22.22.2, bac à sable, npm 10.9.7)

| Suite | Commande | Résultat recopié de la sortie |
| --- | --- | --- |
| Serveur | `cd backend && npm test` | tests 110, pass 110, fail 0, skipped 0 |
| Écrans, axe-core FR et NL, traductions, étiquettes, imports, connexion, tickets | `cd frontend && npm test` | Test Files 5 passed, Tests 78 passed |
| Typage | `cd frontend && npx tsc -b` | 0 erreur |
| Accessibilité statique | `cd frontend && npm run a11y` | 0 erreur |
| Construction | `cd frontend && npm run build` | built, 0 erreur |
| Audit serveur et interface | `npm audit --omit=dev` dans les deux dossiers | found 0 vulnerabilities |
| Parcours réel | Interface construite, serveur réel, Chromium : demandeur du secrétariat, gestionnaire du registre, administrateur | 10 contrôles sur 10 : aucune capture sur le registre, question envoyée, deux tickets suivis, file métier limitée à l'entité, résolution avec motif obligatoire, file IT de l'administrateur, réglages |
| Preuves d'échec | Onze contrôles de sécurité des tickets retirés un à un, suites rejouées, fichiers restaurés | Voir `docs/SECURITE.md` : tous détectés |
| Premier envoi simulé | Procédure de la section 5 de GITHUB.md sur une copie du dépôt de la 0.2.5 | Voir le message de livraison |

## Fichiers nouveaux (11)

- `backend/src/services/tickets.js`, `backend/src/routes/tickets.js`, `backend/tests/tickets.test.js`
- `frontend/src/screens.ts`, `frontend/src/components/ReportTicketModal.tsx`, `TicketDrawer.tsx`, `TicketSettingsCard.tsx`, `frontend/src/pages/TicketsPage.tsx`, `frontend/src/test/tickets.test.tsx`
- `docs/fonctionnel/tickets.md`
- `NOTES_LIVRAISON_v0.2.6.md`

## Fichiers modifiés (32)

- Serveur : `backend/src/app.js`, `database.js` (migration 007), `i18n-server.js`, `mcp.js` (11 outils), `routes/settings.js`, `schemas.js`, `settings.js` ; `backend/tests/mcp.test.js`, `securite.test.js` ; `backend/package.json`, `backend/package-lock.json` (numéro)
- Interface : `frontend/src/App.tsx`, `api.ts`, `components/AppLayout.tsx`, `hints.ts`, `i18n.ts`, `pages/SettingsPage.tsx`, `test/pages.test.tsx` ; `frontend/nginx.conf` ; `frontend/package.json`, `frontend/package-lock.json` (numéro)
- Documents : `CHANGELOG.md`, `DECISIONS.md`, `ECARTS-CDC.md`, `ETAT.md`, `MANIFESTE.md`, `README.md`, `docs/APRES-DEPLOIEMENT.md`, `docs/SECURITE.md`, `docs/fr|nl|en/ARCHITECTURE.md`

## Fichiers retirés

Aucun.

## Ce qui est simulé ou incomplet

Pas de notification par courriel des tickets (étape 10). Aucune conservation appliquée aux tickets ni aux captures (E37). Le serveur refuse la capture d'après l'écran déclaré, pas d'après le contenu de l'image (E36). Explication de champ limitée à la connexion et aux tickets (E33, 0.2.7). La FAQ locale et le lien d'un ticket vers la FAQ arrivent en 0.2.8.
