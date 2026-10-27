# Grille de sécurité, version 0.2.4 du 27/10/2026

Résultat de la grille de la section 10.2 du standard. « Automatisé » : test qui tourne à chaque `npm test`. « Non joué » : contrôle qui n'a pas pu tourner dans le bac à sable ; il se joue à la recette sur NIXUS. Décomptes relevés sous Node 22.22.2 dans le bac à sable de Claude ; les images utilisent Node 20.19.5.

## Contrôles

| Famille | Contrôle | Résultat | Preuve |
| --- | --- | --- | --- |
| Secrets | Aucun secret de repli ; démarrage refusé sans secret en production | Conforme | `securite.test.js`, statique |
| Secrets | Archive sans `.env` ni base | Conforme | `tar tzf` avant livraison ; `depot.test.js` |
| Secrets | Dépôt public : aucune adresse, aucun port ni dossier du serveur d'acceptance, aucune clé ou jeton écrit en clair, ni standard, ni cahier des charges, ni fichier d'instance | Conforme | `depot.test.js` ; en échec avant l'assainissement des documents |
| Secrets | Fichier de l'instance (services réels) exclu du dépôt | Conforme | `atelier.test.js` |
| Secrets | Erreur sans trace technique | Conforme | `securite.test.js` |
| Secrets | Aucun compte créé par le code ; premier administrateur par l'écran d'installation | Conforme | `api.test.js` |
| Authentification | Toute route hors liste écrite exige une session (55 routes énumérées, dont les 9 nouvelles des pièces, du journal et des paramètres) | Conforme | `securite.test.js` |
| Authentification | Cookie HttpOnly, SameSite=Strict, Secure ; empreinte seule en base | Conforme | `securite.test.js` |
| Authentification | Jeton inventé, expiré ou fermé refusé ; déconnexion et désactivation ferment la session | Conforme | `securite.test.js`, `api.test.js` |
| Authentification | 15 essais de connexion par quart d'heure | Conforme (hérité du gabarit) | Code `routes/auth.js` |
| Authentification | Contenu d'une pièce ouvert par le seul cookie (cadre, onglet, image), refusé sans session (standard 8.3) | Conforme | `pieces.test.js` |
| Autorisation | Cloisonnement AC et CPAS sur le courrier | Conforme | `courrier.test.js` |
| Autorisation | Cloisonnement AC et CPAS sur les pièces : liste, lecture, contenu, dépôt, ajout à un courrier, rattachement à l'enregistrement, API et MCP | Conforme | `pieces.test.js` ; le test échoue quand on retire `assertRegister` de la lecture d'une pièce (preuve jouée le 20/10/2026 : 4 tests en échec) |
| Autorisation | Agent, auditeur et administrateur sans rôle de registre : aucun dépôt, aucune lecture de pièce | Conforme | `pieces.test.js` |
| Autorisation | Journal des consultations réservé à l'auditeur de l'entité, sans objet ni nom de fichier | Conforme | `pieces.test.js` |
| Autorisation | Paramètres réservés à l'administrateur | Conforme | `pieces.test.js` |
| Autorisation | Champ inconnu refusé (mass assignment), nom de stockage non modifiable | Conforme | `api.test.js`, `pieces.test.js` |
| Autorisation | Mêmes droits par l'API et par le MCP ; parité des routes et des outils, nouvelles ressources comprises | Conforme | `mcp.test.js`, `pieces.test.js` |
| Injections | Aucune interpolation de valeur dans une requête SQL | Conforme | `securite.test.js`, statique |
| Injections | Ni `eval`, ni `Function`, ni `child_process` dans `src/` | Conforme | `securite.test.js`, statique |
| Injections | Chemin : nom de fichier généré par le serveur, chemin vérifié sous le dossier des fichiers, nom d'origine nettoyé | Conforme | `pieces.test.js` (`../../etc/passwd.pdf`) |
| Injections | XSS : aucun `dangerouslySetInnerHTML` ajouté ; nom de fichier affiché par React | Conforme | Revue du code |
| Validation | Schéma ajv sur chaque corps et chaque requête, `additionalProperties: false` | Conforme | 32 schémas |
| Validation | Dépôt : type vérifié sur les premiers octets (PDF, JPEG, PNG), type annoncé et extension ignorés, TIFF et exécutable renommé refusés, fichier vide refusé, un seul fichier par envoi | Conforme | `pieces.test.js` ; le test échoue quand on retire le contrôle du type réel (preuve jouée le 20/10/2026 : 2 tests en échec) |
| Validation | Dépôt : taille plafonnée par le paramètre de l'instance (413), fichier temporaire effacé dans tous les cas de refus | Conforme | `pieces.test.js` |
| Validation | Fichiers temporaires des envois interrompus effacés après une heure | Conforme | `pieces.test.js` |
| Validation | Aucun filtre de type à l'écran : tout fichier déposé part au serveur, qui contrôle le type réel et rend la raison du refus (0.2.1) | Conforme | `pages.test.tsx` par un vrai dépôt ; Chromium sur la pile complète : TIFF refusé avec sa raison |
| API | Limites de débit en lecture et en écriture, `trust proxy` à 1 | Conforme (hérité) | Code `app.js` |
| API | Corps JSON de plus de 256 ko refusé (413) | Conforme | `securite.test.js` |
| API | Numérotation sans doublon : vingt enregistrements simultanés | Conforme | `courrier.test.js` |
| API | Une même pièce rattachée deux fois en même temps : un seul enregistrement aboutit, aucun numéro consommé par l'autre | Conforme | `pieces.test.js` |
| API | CSRF : écriture par cookie sans jeton refusée, dépôt de fichier compris | Conforme | `securite.test.js`, `pieces.test.js` |
| En-têtes | Contenu d'une pièce : `default-src 'none'; frame-ancestors 'self'`, `X-Frame-Options SAMEORIGIN`, `nosniff`, `no-store` | Conforme | `pieces.test.js` ; le test échoue quand on retire `frame-ancestors 'self'` (preuve jouée le 20/10/2026 : 1 test en échec) |
| En-têtes | nginx : la route du contenu ne reçoit ni `X-Frame-Options DENY` ni `frame-ancestors 'none'` ; les autres routes les gardent | Conforme dans le bac à sable | `nginx.conf` livré, chargé par nginx 1.24 devant le vrai serveur ; aucun refus de cadre dans la console de Chromium. À rejouer sur NIXUS (nginx 1.27.5) |
| Dépendances | `npm audit --omit=dev` serveur | 0 vulnérabilité | Sortie du 27/10/2026, après `body-parser` 1.20.9, `fast-uri` 3.1.9 et `multer` 2.5.0. Limite : `npm audit` ne signalait rien sur `multer` 1.4.5-lts.2 alors que Dependabot (GitHub) y relevait 10 alertes hautes ; les alertes de GitHub se lisent à chaque version en plus de `npm audit` |
| Dépendances | `npm audit --omit=dev` interface | 0 vulnérabilité | Sortie du 27/10/2026 (0.2.4) |
| Dépendances | Les suites et l'audit des dépendances de production se rejouent à chaque demande de fusion | Conforme | `.github/workflows/ci.yml`, contrôlé par `depot.test.js` ; premier passage sur GitHub à observer |
| Dépendances | Audit complet de l'interface, outils de développement compris | 0 vulnérabilité (4 en 0.2.2, 10 en 0.2.1) après `vite` 8.3.5, `@vitejs/plugin-react` 6.1.2 et `vitest` 4.1.12 | Sortie du 27/10/2026 ; la section suivante garde l'historique |
| Dépendances | `multer` 2.5.0 (génération 1.x dépréciée par l'éditeur, 10 alertes hautes relevées par Dependabot sur 1.4.5-lts.2) | Conforme ; accord de Renaud du 27/10/2026 | 82 tests serveur sur 82 avec la 2.5.0, écart E20 clos |
| Dépendances | Aucune URL externe dans l'interface construite | Conforme | Recherche dans `dist/` |
| Données | Pièces hors racine web, servies par une route qui contrôle le droit | Conforme | `pieces.test.js` |
| Données | Journal des consultations : fiche et pièce, par l'API et par le MCP | Conforme | `pieces.test.js` |
| Données | Données fictives refusées en production | Conforme | `atelier.test.js` |
| Infrastructure | Conteneur non root en `appuser` (10001) | Conforme | `id -u` = `10001` relevé sur NIXUS le 20/10/2026 (0.2.0) |
| Infrastructure | Sauvegarde quotidienne du dossier de données, fichiers déposés compris | Conforme | `data/pieces/2026/10/b801c9216d262cec1c316f9a098d930b.pdf` relevé dans la sauvegarde de NIXUS le 20/10/2026 |
| Interface | Contrôle visuel en 360, 768 et 1280 px, FR et NL, clair et sombre, sur l'interface construite derrière le `nginx.conf` livré | Conforme | Bac à sable ; rendu des pages PDF dans l'aperçu vérifié sur NIXUS dans Chrome le 20/10/2026 |
| Interface | Toute étiquette `<label for>` vise un champ de saisie (accessibilité, remplissage automatique) | Conforme | `pages.test.tsx` sur tous les écrans, la fiche et deux fenêtres ; le test échoue quand on neutralise la correction (preuve jouée le 20/10/2026 : 4 tests en échec, 12 étiquettes) |

Les trois contrôles qui ne restent jamais « non joués » (secrets commités, contrôle d'accès côté serveur, IDOR) sont conformes.

## Audit complet de l'interface

Mesure du 27/10/2026 avec la 0.2.3 : 0 vulnérabilité. Avec la 0.2.2 : 4 (3 modérées, 1 haute : `vite`, `esbuild`, `vitest`, `@vitest/mocker`), outils de développement seulement. Le tableau ci-dessous est celui du 20/10/2026.

`npm audit` sans `--omit=dev`, le 20/10/2026 : 10 vulnérabilités, toutes dans les outils de construction et de test, aucune dans l'image servie par nginx.

| Paquet | Gravité | Correction | Suite |
| --- | --- | --- | --- |
| `@typescript-eslint/parser`, `typescript-estree`, `braces`, `fast-glob`, `globby`, `micromatch` | Hautes | Version 8 du parseur, changement de génération | Accord de Renaud nécessaire ; écart E19 |
| `vite`, `esbuild` | Haute, modérée | Vite 8, interdit par le standard | Écart E19 |
| `vitest`, `@vitest/mocker` | Modérées | Vitest 4.1.11 dans la même génération | `npm install` s'arrête sur une erreur interne de npm 10 (`Cannot read properties of null (reading 'edgesOut')`), liée à la dépendance paire facultative `canvas` de `jsdom`. Verrou restauré ; écart E19 |

Mises à jour faites dans la même génération, paquet par paquet par `npm update` : `@babel/core` 7.29.0 vers 7.29.7, `nanoid` 3.3.16 vers 3.3.20, `postcss` 8.5.22 vers 8.5.31, `undici` 7.28.0 vers 7.30.1. `package.json` inchangé ; verrou contrôlé par `npm ci`.

## Preuves d'échec des tests de sécurité nouveaux

Chaque contrôle a été retiré du code sur une copie, la suite `pieces.test.js` rejouée, puis le fichier restauré et comparé à l'original.

| Contrôle retiré | Tests en échec |
| --- | --- |
| Contrôle du type réel dans `services/pieces.js` | 2 : type réel ; dépôt par MCP |
| `assertRegister` de la lecture d'une pièce | 4 : cloisonnement ; rejet ; journal des consultations ; MCP |
| En-tête `frame-ancestors 'self'` de la route du contenu | 1 : en-têtes du contenu |
| Aucun (fichiers restaurés) | 0 |
