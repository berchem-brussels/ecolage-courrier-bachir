# Microsoft sign-in compatible with Portal

Version 0.2.5 · standard v3.3, section 8.6 · the French text prevails (translation by Claude, to be proofread).

## Principle

An agent signed in to Portal with Microsoft 365 opens the application and lands on the requested screen without typing anything again. Portal passes neither token nor cookie: the application keeps its own session and its own OpenID Connect sign-in with Entra ID. The absence of input comes from the session Microsoft already keeps in the browser: the application starts the sign-in automatically, without any parameter forcing input, and Microsoft answers without a screen.

## Modes (Administration › Settings › Sign-in)

| Mode | Effect |
| --- | --- |
| Local accounts (`local`) | Password only. Default mode. |
| Microsoft optional (`sso_optional`) | « Sign in with Microsoft » button and password form. No automatic start. |
| Microsoft required (`sso`) | Any page requested without a session goes to Microsoft without a click. Only administrators marked « emergency access » keep the password. |

Switching to `sso` is refused as long as no active administrator can sign in (emergency access or Microsoft-linked account). The same check applies to every account change.

## Registration in Entra ID (by the IT department)

1. One application registration for courrier, never another application's.
2. Return address: `https://<application address>/api/auth/callback`, exactly, one per public address. When creating it, check whether the portal accepts an IP address; otherwise plan a DNS name.
3. Administrator consent for `openid`, `profile` and `email`; accounts of this tenant only.
4. A client secret. It is entered in the Settings screen, never in a conversation, an email or a file; it is encrypted and never shown again.
5. In Settings › Sign-in: directory (tenant), application id, secret, public address (HTTPS), accepted domains. The « Test the directory » button checks that the directory answers at Microsoft; it proves neither the id nor the secret, which the first sign-in attempt checks.

## Behaviour

- Matching: by Entra id (`oid`) first, then by address; the `oid` is kept on the account at first sign-in. An unknown or deactivated account, or one outside the accepted domains, is refused with a message pointing to the application administrator.
- A deactivated account loses its session immediately, even if its Microsoft session stays open.
- Return to the requested screen: `next` is kept on the server; accepted only if it starts with a single `/` and contains only letters, digits and `-._~/`, otherwise the agent lands on `/`.
- Three cases without automatic redirect: `/login?deconnecte=1`, `/login?erreur=<code>` (translated message), `/login?local=1` (emergency access, no visible link anywhere).
- « Sign out » closes the application session only: neither Portal nor the Microsoft session.
- Session cookie: `HttpOnly`, `Secure`, `SameSite=Strict`, 8 hours. Sign-in state cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/auth`, 10 minutes, cleared on return.
- Identity token verified on the server: RS256 only, key published by Microsoft, tenant issuer, audience, expiry, `nonce`. No fallback without verification.

## Test in private browsing (before any production release)

1. Signed in to Portal with Microsoft, click the application: the screen appears without any input.
2. From Portal, open a specific screen: that screen appears.
3. Open the application directly: Microsoft asks for address and password once.
4. Sign out: « You are signed out » stays displayed, Portal stays signed in.
5. `/api/auth/sso/start?next=https://exemple.com`: back to `/`.
6. Deactivated test account: access refused with a message saying whom to contact.
7. Authorization address in the Network tab: neither `prompt` nor `max_age`.
