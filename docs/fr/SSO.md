# Connexion Microsoft compatible avec Portal

Version 0.2.5 · standard v3.3, section 8.6 · le français fait foi.

## Principe

Un agent connecté à Portal avec Microsoft 365 ouvre l'application et arrive sur l'écran demandé sans nouvelle saisie. Portal ne transmet ni jeton ni cookie : l'application garde sa session et sa propre connexion OpenID Connect avec Entra ID. L'absence de saisie vient de la session que Microsoft garde déjà dans le navigateur : l'application lance la connexion automatiquement, sans paramètre qui force une saisie, et Microsoft répond sans écran.

## Modes (Administration › Paramètres › Connexion)

| Mode | Effet |
| --- | --- |
| Comptes locaux (`local`) | Mot de passe seulement. Mode par défaut. |
| Microsoft facultatif (`sso_optional`) | Bouton « Se connecter avec Microsoft » et formulaire à mot de passe. Aucun départ automatique. |
| Microsoft obligatoire (`sso`) | Toute page demandée sans session part vers Microsoft sans clic. Seuls les administrateurs marqués « accès de secours » gardent le mot de passe. |

Le passage en mode `sso` est refusé tant qu'aucun administrateur actif ne peut se connecter (accès de secours ou compte rattaché à Microsoft). Le même contrôle s'applique à chaque modification de compte : retirer l'accès de secours du dernier administrateur joignable, ou le désactiver, est refusé.

## Inscription dans Entra ID (par le service informatique)

1. Une inscription d'application pour courrier, jamais celle d'une autre application.
2. Adresse de retour : `https://<adresse de l'application>/api/auth/callback`, exactement, une par adresse publique. Vérifier à la création si le portail accepte une adresse IP ; sinon prévoir un nom DNS.
3. Consentement administrateur pour `openid`, `profile` et `email` ; comptes de ce locataire uniquement.
4. Un secret client. Il se saisit dans l'écran Paramètres, jamais dans une conversation, un courriel ou un fichier ; il est chiffré et ne se réaffiche plus.
5. Dans Paramètres › Connexion : annuaire (locataire), identifiant de l'application, secret, adresse publique de l'application (HTTPS), domaines acceptés. Le bouton « Tester l'annuaire » vérifie que l'annuaire répond chez Microsoft ; il ne prouve ni l'identifiant ni le secret, que le premier essai de connexion contrôle.

## Comportement

- Rattachement : par l'identifiant Entra (`oid`) d'abord, par l'adresse ensuite ; l'`oid` se garde sur le compte au premier passage. Un compte inconnu, désactivé ou hors des domaines acceptés est refusé avec un message qui renvoie à l'administrateur de l'application.
- Un compte désactivé perd sa session aussitôt, même si sa session Microsoft reste ouverte.
- Retour à l'écran demandé : `next` est gardé côté serveur ; il n'est accepté que s'il commence par un seul `/` et ne contient que lettres, chiffres et `-._~/`, sinon l'agent arrive à `/`.
- Trois cas sans redirection automatique : `/login?deconnecte=1` (après « Se déconnecter »), `/login?erreur=<code>` (message traduit), `/login?local=1` (accès de secours, aucun lien visible).
- « Se déconnecter » ferme la session de l'application seulement : ni Portal ni la session Microsoft.
- Cookie de session : `HttpOnly`, `Secure`, `SameSite=Strict`, 8 heures. Cookie d'état de la connexion : `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/auth`, 10 minutes, effacé au retour.
- Jeton d'identité vérifié côté serveur : RS256 seul, clé publiée par Microsoft, émetteur du locataire, audience, expiration, `nonce`. Aucun repli sans vérification.

## Codes de retour d'erreur (`/login?erreur=`)

`SSO_NOT_CONFIGURED`, `SSO_STATE` (connexion expirée), `SSO_MICROSOFT` (refus de Microsoft), `SSO_TOKEN` (réponse non vérifiable), `SSO_DOMAIN`, `SSO_UNKNOWN_ACCOUNT`.

## Recette en navigation privée (avant toute mise en production)

1. Portal connecté avec Microsoft, clic sur l'application : l'écran s'affiche sans aucune saisie.
2. Depuis Portal, ouvrir un écran précis : c'est lui qui s'affiche.
3. Ouvrir l'application directement : Microsoft demande l'adresse et le mot de passe une seule fois.
4. Se déconnecter : « Vous êtes déconnecté » reste affiché, Portal reste connecté.
5. `/api/auth/sso/start?next=https://exemple.com` : retour à `/`.
6. Compte de test désactivé : accès refusé avec un message qui dit qui contacter.
7. Adresse d'autorisation dans l'onglet Réseau : ni `prompt` ni `max_age`.

Les tests automatiques (`backend/tests/sso.test.js`, `frontend/src/test/connexion.test.tsx`) jouent ces règles contre un faux Microsoft ; les sept points ci-dessus ne se jouent qu'avec l'inscription réelle.
