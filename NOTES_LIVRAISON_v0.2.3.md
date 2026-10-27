# Notes de livraison, version 0.2.3 du 27/10/2026

Version installée sur NIXUS le 27/10/2026 et non publiée sur GitHub : sa recette a relevé un défaut du sélecteur de date, corrigé dans la 0.2.4 (`NOTES_LIVRAISON_v0.2.4.md`).

## Périmètre

Mise à jour de dépendances, avec l'accord de Renaud du 27/10/2026 pour `multer` et `vite`. Aucune fonction nouvelle, aucune migration de base, aucun changement dans `src/`.

Les adresses, ports et dossiers de ce document sont des valeurs d'exemple (GITHUB.md, section 6). Les valeurs du serveur d'acceptance figurent dans le message de livraison et dans les fichiers du projet Claude.

## Cause racine et contrôle

| Sujet | Cause | Contrôle |
| --- | --- | --- |
| 10 alertes hautes de Dependabot sur le serveur | `multer` 1.x, génération dépréciée par l'éditeur : dénis de service (récursion non contrôlée, nettoyage incomplet, épuisement de ressources, exception non gérée, fuites mémoire, noms de champs multipart trop imbriqués). `npm audit` ne les signalait pas, cause non établie | `multer` 2.5.0 : 82 tests serveur sur 82, audit à 0, 15 paquets de moins |
| 15 alertes Dependabot sur l'interface, toutes sur les outils de développement | `vite` 5.4.21, dernière 5.x, sans correctif : il n'existe qu'en `vite` 8.3.5 | `vite` 8.3.5, `@vitejs/plugin-react` 6.1.2 (la 4.7.0 refuse `vite` 8), `vitest` 4.1.12 : typage, construction, 58 tests d'écrans et accessibilité à 0 erreur, audit complet à 0 |
| `npm install` de l'interface impossible | npm 10 s'arrête sur une erreur interne (`edgesOut`), écart E19 | Verrou de l'interface écrit par npm 11 ; `npm ci` sous npm 10 le relit et reconstruit (mesuré) ; les images gardent npm 10 |

Le verrou de l'interface perd 126 paquets (Rollup, esbuild 0.21, chaîne Babel de l'ancien plugin) et en gagne 2 (`@vitest/mocker`, une liaison `rolldown`). Trente et un paquets changent de version : `vite`, `@vitejs/plugin-react`, `vitest`, six `@vitest/*`, `rolldown` et ses liaisons, ainsi que `chai`, `tinyrainbow`, `picomatch`, `@types/estree` et `@jridgewell/sourcemap-codec`. Ni `antd`, ni `react`, ni `typescript` ne changent.

`vite` 8 demande Node 20.19 ou plus : l'image du serveur web est construite sous Node 20.19.5, et la CI sous Node 20.

## Nom des fichiers déposés

`multer` 2.5.0 passe le test des noms accentués (`Pièce n°1 « test ».pdf`) avec la relecture en UTF-8 déjà en place. Le code n'est pas modifié. Le point 4 de la liste de contrôle le vérifie avec un vrai navigateur.

## Ce qui est simulé ou incomplet

Inchangé depuis la 0.2.2 : base `sql.js` et données fictives, aucun courrier ni scan réel ; dépôt par un assistant IA limité à environ 190 ko (E21) ; fichier refusé non gardé dans la file (E22). Le contrôle visuel du bac à sable a couvert la connexion et huit pages d'un administrateur ; le registre, la fiche et la file « À enregistrer » ne s'y affichent qu'avec un rôle de secrétariat et se contrôlent à la recette. Les 10 alertes CodeQL sur `pieces.js` restent ouvertes (E25).

## Trois questions RGPD

Aucune nouvelle donnée personnelle, aucune nouvelle finalité, aucun nouveau destinataire.

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation, chacune avec son résultat attendu. Copie complète ci-dessous. `--no-cache` est demandé : des dépendances changent. Pas de changement de propriétaire du volume, pas de migration. La construction dure environ 11 minutes.

Sur le PC, dans File Station : téléverser `courrier-v0_2_3.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh utilisateur@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_2_3.tar.gz
```

Attendu : le fichier listé, à la taille annoncée dans le message de livraison.

```bash
sudo bash backup.sh
```

Attendu : `sauvegarde terminée, N sauvegardes conservées.`

```bash
sudo rm -rf backend frontend docs
```

```bash
sudo tar xzf courrier-v0_2_3.tar.gz --strip-components=1
```

```bash
ls backend frontend
```

Attendu : le contenu des deux dossiers.

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

Attendu : les deux conteneurs `Up (healthy)` ; `courrier-web` peut afficher `health: starting` pendant la première minute.

```bash
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.2.3"},"meta":{"envelope":1,"version":"0.2.3"}}`.

```bash
sudo docker compose exec backend id -u
```

Attendu : `10001`.

Ensuite, dans le navigateur du PC : `https://192.0.2.10:8450`, recharger avec Ctrl + F5, zoom à 100 % (Ctrl + 0), puis la liste de contrôle.

## Liste de contrôle à l'écran

1. En bas du menu : `v0.2.3`. Les courriers `AC-2026-000001` à `AC-2026-000005` et `CPAS-2026-000001` sont toujours là.
2. Registre : ouvrir `AC-2026-000004`. Ses deux fichiers s'affichent dans le lecteur et s'ouvrent.
3. « À enregistrer » : glisser `scan-fictif.tif` dans le cadre. Le cadre rouge « Fichiers refusés » affiche « Fichier TIFF refusé : réglez le copieur pour produire des PDF. ».
4. Copier `courrier-fictif.pdf` sous le nom `Pièce fictive.pdf`, le déposer dans le cadre, puis l'enregistrer (le bandeau vert annonce `AC-2026-000006`). Dans le registre, ouvrir `AC-2026-000006` : le fichier s'appelle `Pièce fictive.pdf`, sans caractères déformés comme « PiÃ¨ce ».
5. Menu Utilisateurs, Entités et registres, Services, Paramètres : chaque écran s'affiche sans message d'erreur.

## Retour arrière

Rejouer les étapes de la mise à jour avec `courrier-v0_2_2.tar.gz`, restée dans le dossier. Aucune base à restaurer.

## Dépôt GitHub

La protection de `main` interdit tout envoi direct : cette version passe par une branche et une demande de fusion (GITHUB.md, section 5). Les commandes sont données une à une dans la conversation. Archive attendue dans Téléchargements : `courrier-v0_2_3.tar.gz`. Branche : `version/v0.2.3`. Le travail « tests » doit être vert avant la fusion. Les deux demandes de fusion de Dependabot (#1 et #2) deviennent sans objet une fois cette version fusionnée.

## Points ouverts

- Accord de Renaud sur `@vitejs/plugin-react` 6, non nommé dans le courriel, et réponse sur `npm audit fix` de la 0.2.2 (E26).
- Standard à mettre à jour par Renaud : sections 4.2, 4.3, 4.4 et liste de la section 18 (E27).
- Alertes CodeQL à revérifier après la mise en production (E25).
- Écarts E21 à E27 (`ECARTS-CDC.md`), dont E23 au début de la 0.3.0.
- Notification par courriel de NIXUS toujours en panne.

## Liste de contrôle de la version (standard, section 18)

| Point | État |
| --- | --- |
| Versions majeures inchangées | Non : `vite` 8 et `@vitejs/plugin-react` 6 au lieu de Vite 5 et plugin 4, `multer` 2 ; accord de Renaud du 27/10/2026, plugin non nommé (E27) |
| Données, API, MCP, migrations | Inchangés |
| Tout texte en FR et NL | Conforme, aucun texte nouveau |
| Suites entières, 0 échec | Conforme : serveur 82, écrans 58 |
| Grille de sécurité | `docs/SECURITE.md` mise à jour |
| Trois questions RGPD | Aucune nouveauté |
| Nouveau numéro, archive vérifiée, commandes NIXUS | Conforme |
| Déploiement et recette sur NIXUS | À faire |
