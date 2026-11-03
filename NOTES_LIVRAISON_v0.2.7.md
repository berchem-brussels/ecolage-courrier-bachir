# Notes de livraison, version 0.2.7 du 03/11/2026

## Périmètre

Aide par écran, première moitié (standard v3.3, section 13.1), reprise du gabarit 1.3.0 et adaptée aux rôles par entité :
- 14 fiches d'aide, une par écran du menu, FR et NL : 40 procédures, 22 questions propres aux écrans ;
- bouton « Aide » dans l'en-tête de chaque écran, qui ouvre la fiche dans un panneau latéral ;
- centre d'aide avec parcours par rôle, recherche plein texte, impression du mode d'emploi complet ;
- explication de chaque champ derrière l'icône « ? » : 79 explications pour 91 champs ;
- `autoComplete` sur tous les champs de saisie, champ de fichier du cadre de dépôt nommé (E23 en partie).

Sans migration, aucune dépendance changée. Les repères numérotés et les captures annotées arrivent en 0.2.8.

Les adresses, ports et dossiers de ce document sont des valeurs d'exemple (GITHUB.md, section 6). Les valeurs du serveur d'acceptance figurent dans le message de livraison.

## Cause racine et contrôle

| Point | Cause | Contrôle |
| --- | --- | --- |
| Contenu d'un panneau d'aide fermé resté dans la page | Le panneau garde son contenu après fermeture ; il aurait doublé les identifiants du centre d'aide | Contenu retiré à la fermeture, identifiants posés seulement dans le centre d'aide ; constaté et corrigé par le parcours réel dans Chromium |
| Page d'aide écrite en dur | Guide et sept questions dans le fichier de traduction, sans lien avec les écrans | Remplacée par les fiches, une par écran, comparées aux routes du menu par un test bloquant |
| Explications de champ présentes seulement sur la connexion et les tickets | Écart E33 | 79 explications, un test refuse tout champ nommé sans infobulle, toute clé inconnue, toute explication de moins de 12 caractères ou inutilisée |
| Une valeur locale dans une explication | Un exemple de code postal propre à la commune | Le contrôle de portabilité l'a refusé ; remplacé par un exemple neutre |
| Remarques de Chrome sur les formulaires (E23) | Champs de saisie sans `autocomplete`, champ de fichier sans `id` ni `name` | Posés partout et contrôlés par un test statique ; les 10 remarques sur les titres de groupes de boutons restent |

## Ce qui est simulé ou incomplet

- Ni repère numéroté ni capture annotée des écrans, ni script Playwright (E39) : 0.2.8. Pas de FAQ locale en base : 0.2.8.
- E23 : mon Chromium ne reproduit pas les remarques d'information de Chrome, même sur la 0.2.6 qui en avait 20 sur votre poste ; le relevé se fait dans Chrome à la recette (point 9 de la liste de contrôle).
- Textes néerlandais rédigés par Claude : à relire par un traducteur.
- Les fiches décrivent l'application telle qu'elle est ; le courrier attribué à un service (accueil des agents) n'existe pas encore et la fiche d'accueil ne le promet qu'au futur.
- Écarts E38 et E39 dans `ECARTS-CDC.md`.

## Trois questions RGPD

1. Quelles données nouvelles ? Aucune : l'aide est du texte livré avec l'interface, elle ne lit ni n'écrit aucune donnée personnelle.
2. Pour quelle finalité ? Former les personnes qui utilisent l'application et réduire les erreurs de saisie.
3. Qui y accède ? Toute personne connectée lit les fiches. Aucune consultation de l'aide n'est journalisée. Les textes ne contiennent ni nom de personne ni donnée de courrier.

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation. Copie complète ci-dessous. Pas de `--no-cache` : aucune dépendance ne change. Pas de migration.

Sur le PC, dans File Station : téléverser `courrier-v0_2_7.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh administrator@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_2_7.tar.gz
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
sudo tar xzf courrier-v0_2_7.tar.gz --strip-components=1
```

```bash
ls backend frontend
```

```bash
sudo sh -c 'date; docker compose build; date'
```

Attendu : aucune ligne `ERROR` ; `naming to docker.io/library/courrier-backend` et `courrier-frontend`. Prévoir de 10 à 15 minutes : le NAS charge lentement les images de base.

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

Attendu : `[APP] API 0.2.7 sur le port 3001`, sans nouvelle ligne de migration.

```bash
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.2.7"},"meta":{"envelope":1,"version":"0.2.7"}}`.

Ensuite, dans le navigateur du PC : l'adresse de l'application, Ctrl + F5, zoom à 100 % (Ctrl + 0), puis la liste de contrôle.

## Liste de contrôle à l'écran

1. Au bas du menu : `v0.2.7`. Dans l'en-tête, le bouton « Aide » est à gauche de « Signaler ».
2. Sur « Registre des entrées », cliquer sur « Aide » : un panneau s'ouvre à droite, titré « Mode d'emploi et FAQ », avec la fiche « Registre des entrées », les étiquettes de rôle « Secrétariat » et « Gestionnaire du registre », la liste des zones, puis « Comment faire » avec quatre procédures et les questions fréquentes.
3. Déplier « Retrouver un courrier » : quatre étapes, une ligne « Résultat : » et une ligne « Si ça ne marche pas : ». Les noms de boutons (« Rechercher », « Toutes ») sont en gras entre guillemets, sans accolades.
4. Cliquer sur « Mode d'emploi complet » : la page « Mode d'emploi et FAQ » s'ouvre à la fiche du registre.
5. Dans le centre d'aide, le choix « Parcours » est sur « Administrateur » (neuf fiches : Accueil, Utilisateurs, Entités et registres, Services, Types de courrier, Paramètres, Tickets, Mode d'emploi et FAQ, Accessibilité). Choisir « Tout le mode d'emploi » : quatorze fiches. Choisir « Secrétariat » : sept fiches.
6. Taper « recommandé » dans « Rechercher » : il reste les fiches qui en parlent. Taper « zzzzzz » : « Aucune fiche ne correspond à la recherche. »
7. Cliquer sur « Imprimer le mode d'emploi » : un nouvel onglet s'ouvre avec toutes les fiches dépliées et la fenêtre d'impression. La fermer (Annuler).
8. Sur « Enregistrer un courrier » : chaque champ a une icône « ? ». Survoler celle de « Numéro du recommandé » ou « Objet » : une explication concrète s'affiche. Même chose sur Utilisateurs › Créer et sur Paramètres.
9. Remarques de Chrome (E23) : ouvrir les outils de développement (F12), onglet « Issues », puis recharger et ouvrir « Enregistrer un courrier », « Utilisateurs » › « Créer », « Paramètres » et « Tickets » › « Signaler ». Relever le nombre de remarques et leur type. Attendu : plus aucune remarque « autocomplete » ni « id or name » ; les remarques « No label associated with a form field » peuvent rester.
10. En néerlandais : le bouton s'appelle « Help », le panneau « Handleiding en FAQ », la fiche et les explications sont en néerlandais. Remettre FR.

## Retour arrière

Rejouer la mise à jour avec `courrier-v0_2_6.tar.gz`, restée dans le dossier. Aucune migration : aucune base à restaurer.

## Dépôt GitHub

Procédure de GITHUB.md, section 5, après la recette : branche `version/v0.2.7`, archive `courrier-v0_2_7.tar.gz` dans Téléchargements (si le navigateur l'a rangée ailleurs, la copier d'abord et vérifier son empreinte), demande de fusion `v0.2.7`, travail « tests » vert, étiquette `v0.2.7`, publication avec l'archive. Les commandes GitHub se tapent dans PowerShell sur le PC, après `exit` de la session SSH.

## Points ouverts

- Relevé de Chrome (point 9) à transmettre à Claude pour clore E23.
- Alerte Dependabot n° 29 (1 modérée) signalée par GitHub : à examiner avant la 0.2.8 (E38).
- Inscription d'application Entra ID, toujours à demander (recette réelle de la 0.2.5).
- Informer Renaud : restriction des captures de tickets (E35), garde-fou sur l'écran déclaré (E36), limite nginx du gabarit (E29, clos), bouton « Tester » (E32).
- Notification par courriel de NIXUS toujours en panne.

## Liste de contrôle de la version (standard, section 18)

| Point | État |
| --- | --- |
| Versions majeures inchangées | Oui |
| Données, API, MCP, migrations | Aucune migration, aucune route, aucun outil MCP : l'aide est du code livré avec l'interface |
| Tout texte en FR et NL | Conforme (parité contrôlée par `i18n.test.ts`, fiches et explications comparées en FR et NL) |
| Suites entières, 0 échec ; test de non-régression | Serveur 110, écrans 101 (un test de captures ignoré hors contrôle strict) ; preuves d'échec dans `docs/SECURITE.md` |
| Grille de sécurité | `docs/SECURITE.md` mise à jour |
| Trois questions RGPD | Ci-dessus |
| Nouveau numéro, archive vérifiée, commandes NIXUS | Conforme |
| Déploiement et recette sur NIXUS | À faire |
