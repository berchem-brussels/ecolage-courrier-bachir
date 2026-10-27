# Manifeste, version 0.2.4 du 27/10/2026

Archive `courrier-v0_2_4.tar.gz`, un seul dossier `courrier/`. Points de départ : la version 0.2.2, publiée sur GitHub, et la version 0.2.3, installée sur le serveur d'acceptance le 27/10/2026 et non publiée. La 0.2.4 corrige le sélecteur de date de la 0.2.3.

## Dépendances

Aucune dépendance changée par rapport à la 0.2.3. Par rapport à la 0.2.2 publiée : `multer` 1.4.5-lts.2 vers 2.5.0, `vite` 5.4.21 vers 8.3.5, `@vitejs/plugin-react` 4.7.0 vers 6.1.2, `vitest` 4.1.10 vers 4.1.12, avec l'accord de Renaud du 27/10/2026 pour `multer` et `vite` ; `@vitejs/plugin-react` 6 n'a pas été nommé (E27). Le verrou de l'interface est écrit par npm 11 ; `npm ci` sous npm 10 le relit.

## Suites jouées le 27/10/2026 (Node 22.22.2, bac à sable, npm 10.9.7)

| Suite | Commande | Résultat recopié de la sortie |
| --- | --- | --- |
| Serveur | `cd backend && npm test` | tests 82, pass 82, fail 0, skipped 0 |
| Écrans, axe-core FR et NL, traductions, étiquettes, imports | `cd frontend && npm test` | Test Files 3 passed, Tests 60 passed |
| Typage | `cd frontend && npx tsc -b` | 0 erreur |
| Accessibilité statique | `cd frontend && npm run a11y` | 0 erreur |
| Construction | `cd frontend && npm run build` | built, 0 erreur |
| Installation sous npm 10 | `npm ci` dans les deux dossiers | 0 erreur |
| Audit serveur | `npm audit --omit=dev --audit-level=high` | found 0 vulnerabilities |
| Audit interface | `npm audit --omit=dev`, puis `npm audit` | found 0 vulnerabilities, dans les deux cas |
| Preuve d'échec du test des imports | Imports de la 0.2.3 remis dans `App.tsx`, test rejoué, fichier restauré | 2 tests en échec sur 2, puis 0 après restauration |
| Comparaison avec la 0.2.2 | Interface construite derrière le `nginx.conf` livré, serveur réel, Chromium, compte avec le rôle de secrétariat de l'entité AC ; textes, champs, valeur du sélecteur de date et calendrier de 11 pages, puis 22 captures, en français et en néerlandais | 0 différence de texte, 0 différence de capture. La 0.2.3 publiée avait 3 différences sur le formulaire d'enregistrement, dans chaque langue |
| Premier envoi simulé | Procédure de la section 5 de GITHUB.md sur une copie du dépôt de la 0.2.2 | 3 lignes `A`, 18 lignes `M`, aucune ligne `D` |

## Fichiers nouveaux (3 par rapport à la 0.2.2, 2 par rapport à la 0.2.3)

- `frontend/src/test/imports.test.ts`
- `NOTES_LIVRAISON_v0.2.4.md`
- `NOTES_LIVRAISON_v0.2.3.md` (nouveau pour le dépôt : la 0.2.3 n'y a pas été publiée)

## Fichiers modifiés (18 par rapport à la 0.2.2, 15 par rapport à la 0.2.3)

- `frontend/src/App.tsx` (imports `antd/es/locale/fr_FR` et `nl_NL`)
- `backend/tests/depot.test.js` (ne signale plus `tsconfig.tsbuildinfo`)
- `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`
- `CHANGELOG.md`, `DECISIONS.md`, `ECARTS-CDC.md`, `ETAT.md`, `MANIFESTE.md`, `README.md`
- `docs/APRES-DEPLOIEMENT.md`, `docs/SECURITE.md`
- Depuis la 0.2.2 seulement : `NOTES_LIVRAISON_v0.2.2.md` (commande `ls` avec `sudo`), `docs/fr/ARCHITECTURE.md`, `docs/nl/ARCHITECTURE.md`, `docs/en/ARCHITECTURE.md` (version de `multer`)

## Fichiers retirés

Aucun.

## Base de données

Aucune migration. Le serveur ne change que par son numéro de version.
