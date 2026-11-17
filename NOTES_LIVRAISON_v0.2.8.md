# Notes de livraison, version 0.2.8 du 03/11/2026

## Périmètre

Aide par écran, seconde moitié (standard v3.3, section 13.1) ; fin du lot « connexion, tickets, aide » :
- 36 captures annotées (18 en français, 18 en néerlandais) produites par un script Playwright sur des données fictives, avec repères numérotés reliés au texte des fiches ;
- FAQ locale en base (migration 008) : lecture par toute personne connectée, ajout, correction et retrait par l'administrateur et les gestionnaires du registre, 5 routes, 5 outils MCP, affichage dans le panneau de chaque écran et dans le centre d'aide ;
- « Proposer pour la FAQ » depuis un ticket résolu ;
- correction des trois défauts constatés à la recette de la 0.2.7 ;
- titres de groupes de boutons sans étiquette orpheline (écart E23) ;
- nginx : `/help` reste l'écran du centre d'aide malgré le dossier des captures.

Une dépendance de développement ajoutée : `@playwright/test` (plage `^1.61.1` du standard, version 1.64.1 installée). Elle n'entre pas dans l'image de l'application.

Les adresses, ports et dossiers de ce document sont des valeurs d'exemple (GITHUB.md, section 6). Les valeurs du serveur d'acceptance figurent dans le message de livraison.

## Cause racine et contrôle

| Point | Cause | Contrôle |
| --- | --- | --- |
| Clé brute `{{nav.registration}}` dans une question de l'aide | Les titres de procédure et les questions ne passaient pas par l'affichage qui remplace les clés par les libellés | Passage par `RichText` ; test de l'impression complète (aucune accolade) et test statique |
| Puces des zones collées au bord | Aucune marge de liste dans les fiches | Marge de 22 pixels ; test de la règle de style et mesure réelle dans Chromium |
| Choix « Parcours » écrasé avec `#` dans l'adresse | L'élargissement à « tout » se rejouait à chaque choix de la personne | Élargissement une seule fois, au changement de lien ; tests de la règle et mesure réelle (14 fiches puis 9 après le choix) |
| `/help` redirigé vers `/help/` | nginx traitait `/help` comme le dossier des captures `/help/<langue>/` | `absolute_redirect off` et `try_files $uri /index.html` ; test du contenu de `nginx.conf` (non jouable ici : pas de nginx dans mon environnement, à contrôler à la recette) |
| Repère décalé dans les captures de fenêtres | Les repères étaient mesurés avant que la fenêtre ait fini de se placer, puis la capture découpée plus tard | Zone découpée et repères mesurés au même instant ; captures revues |
| Remarques « No label associated » de Chrome | Les titres de groupes de boutons étaient des éléments `<label>` sans champ associé | Composant `GroupItem` (`role="group"`, `aria-labelledby`) ; test sur le rendu de tous les écrans ; 0 étiquette orpheline sur 7 écrans dans le vrai DOM ; relevé de Chrome à refaire |
| Noms de personnes dans un test public (depuis la 0.2.7) | La règle « aucune personne nommée » listait des noms | Remplacée par un contrôle générique (titres de civilité suivis d'un nom, adresses électroniques) |
| Vitest lisait le script de captures | Le motif de fichiers de test incluait `*.spec.ts` | `include: src/**/*.test.*` |

## Ce qui est simulé ou incomplet

- Je n'ai pas pu mesurer les remarques de Chrome moi-même : mon Chromium n'en produit aucune, même sur la 0.2.6 qui en avait 20 chez vous. E23 reste ouverte jusqu'au relevé de Chrome (point 9 de la liste de contrôle).
- nginx n'a pas été jouable dans mon environnement : le test lit sa configuration, la recette (point 8) vérifie le comportement réel.
- Captures : faites sur le jeu fictif, avec un compte administrateur qui tient aussi un rôle de gestionnaire et d'auditeur ; elles montrent donc des menus plus fournis que ceux d'un secrétariat. L'écran « À enregistrer » est montré file vide.
- FAQ commune aux deux entités (E41) et gérée aussi par les gestionnaires (E40) : à signaler à Renaud.
- Textes néerlandais rédigés par Claude : à relire par un traducteur.
- Hors lot : notes de version affichées à la première connexion (E18), recette réelle de la connexion Microsoft (en attente de l'inscription Entra ID).
- Alerte Dependabot n° 29 (1 modérée) toujours à examiner (E38).

## Trois questions RGPD

1. Quelles données nouvelles ? Le texte des questions et réponses de la FAQ, et l'identifiant de la personne qui les a écrites ou corrigées. Les captures montrent seulement des données fictives.
2. Pour quelle finalité ? Donner aux agents des réponses locales sans livraison de l'application.
3. Qui y accède ? Toute personne connectée lit les entrées actives, des deux entités ; l'administrateur et les gestionnaires du registre les écrivent et voient aussi les entrées retirées. Le journal d'audit garde qui et quand, jamais le texte. Un avertissement demande de n'y mettre ni nom, ni adresse, ni donnée de courrier. Durée de conservation : à fixer avec le DPO (étape 20).

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation. Copie complète ci-dessous. Pas de `--no-cache`. Une migration (008).

Sur le PC, dans File Station : téléverser `courrier-v0_2_8.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh administrator@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_2_8.tar.gz
```

Attendu : le fichier, à la taille annoncée dans le message de livraison.

```bash
sudo bash backup.sh
```

Attendu : `sauvegarde terminée, N sauvegardes conservées.`

```bash
sudo rm -rf backend frontend docs
```

```bash
sudo tar xzf courrier-v0_2_8.tar.gz --strip-components=1
```

```bash
ls backend frontend
```

```bash
sudo sh -c 'date; docker compose build; date'
```

Attendu : aucune ligne `ERROR` ; `naming to docker.io/library/courrier-backend` et `courrier-frontend`. Prévoir de 5 à 15 minutes.

```bash
sudo docker compose up -d
```

Attendu : `courrier-api Healthy`, `courrier-web Started`.

```bash
sudo docker compose ps
```

Attendu : les deux conteneurs `Up (healthy)`.

```bash
sudo docker logs courrier-api --tail 30
```

Attendu : `[DB] Migration 008_faq_locale appliquée` puis `[APP] API 0.2.8 sur le port 3001`.

```bash
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.2.8"},"meta":{"envelope":1,"version":"0.2.8"}}`.

Ensuite, dans le navigateur du PC : l'adresse de l'application, Ctrl + F5, zoom à 100 % (Ctrl + 0), puis la liste de contrôle.

## Liste de contrôle à l'écran

1. Au bas du menu : `v0.2.8`. Les courriers et les tickets des versions précédentes sont toujours là.
2. Sur « Registre des entrées », cliquer sur « Aide » : au-dessus de la liste des zones, une capture de l'écran montre trois cadres rouges numérotés 1, 2 et 3 ; les numéros du texte sont les mêmes. Les puces des zones ont une marge à gauche.
3. Passer en néerlandais : la capture est celle de l'écran en néerlandais. Remettre FR.
4. Dans « Utilisateurs », « Aide », déplier « Créer un compte » : une capture de la fenêtre de création s'affiche avec un cadre rouge sur le champ de l'adresse.
5. Dans « Mode d'emploi et FAQ », fiche « À enregistrer », dernière question : « Quelle différence avec « Enregistrer un courrier » ? » : le nom du menu est affiché, sans accolades.
6. Ouvrir `Mode d'emploi complet` depuis un panneau d'aide : l'adresse est `/help#help-…`. Choisir le parcours « Administrateur » : il reste neuf fiches (le choix n'est pas remis à « Tout »).
7. FAQ : dans « Mode d'emploi et FAQ », cliquer sur « Ajouter une question » (visible pour vous, administrateur). Choisir l'écran « Registre des entrées », écrire une question et une réponse en français et en néerlandais, enregistrer. Ouvrir « Aide » sur le registre : la question s'affiche sous les questions du mode d'emploi. La modifier, puis la retirer (« Retirer » puis « Oui ») : elle disparaît du panneau, et reste visible pour vous dans le centre d'aide avec la mention « Retirée ».
8. nginx : sur « Mode d'emploi et FAQ », appuyer sur F5 : la page reste sur `/help` (pas de `/help/`) et les captures s'affichent.
9. Remarques de Chrome (E23) : F12, onglet « Issues », recharger puis ouvrir « Enregistrer un courrier », « Utilisateurs » › « Créer », « Paramètres », « Tickets » › « Signaler » et « Services » › « Nouveau service ». Relever le nombre de remarques. Attendu : plus aucune remarque « No label associated with a form field ».
10. Ticket vers FAQ (facultatif) : dans « Utilisateurs » › « Modifier les rôles » de votre compte, remplacer « Secrétariat » par « Gestionnaire du registre » pour l'AC. Dans « Tickets », ouvrir `TCK-2026-00001`, « Prendre en charge », « Résoudre » avec un motif : le bouton « Proposer pour la FAQ » apparaît ; il ouvre la fenêtre avec le titre et le motif déjà écrits en français et l'avertissement. Fermer sans enregistrer. Remettre « Secrétariat » si vous le souhaitez.

## Retour arrière

Rejouer la mise à jour avec `courrier-v0_2_7.tar.gz`, restée dans le dossier. La migration 008 ajoute une table sans rien supprimer : la 0.2.7 l'ignore, aucune base à restaurer.

## Dépôt GitHub

Procédure de GITHUB.md, section 5, après la recette : branche `version/v0.2.8`, archive `courrier-v0_2_8.tar.gz` dans Téléchargements (si le navigateur l'a rangée ailleurs, la copier d'abord et vérifier son empreinte), demande de fusion `v0.2.8`, travail « tests » vert, étiquette `v0.2.8`, publication avec l'archive. Les commandes GitHub se tapent dans PowerShell sur le PC, après `exit` de la session SSH.

## Points ouverts

- Relevé de Chrome (point 9) pour clore E23.
- Inscription d'application Entra ID à demander, puis recette réelle de la connexion Microsoft (7 points) : action 18 de `DECISIONS.md`.
- Informer Renaud : FAQ gérée par les gestionnaires (E40) et commune aux deux entités (E41), restriction des captures de tickets (E35), bouton « Tester » (E32).
- Alerte Dependabot n° 29 à examiner (E38). Notification par courriel de NIXUS toujours en panne.
- Prochaine étape du planning : étape 3 (attribution, version 0.3.0).

## Liste de contrôle de la version (standard, section 18)

| Point | État |
| --- | --- |
| Versions majeures inchangées | Oui ; une dépendance de développement ajoutée (`@playwright/test`) |
| Données, API, MCP, migrations | Migration 008 ; 5 routes et 5 outils MCP de la FAQ ; 77 routes, 70 outils exposés |
| Tout texte en FR et NL | Conforme (parité contrôlée par `i18n.test.ts`, fiches, explications et FAQ comparées en FR et NL) |
| Suites entières, 0 échec ; test de non-régression | Serveur 118, écrans 114 (un test strict ignoré hors `npm run help:check`) ; preuves d'échec dans `docs/SECURITE.md` |
| Grille de sécurité | `docs/SECURITE.md` mise à jour |
| Trois questions RGPD | Ci-dessus |
| Nouveau numéro, archive vérifiée, commandes NIXUS | Conforme |
| Déploiement et recette sur NIXUS | À faire |
