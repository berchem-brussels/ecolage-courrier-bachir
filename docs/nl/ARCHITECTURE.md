# Architectuur, versie 0.2.0

De Franse tekst is rechtsgeldig. Deze vertaling werd door Claude gemaakt en moet nog worden nagelezen (afwijking E13).

## Diensten

Twee Docker Compose-containers: `courrier-web` (nginx, gebouwde interface, doorgifte van `/api/`, HTTPS) en `courrier-api` (Express 4, interne poort 3001, niet gepubliceerd, gebruiker `appuser` 10001 sinds 0.2.0). Databank `sql.js` en neergelegde bestanden in het volume `db-data`, gekoppeld op `/app/data`; PostgreSQL 16 in stap 8.

| Pad in het volume | Inhoud |
| --- | --- |
| `/app/data/app.db` | Databank `sql.js` |
| `/app/data/pieces/JJJJ/MM/<32 hexadecimale tekens>.<pdf, jpg of png>` | Neergelegde bestanden, onder een naam die de server aanmaakt |
| `/app/data/pieces/tmp/` | Bestanden in ontvangst; gewist op het einde van elke verzending en, bij een onderbroken verzending, na een uur |

`backup.sh` archiveert heel `/app/data`: de databank en de neergelegde bestanden.

## Tabellen

| Tabel | Inhoud |
| --- | --- |
| `users`, `sessions`, `audit_log`, `app_settings` | Basis van het sjabloon; `app_settings` bevat de parameters van de instantie, die voorrang hebben op de standaardwaarden |
| `entities`, `registers`, `register_counters`, `user_roles` | Entiteiten, registers, tellers per jaar, één rol per persoon en per entiteit |
| `org_services`, `org_service_entities`, `mail_types`, `contacts` | Diensten, brieftypes, contacten |
| `mails` | Inkomende post |
| `pieces` (0.2.0) | Neergelegd bestand: entiteit, brief (na koppeling), status `a_enregistrer`, `rattachee` of `rejetee`, opslagnaam, oorspronkelijke naam, gecontroleerd type, grootte, SHA-256-vingerafdruk, volgorde, reden van weigering |
| `consultations` (0.2.0) | Raadplegingslogboek: persoon, entiteit, brief, stuk, actie (`fiche` of `piece`), kanaal (`api` of `mcp`), tijdstip in UTC |

Migraties: `001_noyau` tot `005_pieces_consultations`.

## Rollen

| Rol | Bereik | Rechten in versie 0.2.0 |
| --- | --- | --- |
| `admin` (globaal) | Toepassing | Accounts, rollen, entiteiten, registers, diensten, types, instellingen; geen toegang tot de inhoud van de post noch tot de bestanden |
| `secretariat` | Entiteit | Registreert, raadpleegt, verbetert en annuleert de post van de entiteit; legt bestanden neer, bekijkt en weigert ze; voegt een bestand toe aan een brief |
| `gestionnaire` | Entiteit | Zoals het secretariaat, plus de brieftypes |
| `auditeur` | Entiteit | Raadplegingslogboek van de entiteit, zonder inhoud van de post |
| `agent`, `chef_service` | Entiteit | Geen toegang tot de post vóór stap 3 |

## Stukken

Het neerleggen gebeurt in `multipart/form-data` (veld `file`) via `multer` 2.5.0, één bestand per verzending. Sessie en anti-CSRF-token worden vóór de ontvangst gecontroleerd. Daarna controleert de dienst het recht, de status van de brief, de grootte (parameter `pieces.max_mb`) en het werkelijke type op de eerste bytes (PDF, JPEG, PNG; TIFF geweigerd met een eigen reden). Het bestand krijgt een naam die de server aanmaakt; de oorspronkelijke naam dient enkel voor de weergave.

Bij de registratie van een brief worden de stukken (`piece_ids`) in dezelfde transactie als de nummertoekenning gekoppeld. Een stuk dat al genomen, geweigerd of van een andere entiteit is, annuleert de hele registratie zonder nummerverbruik.

De inhoud wordt gelezen via `GET /api/pieces/:id/contenu`, geauthenticeerd door het sessiecookie, met `frame-ancestors 'self'` en `X-Frame-Options: SAMEORIGIN`: het voorbeeld verschijnt in de toepassing en nergens anders. Elke lezing van de inhoud en elke opening van een fiche wordt in het raadplegingslogboek ingeschreven.

## Parameters

| Sleutel | Standaard | Waar |
| --- | --- | --- |
| `pieces.max_mb` | 50 | `config/instance.defaut.json`; wijzigbaar in Beheer › Instellingen, van 1 tot 50 (grens van nginx) |
| `pieces.mcp_read_max_mb` | 5 | Idem; van 1 tot 10 |
| Overige | Zie de Franse tekst | `config/` |

## API en MCP

Nieuwe bronnen in 0.2.0: `/api/pieces` (zes routes, waarvan `GET /:id/contenu`), `/api/consultations` (enkel lezen), `/api/settings` (lezen en wijzigen). 55 routes, 52 MCP-tools. OpenAPI-contract op `GET /api/openapi.json`.
