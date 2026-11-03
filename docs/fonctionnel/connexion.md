# Connexion

Version 0.2.5. Ce document décrit ce que voit et fait chaque personne ; le détail technique est dans `docs/fr/SSO.md`.

## Pour un agent

- Mode « Comptes locaux » (par défaut) : saisir son adresse et son mot de passe, comme avant.
- Mode « Microsoft facultatif » : cliquer sur « Se connecter avec Microsoft », ou saisir son mot de passe.
- Mode « Microsoft obligatoire » : l'application s'ouvre directement avec le compte Microsoft déjà ouvert, sans rien saisir. Après « Se déconnecter », l'écran « Vous êtes déconnecté » reste affiché ; un clic sur « Se connecter avec Microsoft » reconnecte.
- Si l'écran dit qu'aucun compte actif ne correspond au compte Microsoft : demander à l'administrateur de l'application de créer ou d'activer le compte avec la même adresse.

## Pour l'administrateur

- Administration › Paramètres › Connexion : mode, annuaire, identifiant de l'application, secret, adresse publique, domaines. Le secret ne se réaffiche jamais ; laisser le champ vide garde la valeur enregistrée.
- Administration › Utilisateurs : la colonne « Accès de secours » indique les administrateurs qui gardent le mot de passe en mode « Microsoft obligatoire » ; à garder pour au moins deux administrateurs. « Compte Microsoft rattaché » apparaît après la première connexion Microsoft du compte.
- Accès de secours en mode « Microsoft obligatoire » : adresse `/login?local=1`, réservée aux administrateurs marqués ; aucun lien ne la montre.
- L'administrateur n'accède pas au contenu du courrier sans rôle de registre : la connexion Microsoft ne change rien aux droits par entité.
