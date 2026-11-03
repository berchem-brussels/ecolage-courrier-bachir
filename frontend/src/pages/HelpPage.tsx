/**
 * Centre d'aide (standard v3.3, section 13.1) : parcours par rôle, recherche plein texte, fiches de tous les écrans,
 * impression complète (?print=1, procédures dépliées) et contact. La FAQ locale arrive en 0.2.8.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Input, Select, Space, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { TOPICS } from '../help';
import TopicView from '../help/TopicView';
import { PATHS, ROLES, roleKey, type HelpTopic, type Role } from '../help/types';

function searchable(topic: HelpTopic, lang: 'fr' | 'nl', t: (k: string) => string) {
  const parts = [t(topic.titleKey), topic.purpose[lang], ...topic.layout.map((l) => l[lang]),
    ...topic.procedures.flatMap((p) => [p.title[lang], p.when[lang], ...p.steps.map((s) => s[lang]), p.result[lang]]),
    ...topic.faq.flatMap((f) => [f.q[lang], f.a[lang]])];
  return parts.join(' ').replace(/\{\{([a-z0-9_.]+)\}\}/g, (_, k) => t(k)).replace(/\[\[\d+\]\]|\*\*/g, '').toLowerCase();
}

/** Parcours proposé par défaut : le rôle le plus large de la personne. */
function defaultPath(isAdmin: boolean, held: string[]): Role {
  if (isAdmin) return 'admin';
  return (['gestionnaire', 'secretariat', 'auditeur', 'chef_service', 'agent'] as Role[]).find((r) => held.includes(r)) || 'agent';
}

export default function HelpPage() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const printMode = params.get('print') === '1';
  const [query, setQuery] = useState('');
  const [path, setPath] = useState<Role | 'all'>(() => defaultPath(isAdmin, (user?.entity_roles || []).map((r) => r.role)));

  useEffect(() => { if (printMode) { const id = window.setTimeout(() => window.print(), 800); return () => window.clearTimeout(id); } return undefined; }, [printMode]);
  // Un lien « Mode d'emploi complet » amène à la fiche demandée : le parcours « tout » la rend toujours visible.
  const wanted = location.hash.replace('#help-', '');
  useEffect(() => {
    if (!wanted) return;
    if (path !== 'all' && !PATHS[path].includes(wanted)) setPath('all');
  }, [wanted, path]);
  useEffect(() => {
    if (!wanted) return;
    const id = window.setTimeout(() => document.getElementById(`help-${wanted}`)?.scrollIntoView(), 150);
    return () => window.clearTimeout(id);
  }, [wanted, path]);

  const topics = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = printMode || path === 'all' ? TOPICS : PATHS[path].map((id) => TOPICS.find((x) => x.id === id)).filter((x): x is HelpTopic => !!x);
    return q ? base.filter((tp) => searchable(tp, lang, t).includes(q)) : base;
  }, [query, lang, t, path, printMode]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0 }}>{t('help.title')}</Typography.Title>
        {!printMode && <Button className="page-header-actions" icon={<PrinterOutlined />} onClick={() => window.open(`/help?print=1&t=${Date.now()}`, '_blank')}>{t('help.print')}</Button>}
      </div>
      {!printMode && (
        <Space wrap style={{ marginBottom: 16 }} className="help-search">
          <Input.Search allowClear name="q" autoComplete="off" aria-label={t('common.search')} placeholder={t('common.search')} onChange={(e) => setQuery(e.target.value)} style={{ width: 320 }} />
          <label htmlFor="help-path">{t('help.path')}</label>
          <Select id="help-path" value={path} onChange={setPath} style={{ minWidth: 240 }}
            options={[{ value: 'all', label: t('help.path.all') }, ...ROLES.map((r) => ({ value: r, label: t(roleKey(r)) }))]} />
        </Space>
      )}
      <div className="help-topics">
        {topics.length === 0 && <Empty description={t('help.no_result')} />}
        {topics.map((tp) => (
          <Card key={tp.id} style={{ marginBottom: 16, breakInside: 'avoid' }}>
            <TopicView topic={tp} expanded={printMode} />
          </Card>
        ))}
      </div>
      <Card title={t('help.contact')}><Typography.Paragraph>{settings.app.support_contact}</Typography.Paragraph></Card>
    </div>
  );
}
