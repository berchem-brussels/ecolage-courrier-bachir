# Notes de livraison, version 0.2.0 du 20/10/2026

## Périmètre

Étape 2 du planning : fichiers du courrier entrant et journal des consultations.

- File « À enregistrer » par entité : dépôt de fichiers PDF, JPEG et PNG, aperçu à côté du formulaire, passage au fichier suivant, enregistrement qui joint le fichier au numéro, rejet avec motif.
- Type vérifié sur le contenu ; TIFF refusé avec sa raison (D-24) ; 50 Mo au plus par fichier, réglable (D-23).
- Fiche du courrier avec ses fichiers dans un lecteur, ouverture, téléchargement, ajout d'un fichier.
- Journal des consultations, lisible par l'auditeur de l'entité.
- Administration › Paramètres.
- API et outils MCP des fichiers, du journal et des paramètres.
- Serveur sous `appuser` (10001).

Hors périmètre : relève des boîtes partagées et dépôt des copieurs, doublons, purge de la file (étape 12) ; retrait d'un fichier joint (étape 6) ; antivirus, aperçu Office, découpe d'un lot de scans (décisions D-08, D-11, D-05) ; conservation et anonymisation (étape 20).

## Cause racine des défauts corrigés

| Défaut | Cause | Contrôle |
| --- | --- | --- |
| Thème sombre : bouton choisi d'un groupe de boutons peu lisible (présent depuis la 0.1.0) | Les boutons de choix prennent `colorPrimary`, la couleur de l'institution, sans la variante prévue pour le thème sombre | Couleur calculée relevée dans Chromium : `rgb(95, 184, 173)` en sombre, `rgb(0, 98, 101)` en clair ; contraste sur `#1f1f1f` de 2,3 à 7,02 |
| Nom accentué d'un fichier déformé (« PiÃ¨ce ») | `multer` 1.x lit le nom en latin-1 ; les navigateurs l'envoient en UTF-8 | Test `pieces.test.js` avec « Pièce n°1 « test ».pdf » |
| Navigation de la file sur trois lignes à 360 px | Bouton « Rejeter » avec son libellé dans la même ligne que les flèches | Capture à 360 px : une ligne, largeur de page 360 px |
| « Journal des consultations » coupé dans le menu | Libellé trop long pour 230 px | Menu « Consultations », titre complet dans la page |

## Ce qui est simulé ou incomplet

- Base `sql.js` et données fictives : aucun courrier ni aucun scan réel. Utiliser les fichiers fictifs de `docs/essais/` ou un document fictif.
- Rendu des pages d'un PDF dans l'aperçu : non observé dans le bac à sable, Chromium sans écran ne les dessine pas. Le lecteur s'ouvre dans le cadre et aucun refus de politique de sécurité n'apparaît. À vérifier au point 3 de la liste de contrôle.
- Construction des images Docker et passage à `appuser` : non joués dans le bac à sable, Docker y est absent. À vérifier pendant le déploiement.
- Un fichier refusé s'affiche avec sa raison à l'écran de dépôt sans être gardé dans la file (écart E22).
- Dépôt par un assistant IA limité à environ 190 ko (écart E21).

## Trois questions RGPD

| Question | Réponse |
| --- | --- |
| Nouvelles données personnelles | Oui : les fichiers du courrier, qui peuvent contenir toute catégorie de données, y compris sensibles ; leur nom d'origine ; la personne qui a déposé ; le journal des consultations (personne, date, heure, courrier, fichier, canal) |
| Nouvelle finalité | Le journal des consultations sert au contrôle des accès (CG-003) ; les fichiers servent la finalité existante du traitement du courrier |
| Nouveau destinataire | Aucun : stockage dans le volume du serveur, aucun appel sortant. Un assistant IA connecté au MCP par la personne elle-même lit un fichier seulement à sa demande ; la lecture est journalisée |

À reporter dans l'analyse d'impact et le registre, menés en parallèle par le DPO. Aucune durée de conservation n'est encore appliquée aux fichiers ni au journal (étape 20).

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation, chacune avec son résultat attendu. Copie complète ci-dessous.

Points propres à cette version : construction en `--no-cache` (Dockerfile du serveur et dépendance modifiés) ; changement unique du propriétaire du volume de données, de 1000 à 10001, après la construction et avant le démarrage ; migration `005_pieces_consultations` au démarrage.

Sur le PC, dans File Station : téléverser `courrier-v0_2_0.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh utilisateur@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_2_0.tar.gz
```

Attendu : le fichier listé, à la taille annoncée dans le message de livraison (environ 1,4 Mo).

```bash
sudo bash backup.sh
```

Attendu : `sauvegarde terminée, N sauvegardes conservées.`, N proche du nombre de jours depuis le 13/10/2026.

```bash
sudo rm -rf backend frontend docs
```

Attendu : aucun message.

```bash
sudo tar xzf courrier-v0_2_0.tar.gz --strip-components=1
```

Attendu : aucun message.

```bash
ls backend frontend
```

Attendu : le contenu des deux dossiers.

```bash
sudo sh -c 'date; docker compose build --no-cache; date'
```

Attendu : aucune ligne `ERROR` ; `naming to docker.io/library/courrier-backend` et `courrier-frontend` ; deux dates pour mesurer la durée (12 min 21 s en 0.1.1, sans `--no-cache`).

```bash
sudo docker compose stop backend
```

Attendu : `Container courrier-api Stopped`.

```bash
sudo docker compose run --rm --no-deps --user root backend chown -R 10001:10001 /app/data
```

Attendu : aucune erreur. Commande à ne jouer qu'une fois, à cette version.

```bash
sudo docker compose run --rm --no-deps --user root backend ls -ln /app/data
```

Attendu : `app.db` et les autres entrées avec `10001 10001` comme propriétaire et groupe.

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

Attendu : `{"data":{"version":"0.2.0"},"meta":{"envelope":1,"version":"0.2.0"}}`.

```bash
sudo docker compose exec backend id -u
```

Attendu : `10001`.

```bash
sudo docker logs courrier-api --tail 20
```

Attendu : `[DB] Migration 005_pieces_consultations appliquée`, puis `[APP] API 0.2.0 sur le port 3001`.

Ensuite, dans le navigateur du PC : `https://192.0.2.10:8450`, recharger avec Ctrl + F5, zoom à 100 % (Ctrl + 0), puis la liste de contrôle. Les fichiers d'essai fictifs sont dans `docs/essais/` de l'archive et joints au message de livraison.

Après le point 4 de la liste de contrôle, sur NIXUS :

```bash
sudo bash backup.sh
```

```bash
sudo sh -c 'tar tzf "$(ls -t /srv/backups/courrier/courrier-*.tar.gz | head -1)" | grep "pieces/"'
```

Attendu : au moins une ligne `data/pieces/2026/10/<32 caractères>.pdf` : les fichiers déposés sont dans la sauvegarde.

## Liste de contrôle à l'écran

1. En bas du menu : `v0.2.0`. Dans le groupe Courrier : « À enregistrer » ; dans Administration : « Paramètres ».
2. Les courriers `AC-2026-000001` (annulé), `AC-2026-000002` et `CPAS-2026-000001` sont toujours là.
3. « À enregistrer », entité AC : déposer `courrier-fictif.pdf`. Le fichier s'affiche à gauche et le texte « Courrier fictif de test » est lisible dans l'aperçu.
4. Remplir le formulaire à droite et cliquer sur « Enregistrer et passer au suivant » : le numéro `AC-2026-000003` s'affiche, la file se vide.
5. Déposer `scan-fictif.tif` : il est refusé avec le message « Fichier TIFF refusé : réglez le copieur pour produire des PDF. ».
6. Déposer `lettre-fictive.png`, puis « Rejeter ce fichier » avec le motif « Essai de rejet » : la file se vide.
7. Registre des entrées : un trombone et « 1 » à côté de `AC-2026-000003`. Ouvrir sa fiche : le fichier s'affiche à côté des informations ; « Ouvrir dans un onglet » l'affiche en grand ; « Télécharger » l'enregistre.
8. Ouvrir la fiche de `AC-2026-000002` et glisser `lettre-fictive.png` dans « Ajouter un fichier à ce courrier » : l'image s'affiche dans la fiche.
9. Utilisateurs : créer « Auditeur Test » avec le rôle AC · Auditeur et un mot de passe généré, sans le montrer dans une capture. Dans une fenêtre privée, se connecter avec ce compte : arrivée sur « Journal des consultations · AC », lignes de l'essai visibles, sans objet ni nom de fichier ; le menu ne montre ni registre ni « À enregistrer ». Désactiver ensuite ce compte.
10. Paramètres : passer la taille maximale à 1 Mo, enregistrer, puis déposer un PDF de plus de 1 Mo : refus « Fichier trop volumineux. Taille maximale : 1 Mo ». Remettre 50 Mo.
11. Passer en néerlandais : menu « Te registreren », bouton « Registreren en naar het volgende ».
12. Passer en thème sombre : dans « Enregistrer un courrier », le choix « Courrier postal » est lisible (vert clair sur fond sombre).
13. Sur le smartphone ou en fenêtre étroite : la file s'affiche en une colonne, les flèches tiennent sur une ligne.

## Retour arrière

Rejouer les étapes de la mise à jour avec `courrier-v0_1_1.tar.gz`, restée dans le dossier, en remplaçant la commande de changement de propriétaire par :

```bash
sudo docker compose run --rm --no-deps --user root backend chown -R 1000:1000 /app/data
```

La base n'a pas à être restaurée : la migration 005 ajoute deux tables que la 0.1.1 ignore.

## Points ouverts

- Rendu des pages PDF à confirmer au point 3.
- Écarts E16 à E22 (`ECARTS-CDC.md`), dont les décisions à soumettre à Renaud : parseur eslint et Vite 8 de Vitest à inscrire au standard (E16, E17), montées de génération des outils de développement (E19), passage éventuel à `multer` 2.x (E20).
- Note de version affichée aux utilisateurs à construire (E18).
- Notification par courriel de NIXUS toujours en panne : une sauvegarde en échec ne serait signalée à personne.

## Liste de contrôle de la version (standard, section 18)

| Point | État |
| --- | --- |
| Aucune dépendance hors section 4, aucun `npm audit fix` | Conforme : `multer` est dans la section 4.2 |
| Versions majeures inchangées | Conforme |
| Composants d'Ant Design seulement | Conforme ; cadre et image natifs pour l'aperçu, qu'Ant Design n'offre pas |
| SQL écrit à la main, paramètres liés | Conforme, test statique |
| Identité visuelle | Conforme ; contraste du thème sombre corrigé |
| Routes et outils MCP pour toute ressource nouvelle | Conforme ; journal en lecture seule et paramètres en ressource unique, expliqués dans l'architecture |
| Schéma, rôle, propriété et audit sur toute écriture | Conforme |
| Migration numérotée sans perte | Conforme (005) |
| Contrat OpenAPI à jour | Conforme |
| Aucune valeur propre au pouvoir local dans le code | Conforme, test de portabilité |
| Tout texte en FR et NL | Conforme, tests de parité |
| Suites entières, 0 échec | Conforme |
| Parcours en FR, NL, 360, 768 et 1280 px | Conforme dans le bac à sable ; rendu PDF à confirmer |
| Grille de sécurité | `docs/SECURITE.md` ; deux contrôles « non joués » à faire sur NIXUS (`id -u`, fichiers dans la sauvegarde) |
| Trois questions RGPD | Traitées ci-dessus ; analyse d'impact par le DPO |
| Documentation technique FR, NL, EN | Mise à jour ; NL et EN à faire relire (E13) |
| Fiche fonctionnelle, mode d'emploi, FAQ, chatbot | Conforme |
| Note de version aux utilisateurs | Écart E18 |
| Nouveau numéro, archive vérifiée, commandes NIXUS | Conforme |
| Déploiement et recette sur NIXUS | À faire |
