/**
 * Centre d'aide (standard v3.3, section 13.1) : parcours par rôle, recherche plein texte, fiches de tous les écrans, FAQ locale
 * (questions du code et questions ajoutées sans livraison), impression complète (?print=1, procédures dépliées) et contact.
 * L'administrateur et les gestionnaires du registre ajoutent, corrigent et retirent des questions.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Collapse, Empty, Input, Popconfirm, Select, Space, Typography, message } from 'antd';
import { PlusOutlined, PrinterOutlined } from '@ant-design/icons';
import { useLocation, useSearchParams } from 'react-router-dom';
import api, { ApiError } from '../api';
import FaqModal, { type FaqValues } from '../components/FaqModal';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { TOPICS } from '../help';
import TopicView, { type LocalFaq } from '../help/TopicView';
import { PATHS, ROLES, roleKey, type HelpTopic, type Role } from '../help/types';

function searchable(topic: HelpTopic, lang: 'fr' | 'nl', t: (k: string) => string, local: LocalFaq[]) {
  const parts = [t(topic.titleKey), topic.purpose[lang], ...topic.layout.map((l) => l[lang]),
    ...topic.procedures.flatMap((p) => [p.title[lang], p.when[lang], ...p.steps.map((s) => s[lang]), p.result[lang]]),
    ...topic.faq.flatMap((f) => [f.q[lang], f.a[lang]]),
    ...local.flatMap((f) => [f[`question_${lang}`], f[`answer_${lang}`]])];
  return parts.join(' ').replace(/\{\{([a-z0-9_.]+)\}\}/g, (_, k) => t(k)).replace(/\[\[\d+\]\]|\*\*/g, '').toLowerCase();
}

/** Parcours proposé par défaut : le rôle le plus large de la personne. */
export function defaultPath(isAdmin: boolean, held: string[]): Role {
  if (isAdmin) return 'admin';
  return (['gestionnaire', 'secretariat', 'auditeur', 'chef_service', 'agent'] as Role[]).find((r) => held.includes(r)) || 'agent';
}

/** Un lien vers une fiche hors du parcours choisi élargit le choix à « tout » : une seule fois, jamais après un choix de la personne. */
export function needsAll(path: Role | 'all', wanted: string): boolean {
  return !!wanted && path !== 'all' && !PATHS[path].includes(wanted);
}

export default function HelpPage() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const printMode = params.get('print') === '1';
  const [query, setQuery] = useState('');
  const [faq, setFaq] = useState<LocalFaq[]>([]);
  const [editing, setEditing] = useState<FaqValues | null>(null);
  const canManage = isAdmin || (user?.entity_roles || []).some((r) => r.role === 'gestionnaire');
  const [path, setPath] = useState<Role | 'all'>(() => {
    const first = defaultPath(isAdmin, (user?.entity_roles || []).map((r) => r.role));
    return needsAll(first, location.hash.replace('#help-', '')) ? 'all' : first;
  });

  const loadFaq = useCallback(() => api.page<LocalFaq>('/faq?limit=200').then((r) => setFaq(Array.isArray(r.data) ? r.data : [])).catch(() => setFaq([])), []);
  useEffect(() => { loadFaq(); }, [loadFaq]);
  useEffect(() => { if (printMode) { const id = window.setTimeout(() => window.print(), 800); return () => window.clearTimeout(id); } return undefined; }, [printMode]);
  // Le lien « Mode d'emploi complet » amène à la fiche demandée : défilement une seule fois, sans toucher au choix de la personne.
  const wanted = location.hash.replace('#help-', '');
  useEffect(() => {
    if (!wanted) return undefined;
    const id = window.setTimeout(() => document.getElementById(`help-${wanted}`)?.scrollIntoView(), 150);
    return () => window.clearTimeout(id);
  }, [wanted]);
  useEffect(() => {
    if (needsAll(path, wanted)) setPath('all');
  // Seul un changement de lien déclenche l'élargissement : un choix ultérieur du parcours reste respecté.
  }, [wanted]);

  const active = faq.filter((f) => f.is_active !== 0);
  const shown = canManage && !printMode ? faq : active;
  const forTopic = (id: string) => shown.filter((f) => f.topic_id === id);
  const general = shown.filter((f) => !f.topic_id);

  const topics = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = printMode || path === 'all' ? TOPICS : PATHS[path].map((id) => TOPICS.find((x) => x.id === id)).filter((x): x is HelpTopic => !!x);
    return q ? base.filter((tp) => searchable(tp, lang, t, active.filter((f) => f.topic_id === tp.id)).includes(q)) : base;
  }, [query, lang, t, path, printMode, active]);

  const remove = async (id: number) => {
    try { await api.del(`/faq/${id}`); message.success(t('faq.removed')); loadFaq(); } catch (e) { message.error(e instanceof ApiError ? e.message : t('common.error')); }
  };
  const actions = (f: LocalFaq) => (canManage && !printMode ? (
    <Space>
      <Button size="small" onClick={() => setEditing(f)}>{t('faq.edit')}</Button>
      {f.is_active !== 0 && <Popconfirm title={t('faq.remove')} okText={t('yes')} cancelText={t('no')} onConfirm={() => remove(f.id)}><Button size="small" danger>{t('faq.remove')}</Button></Popconfirm>}
      {f.is_active === 0 && <em>{t('faq.inactive')}</em>}
    </Space>
  ) : null);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0 }}>{t('help.title')}</Typography.Title>
        {!printMode && (
          <Space className="page-header-actions" wrap>
            <Button icon={<PrinterOutlined />} onClick={() => window.open(`/help?print=1&t=${Date.now()}`, '_blank')}>{t('help.print')}</Button>
            {canManage && <Button icon={<PlusOutlined />} onClick={() => setEditing({})}>{t('help.faq.add')}</Button>}
          </Space>
        )}
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
            <TopicView topic={tp} expanded={printMode} localFaq={forTopic(tp.id)} faqActions={actions} />
          </Card>
        ))}
      </div>
      <Card title={t('help.general')} style={{ marginBottom: 16 }}>
        {general.length === 0 ? <Typography.Text type="secondary">{t('common.nodata')}</Typography.Text> : (
          <Collapse defaultActiveKey={printMode ? general.map((f) => String(f.id)) : []} items={general.map((f) => ({
            key: String(f.id), label: lang === 'nl' ? f.question_nl : f.question_fr,
            children: <Space direction="vertical"><span style={{ whiteSpace: 'pre-wrap' }}>{lang === 'nl' ? f.answer_nl : f.answer_fr}</span>{actions(f)}</Space>,
          }))} />
        )}
      </Card>
      <Card title={t('help.contact')}><Typography.Paragraph>{settings.app.support_contact}</Typography.Paragraph></Card>
      <FaqModal open={editing !== null} initial={editing || undefined} onClose={() => setEditing(null)} onSaved={loadFaq} />
    </div>
  );
}
