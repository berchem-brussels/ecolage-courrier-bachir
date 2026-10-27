# Notes de livraison, version 0.1.1 du 13/10/2026

## Périmètre

Corrections des six défauts relevés lors de la recette de la 0.1.0 sur NIXUS, montée de `react-router-dom` en version 7 avec l'accord de Renaud, mise à jour des services (RD, SCAD, noms NL validés). Aucune nouvelle fonction, aucune migration de base.

## Cause racine des défauts corrigés

| Défaut | Cause | Contrôle |
| --- | --- | --- |
| Onglet « Application » | Titre statique du gabarit dans `index.html`, jamais remplacé par le nom de l'instance | Titre lu sur l'interface construite : « Courrier », puis « Briefwisseling » en NL |
| Premier cadre « Entités et registres » | Clé de menu réutilisée comme titre de cadre | Titres relevés : « Entités », « Registres » |
| Nom de l'administration coupé | `white-space: nowrap` hérité du gabarit | Capture du menu en NL : deux lignes |
| Menu non rafraîchi après modification de ses rôles | Le profil n'était relu qu'au chargement de la page | Retrait de ses rôles à l'écran : menu « Accueil » sans F5 |
| Bouton « Annuler » après création d'un compte | Bouton d'annulation laissé quand le mot de passe s'affiche | Boutons visibles relevés : « Fermer » seul |
| « Register van inkomende post » coupé | Libellé de menu trop long pour 230 px | Libellé de menu « Inkomende post » |

## Ce qui est simulé ou incomplet

Inchangé depuis la 0.1.0 : base `sql.js`, données fictives, comptes locaux. Aucun courrier réel.

## Trois questions RGPD

Aucune nouvelle donnée personnelle, aucune nouvelle finalité, aucun nouveau destinataire.

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation. Copie complète ci-dessous.

Dans File Station, sur le PC : téléverser `courrier-v0_1_1.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh utilisateur@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_1_1.tar.gz
```

Attendu : le fichier listé, environ 1 Mo.

```bash
sudo bash backup.sh
```

Attendu : `[courrier] ... : sauvegarde terminée, 2 sauvegardes conservées.`

```bash
sudo rm -rf backend frontend docs
```

```bash
sudo tar xzf courrier-v0_1_1.tar.gz --strip-components=1
```

```bash
ls backend frontend
```

Attendu : le contenu des deux dossiers.

```bash
sudo sh -c 'date; docker compose build; date'
```

Attendu : aucune ligne `ERROR`.

```bash
sudo docker compose stop backend
```

Attendu : `Container courrier-api  Stopped`.

```bash
sudo docker compose run --rm --no-deps backend node scripts/donnees-atelier.js
```

Attendu : `[ATELIER] atelier.json : 2 paramètres, 0 services, 0 types, 0 contacts ajoutés ; 21 services mis à jour.`

```bash
sudo docker compose up -d
```

```bash
sudo docker compose ps
```

Attendu, après une minute : les deux conteneurs en `Up (healthy)`.

```bash
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.1.1"},"meta":{"envelope":1,"version":"0.1.1"}}`

Retour arrière : rejouer les mêmes commandes avec `courrier-v0_1_0.tar.gz`, resté dans le dossier, sans l'étape `donnees-atelier.js`. Aucune migration n'a été appliquée : la base n'a pas à être restaurée.

## Liste de contrôle à l'écran

1. L'onglet du navigateur s'intitule « Courrier ».
2. Le menu montre le nom complet de l'administration sur deux lignes, et « v0.1.1 » en pied.
3. Entités et registres : le premier cadre s'intitule « Entités ».
4. Services : plus aucune mention « NL à valider » ; « Recherche et développement (RD) » et « Service achat (SCAD) » présents.
5. Utilisateurs, Créer : une fois le mot de passe affiché, seul « Fermer » reste.
6. Utilisateurs, Modifier les rôles sur son propre compte : le menu change sans F5.
7. En NL, l'entrée de menu « Inkomende post » est entière ; l'onglet s'intitule « Briefwisseling ».
8. Le registre, l'enregistrement et la fiche fonctionnent comme en 0.1.0 (routeur en version 7).

## Points ouverts

- Service qui enregistre le courrier du CPAS (nécessaire à l'étape 13).
- Notification par courriel de NIXUS en panne : hors application, bloquant avant une production.
- Tâches de PILOT désactivées dans le Planificateur : laissées telles quelles.
