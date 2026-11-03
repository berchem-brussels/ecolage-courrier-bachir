# Microsoft-aanmelding compatibel met Portal

Versie 0.2.5 · standaard v3.3, sectie 8.6 · de Franse tekst is bepalend (vertaling van Claude, na te lezen).

## Principe

Een medewerker die met Microsoft 365 in Portal is aangemeld, opent de toepassing en komt zonder nieuwe invoer op het gevraagde scherm. Portal geeft geen token of cookie door: de toepassing houdt haar eigen sessie en haar eigen OpenID Connect-aanmelding bij Entra ID. Het ontbreken van invoer komt van de sessie die Microsoft al in de browser bewaart: de toepassing start de aanmelding automatisch, zonder parameter die een invoer afdwingt, en Microsoft antwoordt zonder scherm.

## Modi (Beheer › Instellingen › Aanmelden)

| Modus | Effect |
| --- | --- |
| Lokale accounts (`local`) | Enkel wachtwoord. Standaardmodus. |
| Microsoft facultatief (`sso_optional`) | Knop « Aanmelden met Microsoft » en wachtwoordformulier. Geen automatische start. |
| Microsoft verplicht (`sso`) | Elke gevraagde pagina zonder sessie vertrekt zonder klik naar Microsoft. Enkel beheerders met « noodtoegang » behouden het wachtwoord. |

De overgang naar `sso` wordt geweigerd zolang geen enkele actieve beheerder zich kan aanmelden (noodtoegang of aan Microsoft gekoppeld account). Dezelfde controle geldt bij elke wijziging van een account.

## Registratie in Entra ID (door de IT-dienst)

1. Een toepassingsregistratie voor courrier, nooit die van een andere toepassing.
2. Terugkeeradres: `https://<adres van de toepassing>/api/auth/callback`, exact, één per publiek adres. Bij het aanmaken nagaan of het portaal een IP-adres aanvaardt; zo niet een DNS-naam voorzien.
3. Beheerderstoestemming voor `openid`, `profile` en `email`; enkel accounts van deze tenant.
4. Een clientgeheim. Het wordt in het scherm Instellingen ingevoerd, nooit in een gesprek, e-mail of bestand; het wordt versleuteld en niet meer getoond.
5. In Instellingen › Aanmelden: directory (tenant), toepassings-id, geheim, publiek adres (HTTPS), aanvaarde domeinen. De knop « Directory testen » controleert dat de directory bij Microsoft antwoordt; hij bewijst noch de id noch het geheim, die de eerste aanmeldpoging controleert.

## Gedrag

- Koppeling: eerst via de Entra-id (`oid`), dan via het adres; de `oid` wordt bij de eerste doorgang op het account bewaard. Een onbekend of gedeactiveerd account, of een account buiten de aanvaarde domeinen, wordt geweigerd met een bericht dat naar de beheerder van de toepassing verwijst.
- Een gedeactiveerd account verliest meteen zijn sessie, ook als zijn Microsoft-sessie open blijft.
- Terugkeer naar het gevraagde scherm: `next` wordt aan serverzijde bewaard; het wordt enkel aanvaard als het met één enkele `/` begint en alleen letters, cijfers en `-._~/` bevat, anders komt de medewerker op `/`.
- Drie gevallen zonder automatische doorverwijzing: `/login?deconnecte=1`, `/login?erreur=<code>` (vertaald bericht), `/login?local=1` (noodtoegang, nergens een zichtbare link).
- « Afmelden » sluit enkel de sessie van de toepassing: niet Portal en niet de Microsoft-sessie.
- Sessiecookie: `HttpOnly`, `Secure`, `SameSite=Strict`, 8 uur. Statuscookie van de aanmelding: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/auth`, 10 minuten, gewist bij terugkeer.
- Identiteitstoken aan serverzijde gecontroleerd: enkel RS256, door Microsoft gepubliceerde sleutel, uitgever van de tenant, doelgroep, vervaldatum, `nonce`. Geen terugval zonder controle.

## Test in privénavigatie (voor elke productiename)

1. Met Microsoft in Portal aangemeld, klik op de toepassing: het scherm verschijnt zonder invoer.
2. Open vanuit Portal een bepaald scherm: dat scherm verschijnt.
3. Open de toepassing rechtstreeks: Microsoft vraagt adres en wachtwoord één keer.
4. Afmelden: « U bent afgemeld » blijft zichtbaar, Portal blijft aangemeld.
5. `/api/auth/sso/start?next=https://exemple.com`: terug naar `/`.
6. Gedeactiveerd testaccount: toegang geweigerd met een bericht dat zegt wie te contacteren.
7. Autorisatieadres in het tabblad Netwerk: noch `prompt` noch `max_age`.
