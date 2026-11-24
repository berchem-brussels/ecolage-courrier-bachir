/**
 * Niveau de confidentialité d'un courrier (version 0.5.0, CDC CR-001) : pastille des listes et de la fiche, et objet à montrer.
 * Un pli confidentiel n'a pas d'objet : le serveur garde un texte fixe, que l'écran traduit dans la langue de la personne.
 */
import { Tag } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useI18n } from '../contexts/I18nContext';

export type Level = 'normal' | 'restreint' | 'confidentiel';
export const LEVELS: Level[] = ['normal', 'restreint', 'confidentiel'];

/** Rien pour un courrier normal ; une pastille avec cadenas pour un courrier restreint ou confidentiel. */
export default function LevelTag({ level }: { level?: Level }) {
  const { t } = useI18n();
  if (!level || level === 'normal') return null;
  return <Tag color={level === 'confidentiel' ? 'red' : 'orange'} icon={<LockOutlined aria-hidden />} style={{ marginLeft: 6 }}>{t(`mail.level.${level}`)}</Tag>;
}

/** Objet à afficher : celui du courrier, sauf pour un pli confidentiel (texte fixe traduit). */
export function displaySubject(m: { subject: string; confidentiality?: Level }, t: (k: string) => string): string {
  return m.confidentiality === 'confidentiel' ? t('mail.confidential.subject') : m.subject;
}
