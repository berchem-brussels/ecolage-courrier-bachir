# Notes de livraison, version 0.2.5 du 03/11/2026

## Périmètre

Connexion Microsoft compatible avec Portal (standard v3.3, section 8.6), reprise du gabarit 1.3.0 : OpenID Connect côté serveur avec PKCE, départ automatique en mode « Microsoft obligatoire », retour à l'écran demandé, accès de secours des administrateurs, bouton « Tester l'annuaire », carte Administration › Paramètres › Connexion, colonne « Accès de secours » dans Utilisateurs. Migration 006. Le mode reste « Comptes locaux » tant que l'inscription Entra ID n'est pas saisie : rien ne change pour les agents. Aucune dépendance ajoutée ; `qs` 6.16.2 ; `ci.yml` avec `permissions: contents: read`.

Les adresses, ports et dossiers de ce document sont des valeurs d'exemple (GITHUB.md, section 6). Les valeurs du serveur d'acceptance figurent dans le message de livraison.

## Cause racine et contrôle

| Point | Cause | Contrôle |
| --- | --- | --- |
| Redirection ouverte dans le gabarit 1.3.0 | Le retour après connexion locale testait seulement `startsWith('/')` : `//site` passait | `safeNextPath` identique au serveur ; `connexion.test.tsx` ; en échec avec le contrôle du gabarit |
| Audience du jeton non testée | Les tests du gabarit couvraient signature, locataire, expiration et `nonce`, pas l'audience | Test ajouté ; en échec sans le contrôle |
| Alerte d'audit `qs` 6.16.0 | Avis paru après le 27/10/2026, dépendance indirecte d'`express` | `npm update qs` seul : 6.16.2, audit du serveur à 0 |
| Alerte CodeQL sur `ci.yml` | Droits par défaut du jeton du travail | `permissions: contents: read` |

## Ce qui est simulé ou incomplet

- Recette réelle en sept points avec Portal impossible avant l'inscription d'application Entra ID (action 7 de `DECISIONS.md`) et le lien dans Portal.
- « Tester l'annuaire » vérifie que le locataire répond chez Microsoft ; l'identifiant et le secret ne sont contrôlés qu'au premier essai de connexion.
- Audit complet de l'interface : 12 alertes modérées dans la chaîne `eslint` (outils de développement), accord de Renaud nécessaire pour une montée majeure (E34).
- Écarts E29 à E34 dans `ECARTS-CDC.md`.

## Trois questions RGPD

1. Quelles données nouvelles ? L'identifiant Entra (`oid`) du compte, gardé sur la fiche de l'agent ; l'adresse e-mail et le nom viennent déjà de l'application.
2. Pour quelle finalité ? Authentifier l'agent sans nouvelle saisie.
3. Qui y accède ? L'administrateur voit « Compte Microsoft rattaché » (oui ou non), jamais l'`oid`. Le secret de l'inscription est chiffré et ne se réaffiche pas. Les tentatives refusées vont au journal d'audit sans le jeton.

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation. Copie complète ci-dessous. Construction avec `--no-cache` : le verrou du serveur change (`qs`).

Sur le PC, dans File Station : téléverser `courrier-v0_2_5.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh administrator@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_2_5.tar.gz
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
sudo tar xzf courrier-v0_2_5.tar.gz --strip-components=1
```

```bash
ls backend frontend
```

```bash
sudo sh -c 'date; docker compose build --no-cache; date'
```

Attendu : aucune ligne `ERROR` ; `naming to docker.io/library/courrier-backend` et `courrier-frontend`.

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

Attendu : la ligne `[DB] Migration 006_connexion_microsoft appliquée`.

```bash
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.2.5"},"meta":{"envelope":1,"version":"0.2.5"}}`.

Ensuite, dans le navigateur du PC : l'adresse de l'application, Ctrl + F5, zoom à 100 % (Ctrl + 0), puis la liste de contrôle.

## Liste de contrôle à l'écran

1. Au bas du menu : `v0.2.5`. Les courriers `AC-2026-000001` à `AC-2026-000006` sont toujours là.
2. Se déconnecter, puis se reconnecter avec son mot de passe : connexion comme avant. Après la déconnexion, le message « Vous êtes déconnecté. » s'affiche.
3. Administration › Paramètres : la carte « Fichiers déposés » est inchangée ; en dessous, la carte « Connexion » affiche le mode « Comptes locaux ». Survoler le point d'interrogation de chaque champ : une explication s'affiche.
4. Cliquer sur « Tester l'annuaire » sans rien saisir : message « Saisissez d'abord l'annuaire (locataire), puis relancez le test ». Ne saisir ni identifiant ni secret réel.
5. Administration › Utilisateurs : colonne « Accès de secours », interrupteur actif pour les deux administrateurs.
6. Passer en néerlandais : la carte « Aanmelden » et la colonne « Noodtoegang » s'affichent ; remettre FR.
7. Ne pas passer en mode « Microsoft obligatoire » : il n'y a pas encore d'inscription.

## Retour arrière

Rejouer la mise à jour avec `courrier-v0_2_4.tar.gz`, restée dans le dossier. La migration 006 ajoute des colonnes et une table sans rien supprimer : la 0.2.4 les ignore, aucune base à restaurer.

## Dépôt GitHub

Procédure de GITHUB.md, section 5, après la recette : branche `version/v0.2.5`, archive `courrier-v0_2_5.tar.gz` dans Téléchargements, demande de fusion `v0.2.5`, travail « tests » vert, étiquette `v0.2.5`, publication avec l'archive. Le fichier `ci.yml` change : l'alerte CodeQL « Workflow does not contain permissions » doit disparaître après la fusion.

## Points ouverts

- Inscription d'application Entra ID, à demander ; vérifier à sa création si le portail accepte une adresse IP, sinon prévoir un nom DNS.
- Informer Renaud : `qs` (E31), bouton « Tester » (E32), redirection ouverte et limite nginx de 1 Mo du gabarit (E29, E30), contenu type de `ci.yml` dans GITHUB.md (E28).
- Notification par courriel de NIXUS toujours en panne.

## Liste de contrôle de la version (standard, section 18)

| Point | État |
| --- | --- |
| Versions majeures inchangées | Oui |
| Données, API, MCP, migrations | Migration 006 ; 6 routes de connexion sans outil MCP (navigation et réglages d'écran) |
| Tout texte en FR et NL | Conforme (parité contrôlée par `i18n.test.ts`) |
| Suites entières, 0 échec ; test de non-régression | Serveur 96, écrans 67 ; preuves d'échec dans `docs/SECURITE.md` |
| Grille de sécurité | `docs/SECURITE.md` mise à jour |
| Trois questions RGPD | Ci-dessus |
| Nouveau numéro, archive vérifiée, commandes NIXUS | Conforme |
| Déploiement et recette sur NIXUS | À faire |
