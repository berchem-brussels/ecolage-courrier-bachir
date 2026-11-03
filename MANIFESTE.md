# Manifeste, version 0.2.7 du 03/11/2026

Archive `courrier-v0_2_7.tar.gz`, un seul dossier `courrier/`. Point de départ : la version 0.2.6, publiée sur GitHub. La 0.2.7 reprend du gabarit 1.3.0 l'aide par écran (standard v3.3, section 13.1), adaptée aux rôles par entité ; troisième version du lot « connexion, tickets, aide par écran ». Sans migration.

## Dépendances

Aucune dépendance ajoutée, changée ni montée de génération ; les deux verrous ne changent que par le numéro de version. Les deux numéros de version passent à 0.2.7.

## Suites jouées le 03/11/2026 (Node 22.22.2, bac à sable, npm 10.9.7)

| Suite | Commande | Résultat recopié de la sortie |
| --- | --- | --- |
| Serveur | `cd backend && npm test` | tests 110, pass 110, fail 0, skipped 0 |
| Écrans, axe-core FR et NL, traductions, étiquettes, imports, connexion, tickets, aide | `cd frontend && npm test` | Test Files 7 passed, Tests 101 passed, 1 skipped (contrôle strict des captures, 0.2.8) |
| Typage | `cd frontend && npx tsc -b` | 0 erreur |
| Accessibilité statique | `cd frontend && npm run a11y` | 0 erreur |
| Construction | `cd frontend && npm run build` | built, 0 erreur |
| Audit serveur et interface | `npm audit --omit=dev` dans les deux dossiers | found 0 vulnerabilities |
| Parcours réel | Interface construite, serveur réel, Chromium : gestionnaire du registre | 7 contrôles sur 7 : panneau d'aide du registre, libellés réels sans clé brute, lien vers le mode d'emploi complet, parcours de 8 fiches, recherche, 12 explications de champ sur l'écran d'enregistrement |
| Preuves d'échec | Dix contrôles de l'aide contournés un à un, `help.test.ts` rejoué, fichiers restaurés | Voir `docs/SECURITE.md` : tous détectés |
| Remarques de Chrome (E23) | Protocole d'audit de Chromium sur 8 écrans | Aucune remarque, y compris sur la 0.2.6 qui en avait 20 sur votre poste : l'instrument ne reproduit pas les remarques, la vérification se fait dans Chrome (voir E23) |
| Premier envoi simulé | Procédure de la section 5 de GITHUB.md sur une copie du dépôt de la 0.2.6 | Voir le message de livraison |

## Fichiers nouveaux (23)

- `frontend/src/help/` : `types.ts`, `index.ts`, `RichText.tsx`, `TopicView.tsx`, `HelpButton.tsx` et 14 fiches dans `topics/` (`home`, `register`, `inbox`, `registration`, `contacts`, `consultations`, `users`, `entities`, `services`, `types`, `settings`, `tickets`, `help`, `accessibility`)
- `frontend/src/test/help.test.ts`, `frontend/src/test/aide.test.tsx`
- `docs/fonctionnel/aide.md`
- `NOTES_LIVRAISON_v0.2.7.md`

## Fichiers modifiés (33)

- Interface : `frontend/src/hints.ts` (79 explications), `i18n.ts`, `index.css`, `components/AppLayout.tsx` (bouton « Aide »), `Chatbot.tsx`, `ContactForm.tsx`, `MailDrawer.tsx`, `PasswordModal.tsx`, `PieceUpload.tsx`, `RegistrationForm.tsx`, `pages/ContactsPage.tsx`, `EntitiesPage.tsx`, `HelpPage.tsx` (centre d'aide), `InboxPage.tsx`, `ServicesPage.tsx`, `SettingsPage.tsx`, `TypesPage.tsx`, `UsersPage.tsx` ; `frontend/package.json`, `frontend/package-lock.json` (numéro)
- Serveur : `backend/package.json`, `backend/package-lock.json` (numéro seulement)
- Documents : `CHANGELOG.md`, `DECISIONS.md`, `ECARTS-CDC.md`, `ETAT.md`, `MANIFESTE.md`, `README.md`, `docs/APRES-DEPLOIEMENT.md`, `docs/SECURITE.md`, `docs/fr|nl|en/ARCHITECTURE.md`

## Fichiers retirés

Aucun (l'ancien contenu écrit en dur de la page d'aide est remplacé dans `HelpPage.tsx` ; ses textes de guide et de questions ont été repris dans les fiches).

## Ce qui est simulé ou incomplet

Aucun repère numéroté ni capture annotée, et pas de script Playwright : ils arrivent en 0.2.8 (E39). Pas de FAQ locale en base (0.2.8). E23 partiellement corrigée : les 10 remarques sur les titres de groupes de boutons restent, et le relevé de Chrome reste à faire. Les textes néerlandais sont rédigés par Claude et à relire par un traducteur.
