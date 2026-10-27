/**
 * Registre des entrées d'une entité (CDC CE-120 partiel, CE-121, CR-023) : recherche, filtres gardés dans l'adresse,
 * liste paginée, ligne cliquable vers la fiche, action principale en haut à droite.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Radio, Space, Table, Tag, Typography, message } from 'antd';
import { PaperClipOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api, { ApiError, qs } from '../api';
import { registerRoles, useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useEntities } from '../hooks';
import { contactLabel, pick } from '../labels';
import EntityChoice, { useEntityParam } from '../components/EntityChoice';
import MailDrawer, { type Mail } from '../components/MailDrawer';

const PAGE_SIZE = 20;

export default function RegisterPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const entities = useEntities();
  const allowed = useMemo(() => entities.filter((e) => registerRoles(user).some((r) => r.entity_id === e.id)), [entities, user]);
  const entity = useEntityParam(allowed);
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Mail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Mail | null>(null);
  const simple = user?.ui_mode !== 'complet';
  const q = params.get('q') || '';
  const status = params.get('statut') || '';
  const yearFilter = params.get('annee') || 'courante';
  const page = Number(params.get('page') || 1);
  const thisYear = dayjs().year();
  const year = yearFilter === 'courante' ? thisYear : yearFilter === 'precedente' ? thisYear - 1 : undefined;

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const r = await api.page<Mail>(`/mails${qs({ entity_id: entity.id, q, status, year, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })}`);
      setRows(r.data);
      setTotal(r.pagination.total);
    } catch (e) { message.error(e instanceof ApiError ? e.message : t('common.error')); } finally { setLoading(false); }
  }, [entity, q, status, year, page, t]);
  useEffect(() => { load(); }, [load]);

  const setFilter = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v); else p.delete(k);
    p.delete('page');
    setParams(p);
  };

  if (allowed.length === 0 && entities.length > 0) {
    return (<div><Typography.Title level={1} style={{ fontSize: 22 }}>{t('mail.title')}</Typography.Title><Alert type="info" showIcon message={t('mail.norole')} /></div>);
  }

  const statusTag = (s: Mail['status']) => <Tag color={s === 'annule' ? 'default' : 'blue'}>{t(`mail.status.${s}`)}</Tag>;
  const columns = [
    { title: t('mail.number'), dataIndex: 'number', key: 'number', render: (n: string, m: Mail) => (
      <span style={{ whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: 600, textDecoration: m.status === 'annule' ? 'line-through' : undefined }}>{n}</span>
        {m.files_count ? <span title={`${t('piece.files')} : ${m.files_count}`} style={{ marginLeft: 6 }}><PaperClipOutlined aria-label={`${t('piece.files')} : ${m.files_count}`} /> {m.files_count}</span> : null}
      </span>
    ) },
    { title: t('mail.received_date'), dataIndex: 'received_date', key: 'received_date', render: (d: string) => dayjs(d).format('L') },
    { title: t('mail.sender'), key: 'sender', render: (_: unknown, m: Mail) => contactLabel({ kind: m.sender_kind, name: m.sender_name, first_name: m.sender_first_name, organisation: m.sender_organisation }) },
    { title: t('mail.subject'), dataIndex: 'subject', key: 'subject', ellipsis: true },
    { title: t('mail.type'), key: 'type', render: (_: unknown, m: Mail) => pick(m, 'type_label', lang) },
    { title: t('common.status'), dataIndex: 'status', key: 'status', render: statusTag },
    ...(simple ? [] : [
      { title: t('mail.channel'), dataIndex: 'channel', key: 'channel', render: (c: string) => t(`mail.channel.${c}`) },
      { title: t('mail.registered_by'), key: 'by', render: (_: unknown, m: Mail) => `${m.created_by_first_name || ''} ${m.created_by_last_name || ''}` },
      { title: t('mail.registered_at'), dataIndex: 'registered_at', key: 'registered_at', render: (d: string) => dayjs.utc(d).local().format('L LT') },
    ]),
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0, minWidth: 0 }}>{t('mail.title')}{entity ? ` · ${entity.code}` : ''}</Typography.Title>
        <Space wrap>
          <EntityChoice allowed={allowed} value={entity} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/enregistrer${entity ? `?entite=${entity.code}` : ''}`)}>{t('mail.register')}</Button>
        </Space>
      </div>
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search allowClear aria-label={t('common.search')} placeholder={t('common.search')} defaultValue={q} onSearch={(v) => setFilter('q', v)} style={{ width: 260 }} />
          <Radio.Group optionType="button" aria-label={t('common.status')} value={status} onChange={(e) => setFilter('statut', e.target.value)}
            options={[{ value: '', label: t('common.all') }, { value: 'enregistre', label: t('mail.status.enregistre') }, { value: 'annule', label: t('mail.status.annule') }]} />
          <Radio.Group optionType="button" aria-label={t('common.year')} value={yearFilter} onChange={(e) => setFilter('annee', e.target.value === 'courante' ? '' : e.target.value)}
            options={[{ value: 'courante', label: t('common.year.current') }, { value: 'precedente', label: t('common.year.previous') }, { value: 'toutes', label: t('common.year.all') }]} />
        </Space>
        <Table<Mail> rowKey="id" size="middle" loading={loading} dataSource={rows} columns={columns} locale={{ emptyText: t('common.nodata') }}
          scroll={{ x: 'max-content' }} onRow={(r) => ({ onClick: () => setCurrent(r), style: { cursor: 'pointer' } })}
          pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false,
            onChange: (p) => { const n = new URLSearchParams(params); n.set('page', String(p)); setParams(n); } }} />
      </Card>
      <MailDrawer mail={current} onClose={() => setCurrent(null)} onChanged={(m) => { setCurrent(m); load(); }} />
    </div>
  );
}
