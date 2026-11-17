# Manifeste, version 0.2.9 du 17/11/2026

Archive `courrier-v0_2_9.tar.gz`, un seul dossier `courrier/`. La 0.2.9 corrige les défauts relevés à la recette de la 0.2.8 (installée sur NIXUS, non publiée) et en reprend tout le contenu. **Dernière version publiée sur GitHub : 0.2.7** : la demande de fusion de la 0.2.9 porte donc les changements des deux versions ; le manifeste de la 0.2.8 (45 fichiers nouveaux, 57 modifiés par rapport à la 0.2.7, voir l'historique du dépôt et `NOTES_LIVRAISON_v0.2.8.md`) s'ajoute à celui-ci.

## Dépendances

Aucun changement depuis la 0.2.8. Par rapport à la 0.2.7 publiée : une dépendance de développement (`@playwright/test`, plage `^1.61.1`, 1.64.1 installée). Les numéros de version passent à 0.2.9.

## Suites jouées le 17/11/2026 (Node 22.22.2, bac à sable, npm 10.9.7)

| Suite | Commande | Résultat recopié de la sortie |
| --- | --- | --- |
| Serveur | `cd backend && npm test` | tests 118, pass 118, fail 0, skipped 0 |
| Écrans, axe-core FR et NL, traductions, étiquettes, champs nommés, connexion, tickets, aide, FAQ, captures | `cd frontend && npm test` | Test Files 7 passed, Tests 117 passed, 1 skipped (contrôle strict joué par `help:check`) |
| Contrôle strict des captures | `cd frontend && npm run help:check` | Tests 22 passed |
| Typage, accessibilité statique, construction | `npx tsc -b`, `npm run a11y`, `npm run build` | 0 erreur, 0 erreur, built |
| Audit serveur et interface | `npm audit --omit=dev` dans les deux dossiers | found 0 vulnerabilities |
| Captures | `npm run help:demo` puis `npm run help:capture` | 1 test réussi : 18 captures par langue (36 images) |
| Audit des fiches | `npm run help:audit` sur l'instance de démonstration | 1 test réussi |
| Script de recette | `recette.mjs` sur l'instance de démonstration (navigateur sans affichage) | Trois relances sur trois : « Tous les contrôles sont conformes » ; une remarque intermittente de Chrome vue une fois sur quatre essais, non reproduite |
| Preuves d'échec | Cinq contrôles contournés un à un | Voir `docs/SECURITE.md` : tous détectés |

## Fichiers nouveaux depuis la 0.2.8 (3)

`frontend/help-capture/audit-fiches.spec.ts`, `frontend/help-capture/recette.mjs`, `NOTES_LIVRAISON_v0.2.9.md`

## Fichiers modifiés depuis la 0.2.8

- Interface : `frontend/src/help/topics/entities.ts`, `inbox.ts`, `users.ts`, `help/types.ts` ; `pages/ConsultationsPage.tsx`, `ContactsPage.tsx`, `InboxPage.tsx`, `RegisterPage.tsx`, `ServicesPage.tsx`, `TypesPage.tsx` ; `components/Chatbot.tsx`, `MailDrawer.tsx` ; `test/help.test.ts`, `pages.test.tsx` ; les 36 images `frontend/public/help/fr|nl/*.jpg` (régénérées)
- Captures et outils : `frontend/help-capture/capture.spec.ts`, `demo-server.cjs`, `playwright.help.config.ts` ; `frontend/package.json`, `package-lock.json` (script `help:audit`, numéro) ; `backend/package.json`, `package-lock.json` (numéro)
- Documents : `CHANGELOG.md`, `DECISIONS.md`, `ECARTS-CDC.md`, `ETAT.md`, `MANIFESTE.md`, `README.md`, `docs/APRES-DEPLOIEMENT.md`, `docs/SECURITE.md`, `docs/fr|nl|en/ARCHITECTURE.md`

## Fichiers retirés

Aucun.

## Ce qui est simulé ou incomplet

Le dépôt GitHub est à la 0.2.7 : le décompte exact des fichiers de la demande de fusion n'a pas été simulé ici (je ne dispose plus de l'archive 0.2.7), il s'affiche avec `git status` ; il doit montrer des fichiers nouveaux et modifiés, aucun supprimé, et rien de `.env`, `node_modules`, `data/`, `.db` ni `report-`. Les remarques de Chrome se relèvent par le script sur l'instance d'acceptance : mon Chromium ne les produit qu'en partie. Textes néerlandais rédigés par Claude, à relire par un traducteur.
