# Architecture, version 0.2.0

The French text is authoritative. This translation was made by Claude and still needs review (gap E13).

## Services

Two Docker Compose containers: `courrier-web` (nginx, built interface, `/api/` proxy, HTTPS) and `courrier-api` (Express 4, internal port 3001, not published, user `appuser` 10001 since 0.2.0). `sql.js` database and uploaded files live in the `db-data` volume, mounted on `/app/data`; PostgreSQL 16 comes at step 8.

| Path in the volume | Content |
| --- | --- |
| `/app/data/app.db` | `sql.js` database |
| `/app/data/pieces/YYYY/MM/<32 hex characters>.<pdf, jpg or png>` | Uploaded files, under a server-generated name |
| `/app/data/pieces/tmp/` | Files being received; deleted at the end of each upload and, for an interrupted upload, after one hour |

`backup.sh` archives the whole `/app/data`: database and uploaded files.

## Tables

| Table | Content |
| --- | --- |
| `users`, `sessions`, `audit_log`, `app_settings` | Template core; `app_settings` holds instance parameters, which override the defaults |
| `entities`, `registers`, `register_counters`, `user_roles` | Entities, registers, yearly counters, one role per person and per entity |
| `org_services`, `org_service_entities`, `mail_types`, `contacts` | Services, mail types, contacts |
| `mails` | Incoming mail |
| `pieces` (0.2.0) | Uploaded file: entity, mail (once attached), status `a_enregistrer`, `rattachee` or `rejetee`, storage name, original name, verified type, size, SHA-256 hash, position, rejection reason |
| `consultations` (0.2.0) | Access log: person, entity, mail, file, action (`fiche` or `piece`), channel (`api` or `mcp`), UTC timestamp |

Migrations: `001_noyau` to `005_pieces_consultations`.

## Roles

| Role | Scope | Rights in version 0.2.0 |
| --- | --- | --- |
| `admin` (global) | Application | Accounts, roles, entities, registers, services, types, settings; no access to mail content or files |
| `secretariat` | Entity | Registers, reads, corrects and cancels the entity's mail; uploads, views and rejects queued files; adds a file to a mail |
| `gestionnaire` | Entity | Same as the secretariat, plus mail types |
| `auditeur` | Entity | Access log of the entity, without mail content |
| `agent`, `chef_service` | Entity | No access to mail before step 3 |

## Files

Uploads arrive as `multipart/form-data` (field `file`) through `multer` 2.5.0, one file per request. Session and anti-CSRF token are checked before reception. The service then checks the right, the mail status, the size (`pieces.max_mb`) and the real type from the first bytes (PDF, JPEG, PNG; TIFF refused with its own reason). The file is stored under a server-generated name; the original name is only displayed.

When a mail is registered, its files (`piece_ids`) are attached in the same transaction as the number assignment. A file already taken, rejected or from another entity cancels the whole registration and no number is consumed.

Content is read through `GET /api/pieces/:id/contenu`, authenticated by the session cookie, with `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`: the preview shows inside the application and nowhere else. Every content read and every opening of a mail record is written to the access log.

## Parameters

| Key | Default | Where |
| --- | --- | --- |
| `pieces.max_mb` | 50 | `config/instance.defaut.json`; editable in Administration › Settings, from 1 to 50 (nginx limit) |
| `pieces.mcp_read_max_mb` | 5 | Same; from 1 to 10 |
| Others | See the French text | `config/` |

## API and MCP

New resources in 0.2.0: `/api/pieces` (six routes, including `GET /:id/contenu`), `/api/consultations` (read only), `/api/settings` (read and update). 55 routes, 52 MCP tools. OpenAPI contract on `GET /api/openapi.json`.
