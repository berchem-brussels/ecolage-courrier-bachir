# Manifeste, version 0.2.2 du 27/10/2026

Archive `courrier-v0_2_2.tar.gz`, un seul dossier `courrier/`. Point de départ : version 0.2.1, déployée sur le serveur d'acceptance le 20/10/2026 et recettée le 27/10/2026.

## Dépendances

Aucune dépendance nouvelle. Dans `backend/package-lock.json`, deux dépendances indirectes montent dans leur version admise : `body-parser` 1.20.8 vers 1.20.9 et `fast-uri` 3.1.8 vers 3.1.9 (avis de sécurité parus après le 20/10/2026). `backend/package.json` ne change que par le numéro de version, comme `frontend/package.json` et `frontend/package-lock.json`.

## Suites jouées le 27/10/2026 (Node 22.22.2, bac à sable)

| Suite | Commande | Résultat recopié de la sortie |
| --- | --- | --- |
| Serveur | `cd backend && npm test` | tests 82, pass 82, fail 0, skipped 0 |
| Écrans, axe-core FR et NL, traductions, étiquettes | `cd frontend && npm test` | Test Files 2 passed, Tests 58 passed |
| Typage | `cd frontend && npx tsc -b` | 0 erreur |
| Accessibilité statique | `cd frontend && npm run a11y` | 0 erreur |
| Construction | `cd frontend && npm run build` | built, 0 erreur |
| Audit serveur | `npm audit --omit=dev --audit-level=high` | found 0 vulnerabilities |
| Audit interface | `npm audit --omit=dev` | found 0 vulnerabilities |
| Audit complet de l'interface | `npm audit` | 4 vulnerabilities (3 moderate, 1 high), outils de développement seulement (E19) |
| Preuve d'échec du test du dépôt | `depot.test.js` avant l'assainissement des documents | 1 test en échec sur 5, puis 0 après |
| Premier envoi simulé | `git add -A` sur une copie de l'archive | 139 fichiers, tous `A` ; aucun `.env`, `node_modules`, `data/`, `.db`, `dist/`, fichier d'instance, standard ni cahier des charges |

## Fichiers nouveaux (4)

- `.github/workflows/ci.yml`, `.gitattributes`
- `backend/tests/depot.test.js`
- `NOTES_LIVRAISON_v0.2.2.md`

## Fichiers modifiés (19)

- `.gitignore`, `backup.sh`
- `CHANGELOG.md`, `DECISIONS.md`, `ECARTS-CDC.md`, `ETAT.md`, `MANIFESTE.md`, `README.md`
- `NOTES_LIVRAISON_v0.1.0.md`, `NOTES_LIVRAISON_v0.1.1.md`, `NOTES_LIVRAISON_v0.2.0.md`, `NOTES_LIVRAISON_v0.2.1.md` (valeurs d'exemple)
- `docs/APRES-DEPLOIEMENT.md`, `docs/SECURITE.md`
- `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`
- `backend/tests/portabilite.test.js`

## Fichiers retirés (4)

- `STANDARD.md`
- `docs/CAHIER-DES-CHARGES-COURRIER.md`
- `backend/instance/atelier.json`
- `docs/captures/05-services.png`

## Base de données

Aucune migration.
