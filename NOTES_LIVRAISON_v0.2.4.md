# Notes de livraison, version 0.2.4 du 27/10/2026

## Périmètre

Correction d'un défaut de la 0.2.3 relevé à sa recette sur NIXUS. Aucune fonction nouvelle, aucune migration de base, aucune dépendance changée par rapport à la 0.2.3, aucun changement du serveur hors son numéro de version.

Les adresses, ports et dossiers de ce document sont des valeurs d'exemple (GITHUB.md, section 6). Les valeurs du serveur d'acceptance figurent dans le message de livraison et dans les fichiers du projet Claude.

## Cause racine et contrôle

| Défaut | Cause | Contrôle |
| --- | --- | --- |
| Sélecteur de date en anglais : « Select date », `10/27/2026`, calendrier commençant le dimanche, en français comme en néerlandais | `antd/locale/fr_FR.js` est un fichier CommonJS qui renvoie vers `lib/`. Avec `vite` 8, `ConfigProvider` n'a pas reçu la langue et est resté en anglais, alors que `vite` 5 lisait ce fichier. Le mécanisme exact n'est pas vérifié dans le code du moteur ; le correctif est établi par essai | `antd/es/locale/fr_FR` et `nl_NL` : date `27/10/2026` en français, `27-10-2026` en néerlandais, calendrier dans la langue, semaine commençant le lundi |
| Les tests n'ont pas vu le défaut | Vitest charge les modules par Node, qui lit le fichier CommonJS sans erreur ; le défaut n'apparaît que dans l'interface construite par `vite` | Nouveau test `imports.test.ts` : interdit les imports `antd/locale` et `antd/lib`. Il contrôle la cause et non le résultat ; en échec avec l'import de la 0.2.3 |
| Contrôle visuel de la 0.2.3 incomplet | Le compte de contrôle n'avait pas de rôle de secrétariat : le formulaire d'enregistrement n'a pas été affiché | Pour la 0.2.4, textes de 11 pages et 22 captures comparés à la 0.2.2 avec le rôle de secrétariat, en français et en néerlandais : aucune différence |
| Test du dépôt en échec après un `npm run build` | Il signalait `tsconfig.tsbuildinfo`, fichier de construction déjà exclu par `.gitignore` | Motif retiré du test ; 82 tests serveur sur 82 avec ce fichier présent |

## Ce qui est simulé ou incomplet

Inchangé : base `sql.js` et données fictives, aucun courrier ni scan réel ; dépôt par un assistant IA limité à environ 190 ko (E21) ; fichier refusé non gardé dans la file (E22). Alertes CodeQL sur `pieces.js` ouvertes (E25). Le contrôle de la 0.2.4 compare les pages en français et en néerlandais avec un seul compte ; le rôle d'agent, de responsable de service et d'auditeur n'y figure pas.

## Trois questions RGPD

Aucune nouvelle donnée personnelle, aucune nouvelle finalité, aucun nouveau destinataire.

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation, chacune avec son résultat attendu. Copie complète ci-dessous. Pas de `--no-cache` : aucune dépendance ne change par rapport à la 0.2.3. Pas de changement de propriétaire du volume, pas de migration.

Sur le PC, dans File Station : téléverser `courrier-v0_2_4.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh utilisateur@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_2_4.tar.gz
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
sudo tar xzf courrier-v0_2_4.tar.gz --strip-components=1
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

Attendu : les deux conteneurs `Up (healthy)` ; `courrier-web` peut afficher `health: starting` pendant la première minute.

```bash
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.2.4"},"meta":{"envelope":1,"version":"0.2.4"}}`.

Ensuite, dans le navigateur du PC : `https://192.0.2.10:8450`, recharger avec Ctrl + F5, zoom à 100 % (Ctrl + 0), puis la liste de contrôle.

## Liste de contrôle à l'écran

1. En bas du menu : `v0.2.4`. Les courriers `AC-2026-000001` à `AC-2026-000005` sont toujours là.
2. Menu « Enregistrer un courrier » : le champ « Reçu le » affiche `27/10/2026` (jour avant mois). Cliquer dans le champ : le calendrier est en français (« oct. 2026 », « lu ma me je ve sa di »).
3. Menu « À enregistrer » : le fichier `Pièce fictive.pdf` déposé pendant la recette de la 0.2.3 est toujours dans la file. Le champ « Reçu le » du formulaire affiche `27/10/2026`. Renseigner l'expéditeur, l'objet et le type, puis enregistrer : le bandeau vert annonce `AC-2026-000006`.
4. Registre : ouvrir `AC-2026-000006`. Le fichier s'appelle `Pièce fictive.pdf`, sans caractères déformés comme « PiÃ¨ce ».
5. Changer la langue en NL avec le sélecteur de l'en-tête : le champ « Reçu le » affiche `27-10-2026`, le calendrier est en néerlandais. Remettre FR.

## Retour arrière

Rejouer les étapes de la mise à jour avec `courrier-v0_2_2.tar.gz`, restée dans le dossier : la 0.2.3 a le défaut corrigé ici. Aucune base à restaurer.

## Dépôt GitHub

La 0.2.3 n'a pas été publiée : la 0.2.4 la remplace sur GitHub. La protection de `main` interdit tout envoi direct : cette version passe par une branche et une demande de fusion (GITHUB.md, section 5). Avant la première commande, supprimer du dossier du dépôt le fichier `docs\essais\Pièce fictive.pdf` créé pendant la recette de la 0.2.3 : il n'appartient pas au dépôt. Archive attendue dans Téléchargements : `courrier-v0_2_4.tar.gz`. Branche : `version/v0.2.4`. Le travail « tests » doit être vert avant la fusion. Les deux demandes de fusion de Dependabot (#1 et #2) deviennent sans objet une fois cette version fusionnée.

## Points ouverts

- Accord de Renaud sur `@vitejs/plugin-react` 6, non nommé dans le courriel, et réponse sur `npm audit fix` de la 0.2.2 (E26).
- Standard à mettre à jour par Renaud : sections 4.2, 4.3, 4.4 et liste de la section 18 (E27).
- Alertes CodeQL à revérifier après la mise en production (E25).
- Écarts E21 à E27 (`ECARTS-CDC.md`), dont E23 au début de la 0.3.0.
- Notification par courriel de NIXUS toujours en panne.

## Liste de contrôle de la version (standard, section 18)

| Point | État |
| --- | --- |
| Versions majeures inchangées | Non : `vite` 8, `@vitejs/plugin-react` 6 et `multer` 2, voir E27 |
| Données, API, MCP, migrations | Inchangés |
| Tout texte en FR et NL | Conforme ; aucun texte nouveau ; textes de 11 pages comparés à la 0.2.2 |
| Suites entières, 0 échec ; test de non-régression | Conforme : serveur 82, écrans 60 ; `imports.test.ts` en échec sans le correctif |
| Grille de sécurité | `docs/SECURITE.md` mise à jour |
| Trois questions RGPD | Aucune nouveauté |
| Nouveau numéro, archive vérifiée, commandes NIXUS | Conforme |
| Déploiement et recette sur NIXUS | À faire |
