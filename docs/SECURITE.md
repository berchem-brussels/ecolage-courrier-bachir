# Grille de sécurité, version 0.3.1 du 17/11/2026

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
| Authentification | Toute route hors liste écrite exige une session (84 routes, dont les 6 de la connexion Microsoft de la 0.2.5, les 11 des tickets de la 0.2.6, les 5 de la FAQ de la 0.2.8 et les 7 de l'attribution, des membres d'un service et des notifications de la 0.3.0 ; liste écrite des routes libres : santé, version, paramètres publics, installation, connexion locale, configuration de connexion, départ et retour Microsoft) | Conforme | `securite.test.js` |
| Authentification | Cookie HttpOnly, SameSite=Strict, Secure ; empreinte seule en base | Conforme | `securite.test.js` |
| Authentification | Jeton inventé, expiré ou fermé refusé ; déconnexion et désactivation ferment la session | Conforme | `securite.test.js`, `api.test.js` |
| Authentification | Connexion Microsoft : code d'autorisation avec PKCE S256, `state` et `nonce` aléatoires, aucun `prompt` ni `max_age` | Conforme | `sso.test.js` ; adresse relevée dans Chromium contre un faux Microsoft |
| Authentification | Jeton d'identité : signature fausse, autre locataire, autre application (audience), expiré ou `nonce` différent refusés, aucune session ouverte | Conforme | `sso.test.js` ; contrôles retirés un à un, voir la section des preuves |
| Authentification | Cookie d'état `SameSite=Lax`, `Path=/api/auth`, effacé au retour ; cookie de session `SameSite=Strict` ; les deux cookies ne s'écrasent pas | Conforme | `sso.test.js` ; Chromium |
| Authentification | `next` : adresse complète, `//`, `\` ou caractères douteux ramenés à `/`, côté serveur et côté interface | Conforme | `sso.test.js`, `connexion.test.tsx` ; défaut du gabarit corrigé (E30) |
| Authentification | État de connexion volé ou inconnu refusé ; compte inconnu, désactivé ou hors domaines refusé ; session coupée à la désactivation | Conforme | `sso.test.js` |
| Authentification | Mot de passe refusé en mode `sso` hors accès de secours ; mode `sso` et changements de comptes refusés s'ils ne laissent aucun administrateur joignable | Conforme | `sso.test.js` |
| Authentification | Secret client chiffré, jamais renvoyé, ni dans les paramètres publics, ni dans le journal, ni dans le test | Conforme | `sso.test.js` |
| Authentification | Aucune redirection automatique après la déconnexion, une erreur ou pour l'accès de secours | Conforme | `connexion.test.tsx` ; Chromium |
| Authentification | 15 essais de connexion par quart d'heure | Conforme (hérité du gabarit) | Code `routes/auth.js` |
| Authentification | Contenu d'une pièce ouvert par le seul cookie (cadre, onglet, image), refusé sans session (standard 8.3) | Conforme | `pieces.test.js` |
| Autorisation | Cloisonnement AC et CPAS sur le courrier | Conforme | `courrier.test.js` |
| Autorisation | Cloisonnement AC et CPAS sur les pièces : liste, lecture, contenu, dépôt, ajout à un courrier, rattachement à l'enregistrement, API et MCP | Conforme | `pieces.test.js` ; le test échoue quand on retire `assertRegister` de la lecture d'une pièce (preuve jouée le 20/10/2026 : 4 tests en échec) |
| Autorisation | Agent, auditeur et administrateur sans rôle de registre : aucun dépôt, aucune lecture de pièce | Conforme | `pieces.test.js` |
| Autorisation | Journal des consultations réservé à l'auditeur de l'entité, sans objet ni nom de fichier | Conforme | `pieces.test.js` |
| Autorisation | Paramètres réservés à l'administrateur | Conforme | `pieces.test.js` |
| Autorisation | Champ inconnu refusé (mass assignment), nom de stockage non modifiable | Conforme | `api.test.js`, `pieces.test.js` |
| Autorisation | Mêmes droits par l'API et par le MCP ; parité des routes et des outils, nouvelles ressources comprises | Conforme | `mcp.test.js`, `pieces.test.js` |
| Autorisation | Tickets : un demandeur ne lit ni ne voit le ticket d'un autre, ni sa capture ; notes internes invisibles du demandeur | Conforme | `tickets.test.js` |
| Autorisation | File métier limitée à l'entité du ticket : le gestionnaire d'une entité ne voit pas les tickets de l'autre ; l'administrateur (file IT) ne lit pas les questions métier ; le gestionnaire ne voit pas la file IT | Conforme | `tickets.test.js` |
| Autorisation | Entité d'un ticket limitée aux entités du demandeur ; choix obligatoire avec deux entités ; transfert vers la file métier refusé sans entité | Conforme | `tickets.test.js` |
| Autorisation | Réglages des tickets réservés à l'administrateur, par l'API et par le MCP ; au moins un rôle par file ; changement journalisé avec l'ancienne et la nouvelle valeur ; absents des paramètres publics | Conforme | `tickets.test.js` |
| Autorisation | Tickets à traiter (MCP) limités aux files de la personne | Conforme | `tickets.test.js` |
| Autorisation | Attribution : seuls le secrétariat et le gestionnaire de l'entité du courrier attribuent ; agent, responsable, auditeur, administrateur et secrétariat de l'autre entité refusés, rien n'est écrit | Conforme | `attribution.test.js` |
| Autorisation | Visibilité par service : un courrier non attribué n'est lu que du registre de l'entité ; attribué, il est lu des membres de son service, des services en copie et de l'agent nommé, de personne d'autre ; l'administrateur et l'auditeur ne le lisent jamais | Conforme | `attribution.test.js` |
| Autorisation | Un agent ou un responsable lit sans rien modifier : correction, annulation, création, ajout de fichier, renommage d'une pièce refusés (403), rien ne change en base | Conforme | `attribution.test.js` |
| Autorisation | Pièces d'un courrier : lisibles (liste, description, contenu) de qui lit le courrier ; la file « À enregistrer » reste au registre ; lectures de l'agent au journal des consultations | Conforme | `attribution.test.js` |
| Autorisation | Un rôle qui n'est plus celui d'un agent retire l'accès, même nommé ou avec un rattachement resté en base | Conforme | `attribution.test.js` |
| Autorisation | Cloisonnement AC et CPAS avec un service commun : le rôle et le rattachement valent pour une entité ; attribution, nomination, renvoi, liste des membres et compteurs de l'autre entité refusés | Conforme | `attribution.test.js` |
| Autorisation | Nomination d'un agent : compte actif, rôle d'agent ou de responsable dans l'entité, rattaché au service traitant ; responsable d'un autre service, agent simple et auditeur refusés | Conforme | `attribution.test.js` |
| Autorisation | Renvoi au secrétariat : membre du service traitant seulement, motif obligatoire, pas de renvoi d'une copie ni d'un courrier annulé ; le courrier devient illisible pour qui le renvoie | Conforme | `attribution.test.js` |
| Validation | Un service n'est jamais traitant et en copie à la fois : réattribuer au service qui était en copie le retire des copies ; une liste de copies qui contient le service traitant est refusée (409) | Conforme (0.3.1) | `attribution.test.js` ; défaut trouvé par `recette-agent.mjs` |
| Autorisation | Bannettes et compteurs : mêmes droits que la fiche, courriers annulés exclus, compteur égal à la liste, entité non permise refusée (403) | Conforme | `attribution.test.js` |
| Autorisation | Notifications : lues et marquées par leur destinataire seulement ; numéro et nature sans objet ni expéditeur ; écartées si le courrier n'est plus lisible | Conforme | `attribution.test.js` |
| Autorisation | Membres d'un service : lus par l'administrateur, le registre d'une entité du service et ses membres ; ni courriel ni donnée de compte | Conforme | `attribution.test.js` |
| Validation | Rattachement aux services : services de l'entité seulement, rôle d'agent ou de responsable seulement, rien d'écrit en cas de refus ; une mise à jour sans `service_ids` garde les services | Conforme | `attribution.test.js` |
| Données | Attribution, nomination et renvoi au journal d'audit sans objet ni expéditeur ; historique de la fiche avec motif et auteur | Conforme | `attribution.test.js` |
| Données | Migration 009 appliquée à une base de la 0.2.9 contenant un courrier : valeurs conservées, contraintes de nature actives | Conforme | `attribution.test.js` |
| Autorisation | Même droits par l'API et par le MCP pour l'attribution, la nomination, le renvoi, les compteurs, les membres et les notifications | Conforme | `attribution.test.js`, `mcp.test.js` (parité) |
| Interface | L'écran ne propose que les actions permises par le serveur (champ `rights`) : lecture seule, formulaire d'attribution, nomination, renvoi, annulation | Conforme | `attribution.test.tsx` |
| Injections | Interpolations SQL des tickets limitées à des constantes du code (colonnes, clause des files, regroupements) | Conforme | `securite.test.js`, statique |
| Validation | Capture d'un ticket : PNG ou JPEG contrôlé sur ses premiers octets, 2 Mo au plus (413 au-delà), refusée sur les écrans qui affichent du courrier (E35, E36) | Conforme | `tickets.test.js` |
| API | Corps de 4 Mo accepté sur `/api/tickets` seulement ; nginx : bloc de 4 Mo pour `POST /api/tickets`, 1 Mo ailleurs | Conforme | `tickets.test.js` (contenu de `nginx.conf`, capture de 2 Mo) |
| Données | Contexte d'un ticket : écran, version, langue, navigateur, date, dernière erreur ; chemin sans paramètre ni numéro de courrier | Conforme | `tickets.test.js`, `tickets.test.tsx` |
| Données | Conservation des tickets et de leurs captures : aucune durée appliquée (E37) | Écart connu | Étape 20 |
| Autorisation | FAQ locale : lecture par toute personne connectée ; ajout, correction et retrait réservés à l'administrateur et aux gestionnaires du registre, par l'API et par le MCP ; secrétariat et agent refusés | Conforme | `faq.test.js` |
| Autorisation | FAQ locale : une question retirée reste invisible de qui ne gère pas la FAQ, visible de qui la gère, jamais supprimée | Conforme | `faq.test.js` |
| Validation | FAQ locale : textes FR et NL obligatoires et bornés, identifiant d'écran limité à des lettres et des tirets (refus d'une injection), aucun champ en trop (auteur imposé par le serveur) | Conforme | `faq.test.js` |
| Données | FAQ locale : auteur enregistré, journal d'audit sans le texte des questions ni des réponses ; FAQ commune aux deux entités, avertissement dans la fenêtre d'ajout (E41) | Conforme, écart connu | `faq.test.js`, `aide.test.tsx` |
| Données | Captures de l'aide : produites sur l'instance de démonstration fictive, jamais sur des données réelles ; aucun nom de service réel dans le dépôt public | Conforme | `help-capture/demo-server.cjs`, `help.test.ts` |
| Injections | Texte des fiches d'aide et explications de champs : rendus par React, aucun `dangerouslySetInnerHTML` ni `innerHTML`, aucune balise HTML dans les textes | Conforme | `help.test.ts` |
| Injections | Aucune interpolation de valeur dans une requête SQL | Conforme | `securite.test.js`, statique |
| Injections | Ni `eval`, ni `Function`, ni `child_process` dans `src/` | Conforme | `securite.test.js`, statique |
| Injections | Chemin : nom de fichier généré par le serveur, chemin vérifié sous le dossier des fichiers, nom d'origine nettoyé | Conforme | `pieces.test.js` (`../../etc/passwd.pdf`) |
| Injections | XSS : aucun `dangerouslySetInnerHTML` ajouté ; nom de fichier affiché par React | Conforme | Revue du code |
| Validation | Schéma ajv sur chaque corps et chaque requête, `additionalProperties: false` | Conforme | 50 schémas |
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
| Dépendances | `npm audit --omit=dev` serveur | 0 vulnérabilité | Sortie du 03/11/2026 après `npm update qs` (6.16.0 vers 6.16.2, alerte parue après le 27/10/2026, E31) ; sortie du 27/10/2026 : après `body-parser` 1.20.9, `fast-uri` 3.1.9 et `multer` 2.5.0. Limite : `npm audit` ne signalait rien sur `multer` 1.4.5-lts.2 alors que Dependabot (GitHub) y relevait 10 alertes hautes ; les alertes de GitHub se lisent à chaque version en plus de `npm audit` |
| Dépendances | `npm audit --omit=dev` interface | 0 vulnérabilité | Sortie du 17/11/2026 (0.3.0) |
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

Mesure du 17/11/2026 avec la 0.3.0 : 3 vulnérabilités modérées, outils de développement seulement, aucune dans l'image servie par nginx : `@typescript-eslint/parser` (dépendance directe), `@typescript-eslint/typescript-estree` et `minimatch` (déni de service par amplification de motifs). Même chaîne `eslint` que l'écart E34 ; correction par `npm audit fix --force` (changement de génération), soumise à Renaud. L'audit des dépendances de production reste à 0.

Mesure du 03/11/2026 avec la 0.2.5 : 12 vulnérabilités modérées, toutes dans la chaîne `eslint` (`minimatch`, `glob`, `rimraf`, `flat-cache` et leurs dépendants : `eslint`, `eslint-plugin-jsx-a11y`, `@typescript-eslint/parser`), outils de développement, aucune dans l'image servie par nginx ; avis parus après le 27/10/2026. La correction demande une montée majeure d'`eslint` : accord de Renaud avant toute montée (écart E34). La CI ne bloque qu'au niveau « haute ».

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

## Preuves d'échec des tests de connexion (0.2.5)

Chaque contrôle a été retiré du code sur une copie, la suite concernée rejouée, puis le fichier restauré (`cmp` identique).

| Contrôle retiré | Résultat |
| --- | --- |
| Vérification de la signature du jeton d'identité | `sso.test.js` : 1 test en échec (jetons refusés) |
| Contrôle de `next` (`safeNext`) | 1 échec |
| Refus du mot de passe en mode `sso` | 1 échec |
| Garde « aucun administrateur joignable » des comptes | 2 échecs |
| Contrôle de l'audience du jeton | 0 échec avec les tests du gabarit : test ajouté (jeton d'une autre application), puis 1 échec |
| `prompt=login` ajouté à l'adresse d'autorisation | 1 échec |
| Interface : contrôle de `next` du gabarit (`startsWith('/')`) | `connexion.test.tsx` : 1 échec |
| Interface : redirection automatique après la déconnexion | 2 échecs |

## Preuves d'échec des tests de tickets (0.2.6)

Chaque contrôle a été retiré du code sur une copie, la suite concernée rejouée, puis le fichier restauré (suites complètes rejouées : serveur 110 sur 110, écrans 78 sur 78).

| Contrôle retiré | Résultat |
| --- | --- |
| Rôle de file limité à l'entité du ticket (`holdsQueue`) | `tickets.test.js` : 3 tests en échec |
| Condition SQL des files sans l'entité (liste, pilotage, MCP) | 2 échecs |
| Refus de la capture sur les écrans de courrier | 1 échec |
| Droit de lecture de la capture | 1 échec |
| Masquage des notes internes au demandeur | 1 échec |
| Refus du transfert sans entité vers la file métier | 1 échec |
| Entité du ticket limitée aux entités du demandeur | 1 échec |
| Réglages réservés à l'administrateur (couche de service, appel MCP) | 1 échec |
| Motif obligatoire aux changements de statut | 2 échecs |
| Interface : capture proposée sur un écran de courrier | `tickets.test.tsx` : 1 échec |
| Interface : choix de l'entité retiré | 2 échecs |

## Preuves d'échec des contrôles de l'aide (0.2.7)

Chaque contrôle a été contourné sur une copie, `help.test.ts` rejoué, puis le fichier restauré (suites complètes rejouées : serveur 110 sur 110, écrans 101 réussis et un test de captures ignoré hors contrôle strict).

| Contournement | Résultat |
| --- | --- |
| Clé de libellé inconnue dans une fiche | 1 test en échec |
| Infobulle retirée d'un champ | 2 échecs |
| Explication de moins de 12 caractères | 2 échecs |
| Route du menu sans fiche | 1 échec |
| Champ de saisie sans autocomplétion | 1 échec |
| Fiche retirée de la liste | 4 échecs |
| Parcours qui renvoie à la fiche d'un autre rôle | 1 échec |
| Abréviation dans une fiche | 1 échec |
| Explication qui commence par « Le champ » | 1 échec |
| Texte néerlandais identique au français | 1 échec |

## Preuves d'échec des contrôles de la 0.2.8

Chaque contrôle a été contourné sur une copie, la suite concernée rejouée, puis le fichier restauré (suites complètes rejouées : serveur 118 sur 118, écrans 114 réussis et un test strict ignoré).

| Contournement | Résultat |
| --- | --- |
| Titre de groupe de boutons redevenu un `<label>` orphelin | `pages.test.tsx` : 5 tests en échec, avec le titre « Arrivé par » cité |
| Repère du texte sans repère sur la capture | `help.test.ts` : 1 échec |
| Capture absente en français | 1 échec |
| Capture jamais utilisée | 2 échecs |
| Titres de procédure sans libellés réels | 1 échec |
| Marge des listes retirée | 1 échec |
| Parcours élargi à chaque changement | `aide.test.tsx` : 2 échecs |
| Appel d'un groupe de boutons sans infobulle | `help.test.ts` : 1 échec |
| nginx avec le dossier en repli | `tickets.test.js` : 1 échec |
| FAQ ouverte à tout lecteur | `faq.test.js` : 5 échecs |
| Gestionnaire du registre refusé | 6 échecs |
| Questions retirées visibles de tous | 1 échec |
| Texte de la question dans le journal | 1 échec |
| Identifiant d'écran sans contrôle | 1 échec |

## Preuves d'échec des contrôles de la 0.2.9

Chaque contrôle a été contourné sur une copie, la suite concernée rejouée, puis le fichier restauré (suites complètes rejouées : serveur 118 sur 118, écrans 117 réussis et un test strict ignoré).

| Contournement | Résultat |
| --- | --- |
| Titre des entités de « Nouveau service » redevenu un `Form.Item` | `pages.test.tsx` : 1 échec, avec « entity_ids -> DIV » (l'erreur de Chrome) |
| Zone de recherche du registre sans nom | `help.test.ts` : 1 échec |
| Champ de motif d'annulation d'un courrier sans nom | 1 échec |
| Capture de « Créer un compte » sur une autre procédure | 1 échec |
| Libellé d'un bouton inexistant cité par une fiche (erreur d'origine de « Entités et registres ») | L'audit `help:audit` l'a signalé avant la correction et réussit après |

## Preuves d'échec des contrôles de la 0.3.0

Chaque contrôle a été contourné sur une copie, la suite concernée rejouée, l'original jamais touché. Trois contournements n'étaient d'abord pas détectés : des tests ont été ajoutés, puis ils le sont (un test sur le rôle d'agent exigé, un sur l'exclusion des courriers annulés des bannettes « Moi », « En copie » et « À attribuer », un sur l'annulation proposée sans droit d'annulation).

Serveur (`attribution.test.js`) : 18 contournements sur 18 détectés (le dix-huitième, ajouté en 0.3.1, est le retrait de la correction de la réattribution au service en copie).

| Contournement | Tests en échec |
| --- | --- |
| Service non contrôlé à la lecture d'un courrier | 5 |
| Lecture des copies ouverte à tous les agents de l'entité | 8 |
| Rôle d'agent non exigé à la lecture | 1 (après ajout du test) |
| Rôle de registre non exigé pour attribuer | 4 |
| Motif non exigé au changement de service | 1 |
| Agent nommé sans contrôle de rattachement | 3 |
| Service d'une autre entité accepté | 15 |
| Renvoi permis à tout lecteur | 5 |
| Changement d'agent permis à un agent simple | 2 |
| Pièce d'un courrier lisible de tout agent de l'entité | 3 |
| Pièce de la file lisible d'un agent | 1 |
| Modification ouverte à qui peut lire | 1 |
| Courrier annulé encore attribuable | 1 |
| Notification d'un courrier invisible encore montrée | 1 |
| Bannette « Mon service » sans filtre d'entité | 1 |
| Services conservés à tort quand le rôle change | 2 |
| Courriers annulés dans les bannettes | 1 (après ajout du test) |
| Réattribution au service en copie sans retrait des copies (0.3.1) | 1 |

Interface (`attribution.test.tsx`) : 8 contournements sur 8 détectés.

| Contournement | Tests en échec |
| --- | --- |
| Fiche modifiable pour tout lecteur | 1 |
| Annulation proposée sans droit d'annulation | 1 (après ajout du test) |
| Motif non exigé au changement de service | 1 |
| Renvoi possible sans motif | 1 |
| Formulaire d'attribution montré à l'agent | 3 |
| Services envoyés pour tous les rôles | 2 |
| Onglet « À attribuer » montré aux agents | 2 |
| Objet du courrier dans une notification | 1 |

## Preuves d'échec des contrôles de la 0.4.0

Chaque contrôle a été contourné sur une copie, la suite concernée rejouée, l'original jamais touché. Un contournement d'interface (motif de réouverture) n'était d'abord pas détecté : un test sur un motif fait d'espaces a été ajouté, puis il l'est. Le contrôle SQL statique du serveur tolère désormais la constante `STATUS_SQL` (écart E53) ; aucune autre interpolation n'est permise.

Serveur (`traitement.test.js`) : 24 contournements sur 24 détectés.

| Contournement | Tests en échec |
| --- | --- |
| Prise en charge ouverte à tout membre du service | 3 |
| Prise en charge d'un courrier non attribué ou déjà pris | 1 |
| Clôture sans contrôle du droit | 1 |
| Clôture depuis un autre état que « en traitement » | 1 |
| Motif de clôture d'une autre entité accepté | 2 |
| Motif de clôture désactivé accepté | 1 |
| Réouverture sans rôle de registre | 2 |
| Réouverture sans motif | 1 |
| Réouverture d'un courrier qui n'est pas clos | 1 |
| Attribution d'un courrier clos | 1 |
| Changement d'agent d'un courrier clos | 1 |
| Renvoi d'un courrier clos | 1 |
| Changement d'agent sans retour à « attribué » | 1 |
| Renvoi sans retour à « enregistré » | 1 |
| Commentaire de service lisible de toute personne qui voit le courrier | 1 |
| Commentaire permis à un service en copie | 1 |
| Texte du commentaire écrit au journal d'audit | 1 |
| Consultations montrées à tout lecteur de l'historique | 1 |
| Filtre de statut sans l'avancement du traitement | 3 |
| Courriers clos encore dans « Mon service » | 1 |
| Motifs de clôture gérés sans droit de gestionnaire | 1 |
| Entité nouvelle sans motifs par défaut | 1 |
| Lecture du courrier d'une autre entité pour le traitement | 3 |
| Commentaire permis sur un courrier annulé | 1 |

Interface (`traitement.test.tsx`) : 15 contournements sur 15 détectés.

| Contournement | Tests en échec |
| --- | --- |
| Prise en charge proposée sans droit | 1 |
| Clôture proposée sans droit | 3 |
| Réouverture proposée sans droit | 1 |
| Formulaire de commentaire sans droit | 1 |
| Portée du commentaire non obligatoire | 1 |
| Motif de clôture non obligatoire | 1 |
| Motif de réouverture non obligatoire | 1 (après ajout du test du motif fait d'espaces) |
| Texte du commentaire envoyé sans nettoyage | 1 |
| Historique montré dans l'ordre inverse | 1 |
| Bouton de modification d'un commentaire | 1 |
| Onglet « Clos » montré au secrétariat | 1 |
| Désactivation d'un motif sans motif exigé | 1 |
| Texte de la cloche absent pour « clos » | 1 |
| Texte néerlandais de la prise en charge manquant | 1 |
| Note de clôture non envoyée | 1 |

## Version 0.5.0 : confidentialité

Serveur (`confidentialite.test.js`, `api.test.js`) : 19 contournements sur 19 détectés, jouée sur le code réel, un contrôle à la fois, le fichier modifié étant restauré après chaque essai.

| Contournement | Tests en échec |
| --- | --- |
| Courrier restreint ou confidentiel lu sans désignation (`canSeeMail`) | 9 |
| Bannettes et compteurs sans la condition de visibilité | 1 (deux contournements : condition retirée, niveau ignoré) |
| Droits de traitement donnés sans désignation | 1 (après ajout du test d'un état forcé en base) |
| Droit de remise annoncé sur tout courrier | 1 (après ajout de l'assertion sur un courrier normal) |
| Personne désignée : n'importe quel compte accepté | 2 |
| Courrier enregistré devenu confidentiel | 1 |
| Remise du pli répétable | 1 |
| Remise enregistrée sur un courrier non confidentiel | 1 |
| Changement de niveau sans effet accepté | 1 |
| Pli confidentiel : objet écrit gardé | 2 |
| Pli confidentiel : dépôt d'un fichier | 1 |
| Pli confidentiel : rattachement d'un fichier de la file, les deux contrôles neutralisés ensemble | 1 |
| Pli confidentiel attribué à un service | 1 |
| Protection de l'assistant retirée (CA-005) | 1 |
| Lecture d'une pièce d'un pli confidentiel par un assistant (garde-fou) | 1 (après ajout du test d'un état forcé en base) |
| Motifs de changement de niveau lisibles de tout lecteur de l'historique | 2 |
| Prise en charge sans contrôle du niveau | 1 (test d'un état forcé en base : il a révélé un écart réel, corrigé avant la livraison) |
| E75 : changer son propre rôle ou désactiver son compte | 1 |

Double contrôle voulu : neutraliser seul le contrôle de `mails.js` sur le rattachement d'un fichier de la file ne casse aucun test, car celui de `pieces.js` retient ; les deux ensemble sont détectés.

Interface (`confidentialite.test.tsx`, `attribution.test.tsx`) : 13 contournements sur 13 détectés ; 1 mutant équivalent (les personnes désignées envoyées pour le niveau « Normal » : le champ est démonté, il n'est jamais envoyé).

| Contournement | Résultat |
| --- | --- |
| Pastille de niveau jamais affichée | Détecté |
| Objet d'un pli confidentiel : texte du serveur affiché | Détecté |
| « Confidentiel » proposé pour un courrier déjà enregistré | Détecté |
| Formulaire de changement de niveau sans droit de registre | Détecté |
| Bouton de remise sans droit de remise | Détecté |
| Motif du changement non obligatoire | Détecté (après ajout du test avec les personnes choisies) |
| « Confidentiel » possible avec un fichier de la file | Détecté |
| Objet demandé pour un pli confidentiel | Détecté |
| Personnes désignées jamais demandées | Détecté |
| Destinataire de la remise absent de l'historique | Détecté (après ajout de l'assertion) |
| Changement de niveau absent de l'historique | Détecté |
| E75 : rôle de sa propre ligne modifiable | Détecté |
| E75 : « Désactiver » proposé sur sa propre ligne | Détecté |
