/** Choix exclusif de l'entité en boutons (standard v3.2, section 12.4), mémorisé dans l'adresse de la page (?entite=CODE). */
import { Radio } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { pick, type Entity } from '../labels';

export function useEntityParam(allowed: Entity[]): Entity | undefined {
  const [params] = useSearchParams();
  const code = params.get('entite');
  return allowed.find((e) => e.code === code) || allowed[0];
}

export default function EntityChoice({ allowed, value }: { allowed: Entity[]; value?: Entity }) {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  if (allowed.length < 2) return null;
  return (
    <Radio.Group optionType="button" buttonStyle="solid" aria-label={t('common.entity')} value={value?.code}
      onChange={(e) => { const p = new URLSearchParams(params); p.set('entite', e.target.value); p.delete('page'); setParams(p); }}
      options={allowed.map((e) => ({ value: e.code, label: `${e.code} · ${pick(e, 'name', lang)}` }))} />
  );
}
