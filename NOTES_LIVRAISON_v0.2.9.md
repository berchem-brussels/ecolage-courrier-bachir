# Notes de livraison, version 0.2.9 du 17/11/2026

## Périmètre

Corrections des défauts relevés à la recette de la 0.2.8 (installée sur NIXUS le 17/11/2026, non publiée). La 0.2.9 reprend tout le contenu de la 0.2.8, y compris la migration 008 déjà appliquée : elle ne change pas la base.

- Fiche d'aide « Entités et registres » réécrite d'après l'écran (un clic sur une ligne ouvre la fenêtre de modification) ; audit « fiche contre écran réel » des 14 fiches (`npm run help:audit`).
- Capture de « Créer un compte » remise sur la bonne procédure.
- Titre « Entités » de la fenêtre « Nouveau service » sans étiquette mal reliée ; zones de recherche et champs de motif nommés ; tests étendus à toutes les fenêtres.
- File « À enregistrer » de démonstration avec un fichier fictif : la capture montre le fichier, le formulaire, les boutons et quatre repères numérotés ; captures régénérées.
- Script de recette `frontend/help-capture/recette.mjs`, conservé dans le dépôt.

Aucune dépendance changée depuis la 0.2.8. Les adresses, ports et dossiers de ce document sont des valeurs d'exemple (GITHUB.md, section 6). Les valeurs du serveur d'acceptance figurent dans le message de livraison.

## Cause racine et contrôle

| Point | Cause | Contrôle |
| --- | --- | --- |
| La fiche « Entités et registres » décrivait un bouton « Modifier » et une colonne « Numéros attribués » inexistants | Fiche écrite sans la vérifier contre l'écran réel (E42) | Fiche réécrite ; audit `help:audit` : chaque libellé cité par une zone doit exister à l'écran ; il a signalé l'erreur avant la correction |
| Capture de « Créer un compte » absente de la procédure | Rattachée à la procédure suivante, par une modification de ma part | Test : chaque capture de procédure illustre la bonne procédure ; en échec avec l'ancienne fiche |
| Erreur de Chrome sur « Nouveau service » (`for="entity_ids"`) | Cases à cocher dans un `Form.Item` dont l'étiquette vise un élément absent ; mes tests n'ouvraient pas cette fenêtre | `GroupItem` ; test sur les fenêtres des services, des types, des entités et des registres ; en échec avec l'ancien composant (« entity_ids -> DIV ») |
| Information de Chrome sur des champs sans identifiant ni nom | Zones de recherche et champs de motif placés hors d'un `Form.Item` nommé | `name` ajouté ; test statique et test sur le rendu des écrans et des fenêtres |
| Mes essais n'avaient pas vu ces défauts | Contrôles ouverts sur un petit nombre d'écrans | Le script de recette relève 11 écrans et fenêtres avec l'élément visé par chaque remarque |

## Ce qui est simulé ou incomplet

- Mon Chromium ne reproduit les remarques de Chrome qu'en partie : une remarque intermittente (champ sans nom sur la fenêtre d'ajout de FAQ) est apparue une fois sur quatre essais locaux, non reproduite ensuite, et ne s'est pas produite chez vous. Le script lancé sur votre instance fait foi.
- Je ne peux pas atteindre l'adresse interne de NIXUS : la recette de cette version se joue par le script sur votre PC, comme pour la 0.2.8.
- Les fiches « étapes non vues à l'écran » de l'audit (libellés cités dans des fenêtres) se relisent à la main : l'audit ne les ouvre pas.
- Le dépôt GitHub est à la 0.2.7 : la demande de fusion porte aussi les changements de la 0.2.8 non publiée.
- Textes néerlandais rédigés par Claude, à relire par un traducteur.
- Hors lot : notes de version affichées à la première connexion (E18) ; recette réelle de la connexion Microsoft (en attente de l'inscription Entra ID) ; alerte Dependabot n° 29 à examiner (E38).

## Trois questions RGPD

1. Quelles données nouvelles ? Aucune. Le fichier de démonstration est une image générée par le script, sans contenu réel, et n'existe que dans l'instance éphémère des captures.
2. Pour quelle finalité ? Corriger l'aide et les écrans.
3. Qui y accède ? Sans changement. Le script de recette lit le compte et le mot de passe dans la fenêtre de commande de la personne qui le lance : ils ne sont écrits ni dans le script, ni dans la conversation, ni dans le rapport.

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation. Copie complète ci-dessous. Pas de `--no-cache`. Aucune migration nouvelle.

Sur le PC, dans File Station : téléverser `courrier-v0_2_9.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh administrator@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_2_9.tar.gz
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
sudo tar xzf courrier-v0_2_9.tar.gz --strip-components=1
```

```bash
ls backend frontend
```

```bash
sudo sh -c 'date; docker compose build; date'
```

Attendu : aucune ligne `ERROR` ; `naming to docker.io/library/courrier-backend` et `courrier-frontend`. Prévoir de 3 à 15 minutes.

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

Attendu : `[APP] API 0.2.9 sur le port 3001`, sans nouvelle ligne de migration.

```bash
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.2.9"},"meta":{"envelope":1,"version":"0.2.9"}}`.

## Liste de contrôle

1. Version et script : copier `recette-0.2.9.mjs` dans `C:\recette`, puis, dans PowerShell sur le PC, dans `C:\recette` : renseigner `RECETTE_URL`, `RECETTE_USER` et `RECETTE_PASSWORD`, lancer `node recette-0.2.9.mjs`. Attendu : « Tous les contrôles sont conformes », dont aucune remarque de Chrome sur les 11 écrans et fenêtres. Transmettre le rapport.
2. À l'écran, « Entités et registres » : cliquer sur une ligne du premier tableau ouvre « Modifier l'entité » ; ouvrir « Aide » : la liste des zones dit qu'un clic sur une ligne ouvre cette fenêtre, sans bouton « Modifier ».
3. À l'écran, « Utilisateurs » › « Aide » › « Créer un compte » : la capture de la fenêtre de création s'affiche dans cette procédure, avec un cadre rouge sur l'adresse e-mail.
4. À l'écran, « À enregistrer » › « Aide » : la capture montre un fichier en file, avec quatre repères numérotés.
5. Dans « Services » › « Nouveau service », F12 › « Issues » : aucune remarque.

## Retour arrière

Rejouer la mise à jour avec `courrier-v0_2_8.tar.gz`, restée dans le dossier (ou `courrier-v0_2_7.tar.gz`, la dernière publiée). Aucune migration nouvelle : aucune base à restaurer.

## Dépôt GitHub

Procédure de GITHUB.md, section 5, après la recette. Le dépôt est à la 0.2.7 : créer la branche `version/v0.2.9` depuis `main`, et mettre dans la description de la demande de fusion « reprend la 0.2.8 non publiée ». Archive `courrier-v0_2_9.tar.gz` dans Téléchargements (si le navigateur l'a rangée ailleurs, la copier d'abord et vérifier son empreinte), demande de fusion `v0.2.9`, travail « tests » vert, étiquette `v0.2.9`, publication avec l'archive. Les commandes GitHub se tapent dans PowerShell sur le PC, après `exit` de la session SSH. Au contrôle de `git status`, attendre de nombreux fichiers nouveaux et modifiés, aucun supprimé, et rien de `.env`, `node_modules`, `data/`, `.db` ni `report-`.

## Points ouverts

- Relevé du script sur l'instance (point 1) pour clore E23.
- Inscription d'application Entra ID à demander, puis recette réelle de la connexion Microsoft (7 points) : action 18 de `DECISIONS.md`.
- Informer Renaud : FAQ gérée par les gestionnaires (E40) et commune aux deux entités (E41), restriction des captures de tickets (E35), bouton « Tester » (E32).
- Alerte Dependabot n° 29 à examiner (E38). Notification par courriel de NIXUS toujours en panne.
- Prochaine étape du planning : étape 3 (attribution, version 0.3.0).

## Liste de contrôle de la version (standard, section 18)

| Point | État |
| --- | --- |
| Versions majeures inchangées | Oui ; aucune dépendance changée depuis la 0.2.8 |
| Données, API, MCP, migrations | Aucune migration nouvelle (008 déjà appliquée) ; aucune route ni outil ajouté |
| Tout texte en FR et NL | Conforme (parité contrôlée par `i18n.test.ts`) |
| Suites entières, 0 échec ; test de non-régression | Serveur 118, écrans 117 (un test strict ignoré hors `help:check`) ; preuves d'échec dans `docs/SECURITE.md` |
| Grille de sécurité | `docs/SECURITE.md` mise à jour |
| Trois questions RGPD | Ci-dessus |
| Nouveau numéro, archive vérifiée, commandes NIXUS | Conforme |
| Déploiement et recette sur NIXUS | À faire |
