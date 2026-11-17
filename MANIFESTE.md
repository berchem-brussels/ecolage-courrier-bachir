# Manifeste, version 0.3.1 du 17/11/2026

Archive `courrier-v0_3_1.tar.gz`, un seul dossier `courrier/`. La 0.3.1 corrige un cas de réattribution trouvé à la recette de la 0.3.0 (installée sur NIXUS, non publiée) et en reprend tout le contenu. **Dernière version publiée sur GitHub : 0.2.9** : la demande de fusion de la 0.3.1 porte donc les changements des deux versions ; le manifeste de la 0.3.0 (19 fichiers nouveaux, 76 modifiés par rapport à la 0.2.9, aucun retiré) s'ajoute à celui-ci (voir l'historique du dépôt et `NOTES_LIVRAISON_v0.3.0.md`).

## Dépendances

Aucune dépendance ajoutée ni changée depuis la 0.3.0 ni depuis la 0.2.9. Les numéros de version passent à 0.3.1 dans les deux `package.json` et leurs verrous (seule ligne modifiée ; `npm ci` relit les verrous).

## Suites jouées le 17/11/2026 (Node 22.23.4, bac à sable, npm 10.9.9)

| Suite | Commande | Résultat recopié de la sortie |
| --- | --- | --- |
| Serveur | `cd backend && npm test` | tests 149, pass 149, fail 0, skipped 0 |
| Écrans, axe-core FR et NL, traductions, étiquettes, champs nommés, connexion, tickets, aide, FAQ, attribution, bannettes, cloche | `cd frontend && npm test` | Test Files 8 passed, Tests 144 passed, 1 skipped (contrôle strict joué par `help:check`) |
| Contrôle strict des captures | `cd frontend && npm run help:check` | Tests 22 passed |
| Typage, accessibilité statique, construction | `npx tsc -b`, `npm run a11y`, `npm run build` | 0 erreur, 0 erreur, built |
| Audit serveur et interface | `npm audit --omit=dev` dans les deux dossiers | found 0 vulnerabilities |
| Audit des fiches | `npm run help:audit` sur l'instance de démonstration | 1 test réussi |
| Script de recette | `recette.mjs` sur l'instance de démonstration (navigateur sans affichage) | 38 contrôles OK, « Tous les contrôles sont conformes » |
| Recette de la FAQ | `recette-faq.mjs` | 5 contrôles OK |
| Recette de l'attribution | `recette-agent.mjs` | 45 contrôles OK, comptes de test désactivés et courrier fictif annulé à la fin |
| Preuves d'échec | Contrôles contournés un à un sur des copies | Serveur : 18 sur 18 détectés ; interface : 8 sur 8 détectés (`docs/SECURITE.md`) |

Les captures de l'aide ne changent pas depuis la 0.3.0 : 20 par langue.

## Fichiers nouveaux depuis la 0.3.0 (2)

`frontend/help-capture/recette-agent.mjs`, `NOTES_LIVRAISON_v0.3.1.md`

## Fichiers modifiés depuis la 0.3.0 (20)

- Serveur (4) : `backend/src/services/attribution.js` (le nouveau service traitant quitte les copies), `backend/tests/attribution.test.js` (31 tests), `backend/package.json`, `package-lock.json`
- Outils (2) : `frontend/help-capture/recette.mjs`, `recette-faq.mjs` (version attendue 0.3.1)
- Interface (2) : `frontend/package.json`, `package-lock.json` (numéro seulement)
- Documents (12) : `CHANGELOG.md`, `DECISIONS.md`, `ECARTS-CDC.md`, `ETAT.md`, `MANIFESTE.md`, `README.md`, `docs/APRES-DEPLOIEMENT.md`, `docs/SECURITE.md`, `docs/fonctionnel/attribution.md`, `docs/fr|nl|en/ARCHITECTURE.md`

## Fichiers retirés

Aucun.

## Ce qui est simulé ou incomplet

- L'installation de la 0.3.1 et `recette-agent.mjs` ne sont pas joués sur NIXUS : le script d'agent n'a tourné que sur l'instance de démonstration, avec le navigateur du bac à sable.
- Le script d'agent a fourni les 45 contrôles sur la démonstration ; sur NIXUS, le nombre peut différer légèrement (nombre de services, contacts et types disponibles) : seul compte l'absence de `ÉCHEC`.
- Les captures annotées ne montrent que les écrans du secrétariat ; les écrans de l'agent sont contrôlés par les tests d'écran et par `recette-agent.mjs`.
- Les textes néerlandais sont rédigés par Claude, à faire relire.
- Les documents de suivi de cette archive portent des valeurs d'exemple ; ceux du projet portent les valeurs d'acceptance.
