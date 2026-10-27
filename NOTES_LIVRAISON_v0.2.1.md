# Notes de livraison, version 0.2.1 du 20/10/2026

## Périmètre

Corrections relevées à la recette de la 0.2.0 sur NIXUS le 20/10/2026. Aucune fonction nouvelle, aucune migration de base, aucune dépendance changée. Seule l'interface change ; le serveur ne change que par son numéro de version.

## Cause racine des défauts corrigés

| Défaut | Cause | Contrôle |
| --- | --- | --- |
| TIFF glissé dans le cadre de dépôt : rien ne se passe (point 5 de la recette) | Le composant de dépôt d'Ant Design filtre les fichiers selon sa liste `accept` et écarte les autres sans message, avant tout envoi. Le contrôle visuel de la 0.2.0 déposait le fichier directement dans le champ caché, ce qui contourne ce filtre : il ne reproduisait pas le geste réel | Filtre retiré : le serveur contrôle déjà le type réel. Test d'écran par un vrai dépôt (`dataTransfer`), en échec avec le filtre ; Chromium sur la pile complète : refus affiché avec sa raison |
| Huit signalements « Incorrect use of <label for> » dans Chrome | Ant Design pose l'attribut `for` d'une étiquette sur l'identifiant du champ, que les groupes de boutons placent sur un bloc `div`. axe-core ne contrôle pas le type d'élément visé. Présent depuis la 0.1.0 | Étiquettes sans `for` et nom accessible sur chaque groupe : 12 étiquettes dans cinq formulaires (enregistrement, file, fiche, nouvel utilisateur, nouveau contact). Test sur tous les écrans, en échec sans la correction |
| Trombone absent du registre après l'ajout d'un fichier depuis la fiche | La fiche ne prévenait pas le registre après un ajout | Test : la fiche prévient le registre avec le nouveau nombre de fichiers ; Chromium : 1 puis 2 fichiers sans rechargement |
| Annonce « Courrier enregistré avec son fichier » toujours affichée après d'autres gestes | Elle ne s'effaçait qu'en la fermant | Effacée au dépôt suivant et au rejet (proposition retenue par défaut, DECISIONS.md) ; Chromium : présente après l'enregistrement, absente après le dépôt suivant |

Non reproduit : la mention « Valeur livrée » absente sous les champs des Paramètres sur une capture de la recette. Ni l'enregistrement, ni un champ vidé, ni la saisie, ni le changement de champ ne la font disparaître dans le bac à sable. Aucun code modifié ; point à observer (liste de contrôle, point 6).

## Ce qui est simulé ou incomplet

Inchangé depuis la 0.2.0 : base `sql.js` et données fictives, aucun courrier ni scan réel ; dépôt par un assistant IA limité à environ 190 ko (E21) ; un fichier refusé s'affiche à l'écran de dépôt sans être gardé dans la file (E22).

## Trois questions RGPD

Aucune nouvelle donnée personnelle, aucune nouvelle finalité, aucun nouveau destinataire.

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation, chacune avec son résultat attendu. Copie complète ci-dessous. Procédure ordinaire : pas de `--no-cache`, pas de changement de propriétaire du volume, pas de migration.

Sur le PC, dans File Station : téléverser `courrier-v0_2_1.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh utilisateur@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_2_1.tar.gz
```

Attendu : le fichier listé, à la taille annoncée dans le message de livraison (environ 1,4 Mo).

```bash
sudo bash backup.sh
```

Attendu : `sauvegarde terminée, N sauvegardes conservées.`

```bash
sudo rm -rf backend frontend docs
```

```bash
sudo tar xzf courrier-v0_2_1.tar.gz --strip-components=1
```

```bash
ls backend frontend
```

Attendu : le contenu des deux dossiers.

```bash
sudo sh -c 'date; docker compose build; date'
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
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.2.1"},"meta":{"envelope":1,"version":"0.2.1"}}`.

```bash
sudo docker compose exec backend id -u
```

Attendu : `10001`.

Ensuite, dans le navigateur du PC : `https://192.0.2.10:8450`, recharger avec Ctrl + F5, zoom à 100 % (Ctrl + 0), puis la liste de contrôle.

## Liste de contrôle à l'écran

1. En bas du menu : `v0.2.1`. Les courriers `AC-2026-000001` à `AC-2026-000003` et `CPAS-2026-000001` sont toujours là.
2. « À enregistrer » : glisser `scan-fictif.tif` dans le cadre. Le cadre rouge « Fichiers refusés » affiche « Fichier TIFF refusé : réglez le copieur pour produire des PDF. ».
3. Déposer `courrier-fictif.pdf`, l'enregistrer (le bandeau vert annonce `AC-2026-000004`), puis déposer `lettre-fictive.png` : le bandeau vert disparaît. Rejeter ensuite l'image avec le motif « Essai de recette ».
4. Registre : ouvrir `AC-2026-000004`, glisser `lettre-fictive.png` dans « Ajouter un fichier à ce courrier ». Sans fermer la fiche ni recharger, la ligne de `AC-2026-000004` derrière la fiche passe à un trombone suivi de « 2 ».
5. F12, onglet « Issues » : ouvrir successivement « Enregistrer un courrier », « À enregistrer », une fiche, Utilisateurs › Créer et Contacts › Nouveau contact. Aucun signalement « Incorrect use of <label for=FORM_ELEMENT> ». Fermer F12.
6. Paramètres : enregistrer sans rien changer. La mention « Valeur livrée : 50 Mo » reste sous le premier champ, « Valeur livrée : 5 Mo » sous le second. Si elle disparaît, faire une capture et noter l'heure.

## Retour arrière

Rejouer les étapes de la mise à jour avec `courrier-v0_2_0.tar.gz`, restée dans le dossier. Aucune base à restaurer, aucun changement de propriétaire.

## Points ouverts

- Mention « Valeur livrée » : à observer au point 6.
- Écarts E16 à E22 inchangés (`ECARTS-CDC.md`), dont les décisions à soumettre à Renaud (E16, E17, E19, E20).
- Note de version affichée aux utilisateurs à construire (E18).
- Notification par courriel de NIXUS toujours en panne.

## Liste de contrôle de la version (standard, section 18)

| Point | État |
| --- | --- |
| Aucune dépendance nouvelle, versions majeures inchangées | Conforme |
| Composants d'Ant Design, identité visuelle | Conforme |
| Données, API, MCP, migrations | Inchangés |
| Tout texte en FR et NL | Conforme, tests de parité ; aucun texte nouveau |
| Suites entières, 0 échec ; tests des corrections, cas de refus compris | Conforme ; preuves d'échec jouées |
| Grille de sécurité | `docs/SECURITE.md` ; deux contrôles passés de « non joué » à « conforme » avec les relevés de NIXUS |
| Trois questions RGPD | Aucune nouveauté |
| Documentation | Suivi, journal des déploiements, grille ; aucune documentation fonctionnelle touchée, le comportement décrit était celui attendu |
| Nouveau numéro, archive vérifiée, commandes NIXUS | Conforme |
| Déploiement et recette sur NIXUS | À faire |
