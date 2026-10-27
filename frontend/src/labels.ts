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

/**
 * Étiquette d'un groupe de boutons (Radio.Group) ou d'un champ composé dans un Form.Item : sans attribut « for ».
 * Ant Design pose for = identifiant du champ, que Radio.Group met sur un bloc <div> ; Chrome signale alors une étiquette
 * qui ne vise aucun champ de saisie (défaut relevé à la recette de la 0.2.0, présent depuis la 0.1.0). Le nom accessible
 * du groupe vient de son aria-label. Ant Design reprend la valeur htmlFor donnée au Form.Item à la place de l'identifiant.
 */
export const NO_FOR = { htmlFor: undefined } as { htmlFor?: string };
