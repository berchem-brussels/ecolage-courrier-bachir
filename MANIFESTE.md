# Manifeste, version 0.2.5 du 03/11/2026

Archive `courrier-v0_2_5.tar.gz`, un seul dossier `courrier/`. Point de départ : la version 0.2.4, publiée sur GitHub. La 0.2.5 reprend du gabarit 1.3.0 la connexion Microsoft compatible avec Portal (standard v3.3, section 8.6) ; première version du lot « connexion, tickets, aide par écran ».

## Dépendances

Aucune dépendance ajoutée ni montée de génération. Un seul changement de verrou : `qs` 6.16.0 vers 6.16.2 (indirect, `express`), par `npm update qs` seul, `package.json` inchangé (écart E31). Les deux numéros de version passent à 0.2.5.

## Suites jouées le 03/11/2026 (Node 22.22.2, bac à sable, npm 10.9.7)

| Suite | Commande | Résultat recopié de la sortie |
| --- | --- | --- |
| Serveur | `cd backend && npm test` | tests 96, pass 96, fail 0, skipped 0 |
| Écrans, axe-core FR et NL, traductions, étiquettes, imports, connexion | `cd frontend && npm test` | Test Files 4 passed, Tests 67 passed |
| Typage | `cd frontend && npx tsc -b` | 0 erreur |
| Accessibilité statique | `cd frontend && npm run a11y` | 0 erreur |
| Construction | `cd frontend && npm run build` | built, 0 erreur |
| Audit serveur | `npm audit --omit=dev --audit-level=high` | found 0 vulnerabilities (complet : 0) |
| Audit interface | `npm audit --omit=dev` | found 0 vulnerabilities ; complet : 12 modérées, chaîne `eslint`, outils de développement (E34) |
| Migration 006 sur une base 0.2.4 | Base créée par le code de la 0.2.4, rouverte par la 0.2.5 | Colonnes ajoutées, administrateur existant avec `is_admin_local` = 1, agent à 0 |
| Parcours réel | Interface construite, serveur réel, Chromium, faux Microsoft qui signe ses jetons | 11 contrôles sur 11 : retour à l'écran demandé, adresse sans `prompt` ni `max_age`, cookies, déconnexion sans reconnexion, accès de secours, `next` externe, compte désactivé |
| Preuves d'échec | Neuf contrôles retirés un à un, suites rejouées, fichiers restaurés (`cmp`) | Voir `docs/SECURITE.md` ; le contrôle de l'audience n'était couvert par aucun test : test ajouté |

## Fichiers nouveaux (12)

- `backend/src/oidc.js`, `backend/src/settings.js`, `backend/src/routes/sso.js`
- `backend/tests/sso.test.js`
- `frontend/src/hints.ts`, `frontend/src/components/AuthSettingsCard.tsx`, `frontend/src/test/connexion.test.tsx`
- `docs/fr/SSO.md`, `docs/nl/SSO.md`, `docs/en/SSO.md`, `docs/fonctionnel/connexion.md`
- `NOTES_LIVRAISON_v0.2.5.md`

## Fichiers modifiés (31)

- Serveur : `backend/src/app.js`, `auth.js`, `database.js` (migration 006), `i18n-server.js`, `routes/auth.js`, `routes/public.js`, `schemas.js`, `services/users.js` ; `backend/package.json`, `backend/package-lock.json` (`qs`)
- Interface : `frontend/src/App.tsx`, `contexts/AuthContext.tsx`, `contexts/I18nContext.tsx`, `i18n.ts`, `pages/LoginPage.tsx`, `pages/SettingsPage.tsx`, `pages/UsersPage.tsx` ; `frontend/package.json`, `frontend/package-lock.json` (numéro seulement)
- Dépôt : `.github/workflows/ci.yml` (`permissions: contents: read`)
- Documents : `CHANGELOG.md`, `DECISIONS.md`, `ECARTS-CDC.md`, `ETAT.md`, `MANIFESTE.md`, `README.md`, `docs/APRES-DEPLOIEMENT.md`, `docs/SECURITE.md`, `docs/fr|nl|en/ARCHITECTURE.md`

## Fichiers retirés

Aucun.

## Ce qui est simulé ou incomplet

Connexion testée contre un faux Microsoft ; la recette réelle en sept points (`docs/fr/SSO.md`) attend l'inscription d'application Entra ID et le lien dans Portal. Le bouton « Tester l'annuaire » ne prouve ni l'identifiant ni le secret (E32). Explication de champ limitée aux champs de la connexion (E33, 0.2.7).
