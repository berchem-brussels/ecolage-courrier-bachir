/** Libellés bilingues des données (colonnes _fr et _nl) : le NL manquant retombe sur le FR (standard v3.2, section 11.1). */
import type { Lang } from './i18n';

export interface Entity { id: number; code: string; name_fr: string; name_nl: string; is_active: number }

export function pick(o: object | null | undefined, field: string, lang: Lang): string {
  if (!o) return '';
  const rec = o as Record<string, unknown>;
  const nl = rec[`${field}_nl`] as string | null | undefined;
  const fr = rec[`${field}_fr`] as string | null | undefined;
  return (lang === 'nl' && nl ? nl : fr) || '';
}

export function contactLabel(c: { kind?: string; name?: string | null; first_name?: string | null; organisation?: string | null } | null | undefined): string {
  if (!c) return '';
  const base = c.kind === 'organisation' ? c.name : [c.name, c.first_name].filter(Boolean).join(' ');
  return c.organisation && c.kind !== 'organisation' ? `${base} (${c.organisation})` : base || '';
}

/**
 * Rôle ARIA d'un groupe de boutons à choix exclusif obligatoire : Form.Item y pose aria-required, que seul un
 * radiogroup autorise (règle axe aria-allowed-attr). Le type de Radio.Group ne déclare pas « role » : on le passe en propagation.
 */
export const RADIOGROUP = { role: 'radiogroup' } as Record<string, string>;

