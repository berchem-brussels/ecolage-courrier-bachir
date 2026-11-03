# Notes de livraison, version 0.2.6 du 03/11/2026

## Périmètre

Tickets de l'application (standard v3.3, section 13.5), repris du gabarit 1.3.0 et adaptés aux rôles par entité : bouton « Signaler » dans l'en-tête de chaque écran, écran Tickets (menu Aide), file IT traitée par l'administrateur, file métier traitée par le gestionnaire du registre de l'entité du ticket, priorité ITIL et délais, notes internes, compteurs, 11 outils MCP, réglages dans Administration › Paramètres › Tickets. Migration 007. Aucune dépendance changée. Aucune capture dans un ticket sur les écrans qui affichent du courrier.

Les adresses, ports et dossiers de ce document sont des valeurs d'exemple (GITHUB.md, section 6). Les valeurs du serveur d'acceptance figurent dans le message de livraison.

## Cause racine et contrôle

| Point | Cause | Contrôle |
| --- | --- | --- |
| Le gabarit refuserait une capture de ticket de plus de 0,7 Mo | `nginx.conf` du gabarit limite tout `/api/` à 1 Mo, une capture de 2 Mo pèse environ 2,8 Mo encodée en base64 | Bloc `/api/tickets` à 4 Mo, `express.json` à 4 Mo sur cette route seulement ; test du contenu de `nginx.conf` et capture de 2 Mo acceptée, plus grande refusée (413) |
| Les rôles du gabarit sont globaux, ceux de courrier valent pour une entité | Un gestionnaire de l'AC ne doit pas voir les questions du CPAS ; l'administrateur n'a pas droit au contenu du courrier | Le ticket porte l'entité ; droit de file tenu dans l'entité du ticket ; 11 contrôles retirés un à un, tous détectés (`docs/SECURITE.md`) |
| Une capture peut montrer du courrier | L'administrateur de la file IT lit les captures | Aucune capture sur le registre, à enregistrer, enregistrer, consultations, côté écran et côté serveur (E35) ; garde-fou, pas garantie (E36) |
| Un transfert retire l'accès à son auteur | La réponse relisait le ticket sous les droits de l'auteur | Réponse limitée à l'état du transfert, tiroir fermé ; test dédié |
| Test statique des requêtes SQL | La liste des interpolations permises ne connaissait pas les constantes des tickets | Liste complétée par des constantes du code, test toujours en échec pour toute valeur |

## Ce qui est simulé ou incomplet

- Pas de notification par courriel des tickets (étape 10). Aucune conservation appliquée aux tickets ni aux captures (E37).
- Le serveur refuse la capture d'après l'écran déclaré par l'interface (E36).
- Explication de champ limitée à la connexion et aux tickets (E33, 0.2.7). Pas de FAQ locale (0.2.8).
- Écarts E35 à E37 dans `ECARTS-CDC.md`.

## Trois questions RGPD

1. Quelles données nouvelles ? Le texte d'un ticket, son entité, l'écran, la version, le navigateur, la dernière erreur de l'application, une capture facultative, et le nom du demandeur déjà connu.
2. Pour quelle finalité ? Traiter les incidents, bugs, questions et souhaits sur l'application.
3. Qui y accède ? Le demandeur ; les traitants de la file concernée (administrateur pour la file IT, gestionnaires du registre de l'entité pour la file métier). Aucune capture de courrier n'est proposée. Durée de conservation : à fixer avec le DPO (étape 20).

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation. Copie complète ci-dessous. Pas de `--no-cache` : aucune dépendance ne change ; `nginx.conf` change, la construction le reprend.

Sur le PC, dans File Station : téléverser `courrier-v0_2_6.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh administrator@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_2_6.tar.gz
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
sudo tar xzf courrier-v0_2_6.tar.gz --strip-components=1
```

```bash
ls backend frontend
```

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
sudo docker logs courrier-api --tail 30
```

Attendu : la ligne `[DB] Migration 007_tickets appliquée`.

```bash
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.2.6"},"meta":{"envelope":1,"version":"0.2.6"}}`.

Ensuite, dans le navigateur du PC : l'adresse de l'application, Ctrl + F5, zoom à 100 % (Ctrl + 0), puis la liste de contrôle.

## Liste de contrôle à l'écran

1. Au bas du menu : `v0.2.6`. Les courriers `AC-2026-000001` à `AC-2026-000006` sont toujours là. Connexion, Paramètres › Connexion et Utilisateurs sont inchangés.
2. Dans l'en-tête, à côté de « Simple / Complet » : le bouton « Signaler ». Dans le menu, groupe Aide : « Tickets ».
3. Sur « Registre des entrées », cliquer sur « Signaler » : le formulaire s'ouvre avec « Écran joint automatiquement : Registre des entrées » et, en bas, le message « Aucune capture sur cet écran, car il affiche du courrier… », sans champ de fichier.
4. Choisir « Question métier », encoder le titre « Essai de recette 0.2.6 (fictif) », laisser le reste, cliquer sur « Envoyer » : un message vert annonce `TCK-2026-00001`. Avec deux entités, un choix « AC » ou « CPAS » est obligatoire ; choisir AC.
5. Sur « Contacts », « Signaler », type « Incident » : le champ « Capture d'écran (facultative) » est présent avec l'avertissement. Titre « Essai incident (fictif) », sans capture, envoyer : `TCK-2026-00002`.
6. Menu « Tickets » : les deux tickets sont listés (référence, titre, type, entité, priorité, statut). Cliquer sur le premier : le tiroir montre le statut, l'entité AC, la file « Métier » ; l'historique « Ticket créé ».
7. Paramètres › carte « Tickets » : rôles de la file métier (« Gestionnaire du registre » coché), de la file IT (« Administrateur » coché), délais P1 à P4 (1 et 8, 4 et 24, 8 et 72, 24 et 240), réouverture 14 jours. Survoler un « ? » : une explication s'affiche. Ne rien modifier.
8. En néerlandais : « Melden », « Tickets », carte « Tickets » ; remettre FR.
9. Avec le compte administrateur, l'écran « Tickets » montre les deux tickets (vous les avez signalés) mais aucun compteur de traitement pour la question métier : la file IT (l'incident) vous revient, la file métier revient aux gestionnaires du registre de l'entité. Aucun compte de l'instance d'acceptance n'a ce rôle.
10. Pour jouer la file métier (facultatif) : Utilisateurs › « Modifier les rôles » sur votre compte, remplacer « Secrétariat » par « Gestionnaire du registre » pour l'AC, enregistrer. Ce rôle tient aussi le registre. Sur « Tickets », les compteurs apparaissent, la question est prise en charge, résolue avec un motif (le bouton reste inactif sans motif). Remettre ensuite « Secrétariat » si vous le souhaitez.

## Retour arrière

Rejouer la mise à jour avec `courrier-v0_2_5.tar.gz`, restée dans le dossier. La migration 007 ajoute deux tables sans rien supprimer : la 0.2.5 les ignore, aucune base à restaurer.

## Dépôt GitHub

Procédure de GITHUB.md, section 5, après la recette : branche `version/v0.2.6`, archive `courrier-v0_2_6.tar.gz` dans Téléchargements (si le navigateur l'a rangée ailleurs, la copier d'abord), demande de fusion `v0.2.6`, travail « tests » vert, étiquette `v0.2.6`, publication avec l'archive. Les commandes GitHub se tapent dans PowerShell sur le PC, après `exit` de la session SSH.

## Points ouverts

- Inscription d'application Entra ID, toujours à demander (recette réelle de la 0.2.5).
- Informer Renaud : restriction des captures (E35), garde-fou sur l'écran déclaré (E36), limite nginx de 1 Mo du gabarit corrigée par un bloc dédié (E29).
- Notification par courriel de NIXUS toujours en panne.

## Liste de contrôle de la version (standard, section 18)

| Point | État |
| --- | --- |
| Versions majeures inchangées | Oui |
| Données, API, MCP, migrations | Migration 007 ; 11 routes de tickets et de réglages, 11 outils MCP ; 72 routes, 64 outils exposés |
| Tout texte en FR et NL | Conforme (parité contrôlée par `i18n.test.ts`) |
| Suites entières, 0 échec ; test de non-régression | Serveur 110, écrans 78 ; preuves d'échec dans `docs/SECURITE.md` |
| Grille de sécurité | `docs/SECURITE.md` mise à jour |
| Trois questions RGPD | Ci-dessus |
| Nouveau numéro, archive vérifiée, commandes NIXUS | Conforme |
| Déploiement et recette sur NIXUS | À faire |
