# Historique des versions

Application courrier · version 0.4.1 · historique au 24/11/2026

## 0.4.1 du 24/11/2026, livrée, à installer et recetter sur NIXUS

Étape 4 bis : correction de l'écart E55 relevé à l'audit complet du cahier des charges. Remplace la 0.4.0, jamais installée. Aucune migration nouvelle (la migration 010 de la 0.4.0 s'applique toujours depuis la 0.3.1), aucune dépendance changée, construction sans `--no-cache`.

- **Prise en charge sans agent nommé** : un courrier attribué à un service sans agent nommé (CE-061) se prend en charge par tout agent ou responsable de ce service, qui devient l'agent nommé (nom sur la fiche, bannette « Moi », droit de clôture). Avec un agent nommé, lui seul le prend en charge, comme en 0.4.0. Un courrier non attribué, annulé, d'une autre entité ou d'un service dont on n'est pas membre reste refusé (403 ou 409).
- **Droits annoncés** : `rights.take` est vrai pour tout membre du service quand personne n'est nommé ; l'interface n'affiche le bouton que dans ce cas.
- **Textes** : message du bouton, fiche d'aide « Bannettes » (FR et NL) et `docs/fonctionnel/traitement.md` décrivent la nouvelle règle.
- **Tests** : serveur 175 (un test remplacé par deux), interface inchangée à 160 réussis et 1 ignoré ; preuve d'échec : neutraliser la règle fait échouer deux tests, neutraliser le droit annoncé en fait échouer un ; scripts de recette sur la démonstration : `recette.mjs`, `recette-agent.mjs` et `recette-faq.mjs` conformes.
- **Documents** : écarts E56 à E71 ouverts après l'audit, E55 et E72 clos, planning révisé, notes de livraison avec les trois questions RGPD.

## 0.4.0 du 17/11/2026, jamais installée, remplacée par la 0.4.1

Étape 4 du planning : traitement (CE-070, CE-071, CE-073, CE-079). Migration 010, aucune dépendance changée, construction sans `--no-cache`.

- **Prise en charge** : l'agent nommé du courrier la fait en un clic ; son nom apparaît sur la fiche et dans les listes. Un collègue, le responsable, le secrétariat, l'auditeur ou l'administrateur reçoivent 403 ; un courrier non attribué, annulé ou déjà pris reçoit 409.
- **Clôture** : l'agent nommé ou le responsable du service, depuis « en traitement » seulement, avec un motif actif de l'entité du courrier et une note facultative ; le secrétariat et le gestionnaire du registre sont notifiés. **Réouverture** : secrétariat et gestionnaire avec un motif obligatoire ; le courrier revient « en traitement » chez la personne qui l'avait pris en charge, qui est notifiée.
- **Motifs de clôture** : table `close_reasons` par entité, quatre motifs par défaut (répondu, traité sans réponse, transmis à l'extérieur, classé sans suite) posés par la migration et à la création d'une entité ; gérés par le gestionnaire du registre ou l'administrateur dans Administration › Types de courrier ; un motif désactivé reste lisible sur les courriers déjà clos.
- **Commentaires** : portée « service traitant » ou « entité » choisie à chaque commentaire, sans valeur par défaut ; ni modification ni suppression ; le texte n'entre jamais au journal d'audit ni dans la cloche.
- **Historique complet** : enregistrement, attributions, prise en charge, commentaires lisibles par la personne, clôtures, réouvertures, consultations (registre seulement). L'historique d'attribution a quitté le cadre « Attribution » pour le cadre « Traitement ».
- **Attribution et traitement** : un changement d'agent ou de service, ou un renvoi, remet le courrier à « attribué » ; un courrier clos refuse l'attribution, le changement d'agent et le renvoi (409 `CLOSED`).
- **Statut** : l'API rend `enregistre`, `en_traitement`, `clos` ou `annule` ; le filtre de statut du registre les connaît (E50). Bannette « Clos » pour les agents et responsables (E54) ; la cloche gagne les natures « commentaire », « clos » et « rouvert ».
- **Interface** : cadre « Traitement » dans la fiche (`TraitementCard`), motifs de clôture dans la page des types (`CloseReasonsCard`), couleurs de statut communes (`STATUS_COLOR`), textes FR et NL, sept explications de champs, trois procédures d'aide (Bannettes : prendre en charge et clore, commenter ; Registre : rouvrir ; Types : motifs de clôture).
- **API et MCP** : 11 routes (`POST /api/mails/:id/take`, `close`, `reopen`, `GET` et `POST /api/mails/:id/comments`, `GET /api/mails/:id/history`, cinq routes de `/api/close-reasons`), 11 outils MCP (95 routes, 89 outils exposés).
- **Tests** : `traitement.test.js` (25 tests : droits, transitions, motifs, commentaires, historique, filtre, cloisonnement, MCP, migration 010 sur une base de la 0.3.1) ; `traitement.test.tsx` (16 tests). Trois tests existants adaptés : compteurs avec la clé `clos`, parité des routes avec `close-reasons`, historique d'attribution déplacé ; le contrôle SQL statique tolère `STATUS_SQL` (E53).
- **Scripts de recette** : `recette-agent.mjs` joue aussi le traitement (69 contrôles sur la démonstration, deux contrôles faux corrigés pendant la mise au point) ; `recette.mjs` attend la version 0.4.0 ; `audit-fiches.spec.ts` connaît l'absence de l'onglet « Clos » chez le compte de démonstration.
- **Décomptes** : serveur 174 tests, 0 échec ; écrans 160 réussis et 1 test strict ignoré, 0 échec ; `help:check` 22 ; typage, accessibilité statique et construction à 0 erreur ; `npm audit --omit=dev` à 0 dans les deux dossiers ; `help:audit` réussi ; sur la démonstration : `recette.mjs` 38 contrôles, `recette-faq.mjs` 5 (deux passages), `recette-agent.mjs` 69 ; preuves d'échec 24 sur 24 (serveur) et 15 sur 15 (interface).
- **Écarts** : E50 à E55 ouverts, E49 clos (`ECARTS-CDC.md`).

## 0.3.1 du 17/11/2026, installée sur NIXUS, recettée par script et publiée sur GitHub le 17/11/2026

Correction d'un cas de réattribution trouvé en jouant l'attribution avec de vrais comptes (`recette-agent.mjs`, sur l'instance de démonstration) après l'installation de la 0.3.0. Aucune migration, aucune dépendance changée, aucun changement d'écran ni d'aide : l'archive reprend la 0.3.0 et en diffère par cinq fichiers de code, de test et d'outil, plus les numéros de version et les documents.

- **Réattribution au service qui était en copie** : le secrétariat renvoyait un courrier du service A au service B, qui l'avait en copie, et le serveur refusait (409 `SERVICE_INVALID`) parce qu'un service ne peut être traitant et en copie à la fois. Désormais, sans liste de copies donnée, le nouveau service traitant quitte la liste des copies ; une liste donnée qui le contient reste refusée. Cas courant : un service renvoie, le secrétariat réattribue à celui qui était informé.
- **Nouveau test** (`attribution.test.js`, 31 tests dans le fichier) : réattribution au service en copie avec et sans liste, puis après un renvoi. Il échoue quand on retire la correction (preuve jouée : 1 test en échec).
- **Nouveau script de recette** `frontend/help-capture/recette-agent.mjs` : crée trois comptes de test (agent du service A, agent du service B, responsable du service A, mot de passe aléatoire jamais affiché) et un courrier fictif, joue le parcours avec chacune de ces identités et celle du secrétariat (rien de lisible avant l'attribution, lecture seule de l'agent, nomination par le responsable, notifications et cloche, renvoi avec motif depuis l'écran, réattribution, cloisonnement de l'autre entité), puis annule le courrier avec un motif et désactive les comptes, même en cas d'échec. 45 contrôles conformes sur la démonstration ; il a trouvé le défaut ci-dessus.
- **Décomptes** : serveur 149 tests, écrans 144 réussis et 1 test strict ignoré, `help:check` 22, `help:audit` réussi, `recette-faq.mjs` 5, preuves d'échec 18 sur 18 (serveur) et 8 sur 8 (interface). Sur la démonstration : `recette.mjs` 38 contrôles, `recette-agent.mjs` 45. **Sur NIXUS** : `recette.mjs` 38 contrôles conformes (dont aucune remarque de Chrome sur 13 écrans et fenêtres) et `recette-agent.mjs` 46 contrôles conformes, comptes de test désactivés et courrier fictif annulé à la fin.
- **Publication** : demande de fusion n° 9 (commit `661ad9b`, 95 fichiers : 20 `A`, 75 `M`, aucun `D`), quatre contrôles verts (`tests` en 1 min 36 s, CodeQL), fusion `f766f1e`, étiquette `v0.3.1`, publication avec `courrier-v0_3_1.tar.gz` ; empreinte SHA-256 `249e5636…6b81` identique sur le PC, sur NIXUS, dans la publication et dans l'archive de Claude. Deux fichiers d'outils gardent dans le dépôt leur version validée par CodeQL, différente de celle de l'archive : voir l'écart E49.

## 0.3.0 du 17/11/2026, installée sur NIXUS le 17/11/2026, non publiée, remplacée par la 0.3.1

Étape 3 du planning : attribution du courrier. Migration 009 ; aucune dépendance ajoutée ni changée ; `npm ci` relit les verrous.

- **Attribution** : le secrétariat et le gestionnaire attribuent un courrier à un service traitant (un seul à la fois), à des services en copie et, facultativement, à un agent nommé du service ; changer le service d'un courrier déjà attribué demande un motif. Le responsable de service change l'agent dans son service. Tout membre du service traitant renvoie au secrétariat un courrier qui n'est pas le sien, avec un motif ; le courrier revient dans « À attribuer ». Historique de chaque fiche et journal d'audit sans objet ni expéditeur.
- **Visibilité** : l'agent et le responsable lisent le courrier de leurs services (traitant ou copie) ou qui les nomme, et ses fichiers, dans l'entité où ils ont ce rôle ; ils ne modifient, n'annulent ni n'attribuent rien (champ `rights` de la fiche, l'écran ne propose que ce que le serveur accepte). L'administrateur, l'auditeur et l'autre entité ne lisent rien. Lectures de l'agent au journal des consultations.
- **Bannettes** : page « Bannettes » avec onglets et compteurs : « À enregistrer » (renvoie à la file) et « À attribuer » pour le secrétariat ; « Mon service », « Moi » et « En copie » pour l'agent et le responsable. `GET /api/mails?box=` et `GET /api/mails/counts`.
- **Cloche** dans l'en-tête : courrier attribué à la personne, à son service, mis en copie, renvoyé au secrétariat ; numéro et nature seulement ; relue toutes les minutes.
- **Utilisateurs** : choix des services d'un agent ou d'un responsable par entité (`service_ids`), conservés si une mise à jour des rôles ne les mentionne pas.
- **API et MCP** : 7 routes (84 au total) et 7 outils (77 exposés) ; parité contrôlée.
- **Aide** : fiche « Bannettes » FR et NL (15 fiches), 2 captures annotées par langue, fiche du registre et fiche des utilisateurs complétées ; recette : 15 fiches, contrôles des bannettes, de la cloche et de la fiche d'attribution (lecture seule).
- **Outils** (écart E43) : `demo-server.cjs` ne sort plus du dossier construit (6 adresses d'attaque essayées) ; `recette.mjs` et `recette-faq.mjs` : titre d'essai de la FAQ unique à chaque passage, attente de la fin du chargement après la connexion. Ces trois fichiers sont maintenant dans l'archive ; `recette-faq.mjs` et les correctifs ont été reconstruits (l'archive de départ ne contenait pas la version du dépôt) : à comparer avec le dépôt.
- **Décomptes** : voir `MANIFESTE.md`. Preuves d'échec : 17 contournements sur 17 détectés côté serveur, 8 sur 8 côté interface (`docs/SECURITE.md`).

## 0.2.9 du 17/11/2026, installée sur NIXUS, recettée et publiée sur GitHub le 17/11/2026

Corrections constatées à la recette de la 0.2.8, qui n'est pas publiée : l'archive 0.2.9 reprend tout le contenu de la 0.2.8. Sans migration autre que la 008 de la 0.2.8, aucune dépendance changée depuis la 0.2.8.

- **Erreur de l'aide, écran « Entités et registres »** : la fiche disait de cliquer sur un bouton « Modifier » qui n'existe pas ; sur cet écran, un clic sur une ligne du tableau ouvre la fenêtre de modification. Zones et procédures réécrites d'après l'écran, y compris « Numéros attribués », texte de la fenêtre du registre et non colonne du tableau. Constatée par le script de recette (le bouton introuvable) et confirmée dans le code.
- **Audit « fiche contre écran réel »** (`npm run help:audit`, `help-capture/audit-fiches.spec.ts`) : pour chaque fiche, tout libellé cité dans la liste des zones doit exister à l'écran de la fiche ; les absences normales (états conditionnels, titres de fenêtre) sont listées avec leur raison. Il a signalé l'erreur ci-dessus avant correction et passe sur les 14 fiches.
- **Capture de « Créer un compte »** : elle était rattachée à la procédure « Modifier les rôles d'un compte » (reste d'une modification de ma part dans la fiche) ; remise sur la bonne procédure. Nouveau test : chaque capture de procédure illustre la bonne procédure.
- **Titre « Entités » de la fenêtre « Nouveau service »** : `for="entity_ids"` visait un élément absent (erreur de Chrome) ; composant `GroupItem`, 22 champs au total.
- **Champs sans identifiant ni nom** (information de Chrome sur Contacts et sur la fiche d'un courrier) : zones « Rechercher » du registre, des contacts et des consultations, champs de motif d'annulation et de désactivation, champ de l'assistant : `name` ajouté. Test statique et test sur le rendu des écrans et des fenêtres.
- **Tests étendus** aux fenêtres des services, des types, des entités et des registres : étiquettes bien reliées, aucune étiquette orpheline, champs nommés (cases à cocher exclues, Chrome ne les signale pas).
- **File « À enregistrer » de démonstration** : un fichier fictif (image générée par le script, aucun contenu réel) y est déposé ; la capture montre le fichier, le formulaire, les boutons de la file et « Rejeter ce fichier », avec 4 repères numérotés. Les repères peuvent maintenant viser un bouton par son libellé.
- **Script de recette** `frontend/help-capture/recette.mjs` (Playwright, Chrome du poste, `RECETTE_URL`, `RECETTE_USER`, `RECETTE_PASSWORD`, jamais dans le script) : rejoue sur n'importe quelle instance la version affichée, le panneau et les captures, nginx, le néerlandais, la FAQ (création, correction, retrait), les clés brutes, le parcours avec `#`, l'image de création d'un compte, puis les remarques de Chrome (avec l'élément visé) et les étiquettes mal reliées sur 11 écrans et fenêtres. Écrit `rapport.txt` et des captures. Il a trouvé en 3 minutes ce que mes tests et vos essais manuels n'avaient pas vu.
- Captures régénérées (versions affichées 0.2.9) : 36 images, 2,3 Mo.

Suites : serveur 118 tests, écrans 117 tests (un test strict ignoré hors `help:check`), 0 échec ; `help:check` 22 tests ; audit des fiches réussi ; recette locale du script sur l'instance de démonstration : 3 relances sur 3 conformes (une remarque intermittente de Chrome vue une fois sur quatre essais, non reproduite) ; 5 contrôles contournés un à un, tous détectés ; `npm audit --omit=dev` à 0 dans les deux parties.

Installée sur NIXUS le 17/11/2026 (sans migration nouvelle, construction sans `--no-cache` en 5 min 7 s) ; recettée par le script `recette.mjs` lancé sur le PC du conducteur : 23 contrôles conformes, dont **aucune remarque de Chrome sur 11 écrans et fenêtres** (E23 close), la fiche « Entités et registres » et l'image de « Créer un compte ». Le contrôle de la FAQ a échoué deux fois pour des défauts du script, pas de l'application : titre d'essai fixe en collision avec la question retirée du lancement précédent, puis appel lancé pendant la redirection qui suit la connexion ; corrigés (titre unique, page stable avant tout appel, reprise de l'appel), et les cinq contrôles de la FAQ sont conformes sur NIXUS avec `recette-faq.mjs`.

Après l'archive, un correctif hors image a été versé au dépôt (commit `82ca4fa`, trois fichiers) : CodeQL a signalé trois fois une sortie possible du dossier servi par `help-capture/demo-server.cjs` (gravité « High », « Uncontrolled data used in path expression »). L'attaque fonctionnait sur l'ancien code (`/etc/passwd` servi), elle est maintenant refusée (chemin normalisé puis contrôlé) ; les trois alertes sont résolues. Le même commit fixe le titre d'essai de la FAQ dans `recette.mjs` et ajoute `recette-faq.mjs`. L'archive publiée reste celle qui a été installée et recettée ; la différence avec le code source de l'étiquette est limitée à ces trois fichiers hors image (E43).

## 0.2.8 du 03/11/2026, installée sur NIXUS le 17/11/2026, non publiée, remplacée par la 0.2.9

Aide par écran, seconde moitié (standard v3.3, section 13.1), reprise du gabarit 1.3.0 et adaptée à courrier. Fin du lot « connexion, tickets, aide ». Migration 008. Une dépendance de développement ajoutée : `@playwright/test` (plage `^1.61.1` du standard, version 1.64.1 installée).

- Captures annotées FR et NL : script Playwright (`frontend/help-capture/capture.spec.ts`, `npm run help:capture`) sur une instance de démonstration éphémère (`npm run help:demo`) chargée avec le jeu fictif `atelier.exemple.json`, un compte de démonstration et quelques courriers et tickets fictifs ; jamais à la main, aucun nom de service réel. 18 captures par langue (36 images, 2,2 Mo) livrées dans `frontend/public/help/`. Un bouton se vise par sa clé de traduction. La zone découpée et les repères sont mesurés au même instant.
- Repères numérotés `[[n]]` dans la liste des zones de chaque fiche, reliés aux repères de la capture d'ensemble ; 4 captures de fenêtres ou de tiroir (fiche d'un courrier, création d'un contact, d'un compte, signalement) reliées aux procédures.
- Contrôles bloquants nouveaux : chaque fiche a une capture d'ensemble ; repères du texte égaux à ceux de la capture ; aucune capture inutilisée ni sans fiche ; chaque capture existe en FR et en NL, en JPEG, sous 400 Ko (dans `npm test`, donc en CI) ; `npm run help:check` reste le contrôle strict.
- FAQ locale en base (migration 008, `help_faq`) : lecture par toute personne connectée ; ajout, correction et retrait par l'administrateur et par les gestionnaires du registre (décision du 03/11/2026, E40) ; désactivation logique ; auteur enregistré ; journal d'audit sans le texte. 5 routes, 5 outils MCP (`list_faq`, `get_faq`, `create_faq`, `update_faq`, `deactivate_faq` en deux appels). Affichée dans le panneau de chaque écran et dans le centre d'aide, avec boutons « Ajouter une question », « Modifier » et « Retirer » pour ceux qui la gèrent.
- « Proposer pour la FAQ » depuis un ticket résolu (traitant qui gère la FAQ) : le titre et la résolution préremplissent le français, le néerlandais reste à écrire, avertissement sur les données personnelles.
- Défauts constatés à la recette de la 0.2.7, corrigés avec un test chacun : clé brute dans les titres de procédure et les questions (affichage par `RichText`) ; puces collées au bord (marge de 22 pixels) ; parcours du centre d'aide écrasé par le lien `#help-…` (élargissement une seule fois, au changement de lien).
- E23 : les titres de groupes de boutons (« Arrivé par », « Type de courrier », « Langue du courrier », « Urgence », rôles, mode de connexion, files de tickets) ne sont plus des éléments `<label>` orphelins : composant `GroupItem` (`role="group"`, `aria-labelledby`, même aspect que `Form.Item`), 21 champs convertis ; test sur le rendu de tous les écrans et des fenêtres ; Chromium confirme 0 étiquette orpheline sur 7 écrans. Le relevé de Chrome (F12, Issues) reste à refaire pour clore l'écart.
- nginx : `absolute_redirect off` et `try_files $uri /index.html` : `/help` reste l'écran du centre d'aide malgré le dossier des captures `/help/<langue>/` ; test du contenu.
- Vitest ne lit plus le script de captures (`include: src/**/*.test.*`).

Suites : serveur 118 tests, écrans 114 tests (un test de captures strict ignoré hors `help:check`), 0 échec ; contrôle réel dans Chromium : 12 contrôles conformes (FAQ ajout, correction et retrait ; ticket résolu proposé pour la FAQ ; parcours avec `#` ; marge ; clés brutes ; étiquettes sur 7 écrans) ; 14 contrôles contournés un à un, tous détectés ; `npm audit --omit=dev` à 0 dans les deux parties.

## 0.2.7 du 03/11/2026, installée sur NIXUS et publiée sur GitHub le 03/11/2026

Aide par écran, première moitié (standard v3.3, section 13.1), reprise du gabarit 1.3.0 et adaptée aux rôles par entité. Troisième version du lot « connexion, tickets, aide ». Sans migration, aucune dépendance changée. Les repères numérotés et les captures annotées arrivent en 0.2.8 (E39).

- 14 fiches d'aide, une par écran du menu, FR et NL côte à côte : accueil, registre, à enregistrer, enregistrer, contacts, consultations, comptes, entités et registres, services, types de courrier, paramètres, tickets, centre d'aide, accessibilité. 40 procédures (cas d'usage, étapes, résultat, erreurs et solutions), 22 questions propres aux écrans, renvois entre fiches. Un bouton ou un menu se cite par sa clé de traduction : l'aide affiche le libellé réel, dans la langue de la personne.
- Bouton « Aide » dans l'en-tête commun de chaque écran : la fiche s'ouvre dans un panneau latéral, sans quitter l'écran, avec un lien vers le mode d'emploi complet.
- Centre d'aide `/help` : parcours par rôle (agent, responsable de service, secrétariat, gestionnaire du registre, auditeur, administrateur), choisi par défaut d'après les rôles de la personne ; « tout le mode d'emploi » ; recherche plein texte ; impression complète du mode d'emploi (procédures dépliées) ; contact du support en paramètre. Remplace l'ancienne page d'aide écrite en dur (guide et 7 questions, reprises dans les fiches).
- Explication de chaque champ, FR et NL, derrière l'icône « ? » : 79 explications pour les 91 champs à encoder de tous les formulaires (comptes, entités, services, types, contacts, enregistrement, fiche du courrier, mot de passe, paramètres, connexion, tickets). Elles disent quoi encoder et d'où vient la valeur.
- E23 (remarques d'information de Chrome) : `autoComplete` posé sur tous les champs de saisie, champ de fichier du cadre de dépôt nommé (`id` et `name`), contrôlé par un test statique. Les 10 remarques sur les titres de groupes de boutons restent (E23).
- Contrôles bloquants à chaque version : chaque route du menu a sa fiche ; fiches et écrans alignés ; au moins deux procédures de deux étapes ; aucune clé inconnue ; FR et NL différents ; aucune abréviation ni personne nommée ; parcours cohérents avec les rôles des fiches ; aucun champ sans explication ni explication de moins de 12 caractères ; aucune explication inutilisée ; aucun champ de saisie sans autocomplétion ; aucun HTML interprété.
- Correction d'un défaut de présentation constaté pendant les essais : le contenu d'un panneau d'aide fermé restait dans la page (identifiants en double avec le centre d'aide) ; il est maintenant retiré à la fermeture.
- Valeurs locales : aucune dans le code (le contrôle de portabilité a refusé un exemple de code postal local, remplacé).

Suites : serveur 110 tests, écrans 101 tests (un test de captures ignoré hors contrôle strict), 0 échec ; parcours réel dans Chromium (7 contrôles) ; 10 contrôles retirés un à un, tous détectés ; `npm audit --omit=dev` à 0 dans les deux parties.

## 0.2.6 du 03/11/2026, installée sur NIXUS et publiée sur GitHub le 03/11/2026

Tickets de l'application (standard v3.3, section 13.5), repris du gabarit 1.3.0 et adaptés aux rôles par entité. Deuxième version du lot « connexion, tickets, aide ». Migration 007. Aucune dépendance changée.

- Bouton « Signaler » dans l'en-tête de chaque écran : type (incident, bug, question métier, souhait), titre, ce que je faisais, ce que j'attendais et ce qui s'est passé (incident et bug), qui est touché, gravité, capture facultative contrôlée sur son contenu (PNG ou JPEG, 2 Mo). Contexte joint sans saisie : écran (par son identifiant), version, langue, navigateur, date, dernière erreur de l'API (code et libellé seulement).
- Référence `TCK-AAAA-NNNNN` par année ; priorité ITIL impact × urgence (P1 à P4) ; délais de prise en charge et de résolution par priorité (1 h et 8 h, 4 h et 24 h, 8 h et 72 h, 24 h et 240 h) ; échéance dépassée signalée ; cycle de vie contrôlé (nouveau, pris en charge, en attente du demandeur, résolu, rejeté, annulé, clos) avec motif obligatoire pour l'attente, la résolution, le rejet, l'annulation et la réouverture ; notes internes invisibles du demandeur ; rien n'est supprimé.
- Files par entité (décision du 03/11/2026) : le ticket porte l'entité du demandeur ; la file IT (incident, bug, souhait) est traitée par l'administrateur ; la file métier (question) est traitée par le gestionnaire du registre de l'entité du ticket, jamais d'une autre entité ; une question sans entité (administrateur seul) va à la file IT ; un demandeur qui a des rôles dans deux entités choisit l'entité pour une question. Transfert motivé d'une file à l'autre ; vers la file métier seulement avec une entité.
- Rôles de chaque file, délais et délai de réouverture réglables dans Administration › Paramètres › Tickets ; chaque changement s'inscrit au journal d'audit avec l'ancienne et la nouvelle valeur. Rôles possibles : administrateur (toute l'application) ou rôle par entité (dans l'entité du ticket).
- RGPD by design : aucune capture sur les écrans qui affichent du courrier (registre, à enregistrer, enregistrer, consultations), refusée aussi par le serveur ; avertissement ailleurs ; le chemin joint ne porte aucun paramètre ni numéro de courrier. Écart voulu au standard 13.5 (E35).
- Pilotage : compteurs (en cours, délai dépassé, sans responsable, résolus en 30 jours), volumes par type, priorité et écran, limités aux files de la personne.
- API et MCP : 8 routes de tickets et 2 de réglages ; 11 outils MCP dont `list_tickets_to_handle` (tickets à traiter avec leur contexte, limités aux files de la personne). 72 routes au total, 64 outils MCP exposés.
- nginx : bloc `/api/tickets` à 4 Mo ; le gabarit limite tout `/api/` à 1 Mo, ce qui refuserait une capture de plus de 0,7 Mo (E29, clos). Test du contenu de `nginx.conf` et capture de 2 Mo acceptée par le serveur.
- Interface : écran Tickets (menu Aide), tiroir de ticket avec fil d'échanges et actions selon le rôle et le statut, table `screens.ts` des écrans (identifiants repris par l'aide en 0.2.7), explication de chaque champ des tickets (FR et NL), groupes de boutons sans étiquette orpheline, champs nommés.
- Test statique SQL : liste des interpolations permises complétée par des constantes du code (colonnes de regroupement, clause des files).

Suites : serveur 110 tests, écrans 78 tests, 0 échec ; parcours réel dans Chromium (10 contrôles : demandeur, gestionnaire, administrateur) ; 11 contrôles de sécurité retirés un à un, tous détectés ; `npm audit --omit=dev` à 0 dans les deux parties.

## 0.2.5 du 03/11/2026, installée sur NIXUS et publiée sur GitHub le 03/11/2026

Connexion Microsoft compatible avec Portal (standard v3.3, section 8.6), reprise du gabarit 1.3.0. Première version du lot « connexion, tickets, aide » ; elle avance la partie code de l'étape 7 du planning. Migration 006. Le mode de connexion reste `local` tant que l'inscription d'application Entra ID n'est pas saisie : aucun changement pour les agents.

- Serveur : `oidc.js` (OpenID Connect sans bibliothèque : code d'autorisation avec PKCE S256, aucun paramètre `prompt` ni `max_age`, jeton d'identité vérifié en RS256 avec la clé publiée par Microsoft, émetteur, audience, expiration, `nonce`), `routes/sso.js` (configuration, départ, retour, réglages, test), `settings.js` (clés `auth.*`, secret client chiffré et jamais renvoyé).
- Départ automatique vers Microsoft en mode `sso`, retour à l'écran demandé (`next` gardé côté serveur, accepté seulement s'il commence par un seul `/` et ne contient que lettres, chiffres et `-._~/`), trois exceptions sans redirection : `/login?deconnecte=1`, `/login?erreur=<code>`, `/login?local=1`.
- Rattachement du compte par `oid` d'abord, par adresse ensuite ; compte inconnu ou désactivé refusé avec un message qui dit qui contacter ; un compte désactivé perd sa session aussitôt.
- Accès de secours : colonne `is_admin_local`, posée par l'installation et, par la migration 006, sur les administrateurs existants ; en mode `sso`, seuls ces comptes gardent le mot de passe. Passage en mode `sso` refusé tant qu'aucun administrateur actif ne peut se connecter ; même garde à chaque modification de compte (ajout au gabarit, test dédié).
- Interface : page de connexion (bouton Microsoft, messages d'erreur traduits), déconnexion vers `/login?deconnecte=1`, Administration › Paramètres › carte « Connexion » avec explication de chaque champ, bouton « Tester l'annuaire » (le standard 8.2 le prévoit, le gabarit non), colonne « Accès de secours » et rattachement Microsoft dans Utilisateurs.
- Défaut du gabarit corrigé (E30) : le retour après connexion locale acceptait `//site` (contrôle `startsWith('/')`), ce qui permettait une redirection vers un autre site ; contrôle identique à celui du serveur, avec test.
- Cookies : le cookie de session et le cookie d'état ne s'écrasent plus (`appendCookie`).
- `qs` 6.16.0 vers 6.16.2 par `npm update qs` seul (alerte d'audit parue après le 27/10/2026, E31). `permissions: contents: read` dans `ci.yml` (alerte CodeQL, E28).
- Nouveaux fichiers : voir `MANIFESTE.md`. Documentation : `docs/fr|nl|en/SSO.md`, `docs/fonctionnel/connexion.md`.

Suites : serveur 96 tests, écrans 67 tests, 0 échec ; parcours réel dans Chromium contre un faux Microsoft (11 contrôles) ; `npm audit --omit=dev` à 0 dans les deux parties ; audit complet de l'interface : 12 alertes modérées dans la chaîne `eslint` (outils de développement, E34).

## 0.2.4 du 27/10/2026, installée sur NIXUS et publiée sur GitHub le 27/10/2026

Correction d'un défaut de la 0.2.3 relevé à sa recette sur NIXUS. Aucune fonction nouvelle, aucune migration, aucune dépendance changée par rapport à la 0.2.3.

- Sélecteur de date : en 0.2.3 il s'affichait en anglais (« Select date »), au format mois/jour (`10/27/2026`), avec un calendrier en anglais dont la semaine commençait le dimanche. Corrigé : `27/10/2026` en français, `27-10-2026` en néerlandais, calendrier dans la langue de l'utilisateur, semaine commençant le lundi.
- Cause racine : `antd/locale/fr_FR.js` est un fichier CommonJS qui renvoie vers `lib/`. Avec `vite` 8, `ConfigProvider` n'a pas reçu la langue et est resté en anglais, alors que `vite` 5 lisait ce fichier correctement. Le mécanisme exact (lecture de l'import par défaut) n'est pas vérifié dans le code du moteur ; le correctif est établi par essai : `antd/es/locale/fr_FR` et `nl_NL`. Une première piste, l'import ESM de la langue de `dayjs`, n'avait aucun effet. Les tests passaient parce que vitest lit ces fichiers par Node : ils ne voient pas les défauts du moteur de construction.
- Nouveau test `imports.test.ts` (2 tests) : interdit les imports `antd/locale` et `antd/lib`. Il contrôle la cause et non le résultat ; il est en échec avec l'import de la 0.2.3.
- Test du dépôt : ne signale plus `tsconfig.tsbuildinfo`, déjà exclu par `.gitignore`, qui le faisait échouer après un `npm run build`.
- Contrôle avant livraison : textes de 11 pages et 22 captures comparés à la 0.2.2, en français et en néerlandais, avec le rôle de secrétariat : aucune différence.

Suites : serveur 82 tests, écrans 60 tests, 0 échec ; `npm audit` à 0 vulnérabilité dans les deux parties, production et complet.

## 0.2.3 du 27/10/2026, installée sur NIXUS le 27/10/2026, non publiée sur GitHub, remplacée par la 0.2.4

Mise à jour de dépendances, avec l'accord de Renaud du 27/10/2026 pour `multer` et `vite`. Aucune fonction nouvelle, aucune migration de base, aucun changement dans `src/`.

- `multer` 1.4.5-lts.2 vers 2.5.0 : Dependabot relevait 10 alertes de gravité haute (dénis de service) sur la génération 1.x, que `npm audit` ne signalait pas. 15 paquets de moins.
- `vite` 5.4.21 vers 8.3.5, `@vitejs/plugin-react` 4.7.0 vers 6.1.2 (imposé par `vite` 8) et `vitest` 4.1.10 vers 4.1.12. Les 15 alertes Dependabot de l'interface et les 4 de `npm audit` disparaissent : audit complet à 0.
- Cinq dépendances indirectes de l'interface suivent ces montées : `chai`, `tinyrainbow`, `picomatch`, `@types/estree`, `@jridgewell/sourcemap-codec`.
- Le verrou de l'interface est écrit par npm 11, car npm 10 s'arrête sur son erreur interne à l'installation (E19). `npm ci` sous npm 10 relit ce verrou et reconstruit.
- Notes de livraison de la 0.2.2 : la commande `ls` du dossier des sauvegardes prend `sudo`.
- `docs/SECURITE.md` : limite de `npm audit` sur `multer` ; `docs/*/ARCHITECTURE.md` : version de `multer`.

Suites : serveur 82 tests, écrans 58 tests, 0 échec ; `npm audit` à 0 vulnérabilité dans les deux parties, production et complet. Contrôle visuel sur l'interface construite derrière le `nginx.conf` livré : connexion et huit pages d'un administrateur sans erreur ni violation de politique de sécurité ; registre et file « À enregistrer » à contrôler à la recette.

## 0.2.2 du 27/10/2026, installée sur NIXUS le 27/10/2026

Préparation du dépôt public GitHub. Aucune fonction nouvelle, aucune migration de base, aucune dépendance ajoutée.

- Fichier `.github/workflows/ci.yml` conforme à la section 7 de GITHUB.md : à chaque demande de fusion et à chaque poussée sur `main`, GitHub Actions joue les suites du serveur (avec `npm audit --omit=dev --audit-level=high`) et de l'interface (tests, construction, accessibilité).
- `.gitignore` renforcé (`.env.*`, bases, sauvegardes, `*.tsbuildinfo`, documents internes) ; `.gitattributes` fixe les fins de ligne en LF.
- Documents de l'archive : l'adresse, les ports et les dossiers du serveur d'acceptance sont remplacés par des valeurs d'exemple ; les noms complets de personnes et un détail d'exploitation de l'hôte sont remplacés par des rôles ou retirés.
- `backup.sh` n'écrit plus le dossier de l'hôte : le dossier des sauvegardes est la variable `BACKUP_DIR` ou, par défaut, `backups/<APP_NAME>` deux niveaux au-dessus du dossier de l'application. Même emplacement qu'avant sur le serveur d'acceptance.
- Retirés de l'archive : `STANDARD.md`, le cahier des charges, `backend/instance/atelier.json` (services réels, gardé dans les fichiers du projet) et la capture `docs/captures/05-services.png` (noms de services réels).
- Verrou du serveur : `body-parser` 1.20.8 vers 1.20.9 (gravité haute) et `fast-uri` 3.1.8 vers 3.1.9 (modérée), avis parus après le 20/10/2026 ; `package.json` inchangé. Sans cela l'étape `npm audit` de la CI échouait.
- Test `portabilite.test.js` : l'adresse et le dossier qu'il interdit ne sont plus écrits en clair. Nouveau test `depot.test.js` (5 tests) : valeurs interdites, secrets, fichiers de base et d'instance, documents internes, `.gitignore`, `ci.yml`.

Suites : serveur 82 tests, écrans 58 tests, 0 échec ; `npm audit --omit=dev` à 0 vulnérabilité dans les deux parties.

## 0.2.1 du 20/10/2026

Corrections relevées à la recette de la 0.2.0 sur NIXUS le 20/10/2026. Aucune fonction nouvelle, aucune migration de base.

- Un fichier d'un type refusé, glissé dans le cadre de dépôt ou choisi par clic, est maintenant envoyé au serveur et s'affiche avec la raison du refus, par exemple « Fichier TIFF refusé : réglez le copieur pour produire des PDF. ». Avant, il était écarté sans message.
- Les étiquettes des groupes de boutons (mode d'arrivée, type de courrier, langue, urgence, type de contact, rôles et mot de passe d'un compte) ne visent plus un élément qui n'est pas un champ ; chaque groupe porte son nom pour les lecteurs d'écran. Défaut présent depuis la 0.1.0.
- Le registre affiche le trombone et le nombre de fichiers dès qu'un fichier est ajouté depuis la fiche, sans rechargement de la page.
- File « À enregistrer » : l'annonce « Courrier enregistré avec son fichier » s'efface au dépôt suivant et au rejet d'un fichier.

Suites : serveur 77 tests, écrans 58 tests, 0 échec ; `npm audit --omit=dev` à 0 vulnérabilité.

## 0.2.0 du 20/10/2026, installée sur NIXUS le 20/10/2026

Étape 2 du planning : fichiers du courrier entrant et journal des consultations.

- File « À enregistrer » par entité : dépôt de fichiers PDF, JPEG et PNG par glisser-déposer ou par sélection, aperçu à côté du formulaire d'enregistrement, passage au fichier suivant sans revenir à la liste.
- Type de fichier vérifié sur son contenu ; un TIFF est refusé avec un message qui renvoie au réglage PDF des copieurs (D-24). Taille maximale de 50 Mo par fichier, réglable dans Administration › Paramètres (D-23). Un fichier refusé reste affiché avec sa raison.
- L'enregistrement joint le fichier au numéro attribué, dans la même opération ; un fichier déposé par erreur se rejette avec un motif.
- Fiche du courrier : fichiers dans un lecteur à côté des informations, ouverture dans un onglet, téléchargement, ajout d'un fichier à un courrier déjà enregistré. Trombone et nombre de fichiers dans le registre.
- Journal des consultations : chaque ouverture de fiche et chaque lecture de fichier, par l'écran ou par un assistant IA ; lisible par l'auditeur de l'entité, sans contenu du courrier.
- Nouvel écran Administration › Paramètres.
- API et outils MCP des fichiers, du journal et des paramètres ; contrat OpenAPI à jour.
- Serveur sous l'utilisateur `appuser` (10001) au lieu de `node` (1000) ; le volume de données change de propriétaire une seule fois au déploiement.
- `frontend/src/settings.ts` passe par `api.ts`, seul point d'accès à l'API.
- Corrigé : en thème sombre, le bouton choisi d'un groupe de boutons (mode d'arrivée, type, langue) était peu lisible ; défaut présent depuis la 0.1.0.
- Nouvelle dépendance du serveur : `multer` 1.4.5-lts.2, prévue par la section 4.2 du standard. Outils de développement mis à jour dans leur génération : `@babel/core`, `nanoid`, `postcss`, `undici`.
- Migration `005_pieces_consultations`.

Suites : serveur 77 tests, écrans 40 tests, 0 échec ; `npm audit --omit=dev` à 0 vulnérabilité.

## 0.1.1 du 13/10/2026, installée sur NIXUS le 20/10/2026

Corrections relevées à l'écran lors de la recette de la 0.1.0 sur NIXUS, et décisions du 13/10/2026.

- Onglet du navigateur au nom de l'application de l'instance (« Courrier », « Briefwisseling ») au lieu de « Application ».
- Écran Entités et registres : premier cadre intitulé « Entités ».
- Nom de l'administration sur deux lignes dans le menu, sans coupure.
- Le menu se met à jour dès qu'un administrateur modifie ses propres rôles, sans recharger la page.
- Création d'un compte : seul le bouton « Fermer » reste une fois le mot de passe affiché.
- Néerlandais : entrée de menu « Inkomende post » ; le titre complet reste dans la page.
- `react-router-dom` monté de 6.30 à 7.18.4, avec l'accord de Renaud : les trois vulnérabilités modérées disparaissent.
- Services : noms NL validés tels quels ; RD devient « Recherche et développement (RD) », SCAD « Service achat (SCAD) ».
- Script d'atelier : un service existant se met à jour par son ancien nom (champ `match`), sans doublon ; un test l'établit.
- Aucune migration de base.

Suites : serveur 57 tests, écrans 30 tests, 0 échec ; `npm audit --omit=dev` à 0 vulnérabilité.

## 0.1.0 du 13/10/2026, installée sur NIXUS le 13/10/2026

Première version de l'application, étape 1 du planning, construite sur le gabarit v3 1.1.0.

- Entités AC et CPAS, quatre registres (entrées et départs) chargés depuis la configuration, modifiables dans l'administration ; préfixe figé dès le premier numéro attribué.
- Rôles par entité : agent, responsable de service, secrétariat, gestionnaire du registre, auditeur. Un rôle à l'AC ne donne aucun droit au CPAS. L'administrateur n'accède pas au contenu du courrier sans rôle de registre.
- Services destinataires, communs possibles aux deux entités, avec service parent et nom NL facultatif ou marqué « à valider ».
- Types de courrier propres à chaque entité.
- Contacts communs, avec recherche pendant la frappe et création depuis le formulaire d'enregistrement.
- Enregistrement du courrier entrant sans pièce : numéro attribué par le serveur dans une transaction, selon l'année de la date de réception (D-20) ; enregistrement en série avec compteur de séance.
- Registre des entrées avec recherche et filtres gardés dans l'adresse, fiche du courrier, correction des champs permis, annulation avec motif.
- API REST et outils MCP pour les six ressources ; annulation en deux appels MCP.
- Données d'atelier chargées par une commande (`scripts/donnees-atelier.js`), refusée quand `APP_ENVIRONMENT=production`.
- Nouvelle variable `APP_ENVIRONMENT` dans `.env` ; étiquette « Acceptance : données fictives » dans l'en-tête.
- Écarts du gabarit corrigés : sauvegarde du dossier de données entier, colonnes d'auteur sur les comptes, dossier `docs/` et fichiers de suivi, rôles par entité, procédure en `bash backup.sh`, en-tête en 360 à 991 px, couleur des liens.

Suites : serveur 56 tests, écrans 30 tests, 0 échec ; audit serveur 0 vulnérabilité, interface 3 modérées (closes en 0.1.1).
