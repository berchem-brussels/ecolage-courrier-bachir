/**
 * Bannettes du courrier (CDC CE-120), version 0.3.0 : onglets avec compteurs.
 * Secrétariat et gestionnaire : « À enregistrer » (la file de dépôt) et « À attribuer ».
 * Agent et responsable de service : « Mon service », « Moi » et « En copie ».
 * L'onglet et l'entité se gardent dans l'adresse ; ?courrier=<id> ouvre la fiche (lien de la cloche).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Card, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api, { ApiError, qs } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useEntities } from '../hooks';
import { contactLabel, pick } from '../labels';
import EntityChoice, { useEntityParam } from '../components/EntityChoice';
import MailDrawer, { type Mail } from '../components/MailDrawer';

type Box = 'a_enregistrer' | 'a_attribuer' | 'mon_service' | 'moi' | 'en_copie' | 'clos';
type Counts = Record<Box, number>;
const REGISTER_BOXES: Box[] = ['a_enregistrer', 'a_attribuer'];
const AGENT_BOXES: Box[] = ['mon_service', 'moi', 'en_copie', 'clos'];
const PAGE_SIZE = 20;
const ZERO: Counts = { a_enregistrer: 0, a_attribuer: 0, mon_service: 0, moi: 0, en_copie: 0, clos: 0 };

export default function BannettesPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const entities = useEntities();
  const roles = user?.entity_roles || [];
  const treated = (r: { role: string }) => ['secretariat', 'gestionnaire', 'agent', 'chef_service'].includes(r.role);
  const allowed = useMemo(() => entities.filter((e) => roles.some((r) => r.entity_id === e.id && treated(r))), [entities, roles]);
  const entity = useEntityParam(allowed);
  const role = roles.find((r) => r.entity_id === entity?.id);
  const keepsRegister = role?.role === 'secretariat' || role?.role === 'gestionnaire';
  const boxes = keepsRegister ? REGISTER_BOXES : AGENT_BOXES;
  const [params, setParams] = useSearchParams();
  const asked = params.get('onglet') as Box | null;
  const box: Box = asked && boxes.includes(asked) && asked !== 'a_enregistrer' ? asked : (keepsRegister ? 'a_attribuer' : 'mon_service');
  const page = Number(params.get('page') || 1);
  const [rows, setRows] = useState<Mail[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Counts>(ZERO);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Mail | null>(null);
  const simple = user?.ui_mode !== 'complet';
  const fail = useCallback((e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error')), [t]);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const [list, c] = await Promise.all([
        api.page<Mail>(`/mails${qs({ box, entity_id: entity.id, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })}`),
        api.get<Counts>(`/mails/counts${qs({ entity_id: entity.id })}`),
      ]);
      setRows(list.data);
      setTotal(list.pagination.total);
      setCounts({ ...ZERO, ...c });
    } catch (e) { fail(e); } finally { setLoading(false); }
  }, [entity, box, page, fail]);
  useEffect(() => { load(); }, [load]);

  // Lien de la cloche : ?courrier=<id> ouvre la fiche.
  const openId = params.get('courrier');
  useEffect(() => {
    if (!openId) return;
    api.get<Mail>(`/mails/${openId}`).then(setCurrent).catch(fail);
  }, [openId, fail]);

  const closeDrawer = () => {
    setCurrent(null);
    if (params.get('courrier')) { const p = new URLSearchParams(params); p.delete('courrier'); setParams(p, { replace: true }); }
  };
  const changeTab = (key: string) => {
    if (key === 'a_enregistrer') { navigate(`/a-enregistrer${entity ? `?entite=${entity.code}` : ''}`); return; }
    const p = new URLSearchParams(params);
    p.set('onglet', key);
    p.delete('page');
    setParams(p);
  };

  if (allowed.length === 0 && entities.length > 0) {
    return (<div><Typography.Title level={1} style={{ fontSize: 22 }}>{t('bannettes.title')}</Typography.Title><Alert type="info" showIcon message={t('bannettes.norole')} /></div>);
  }

  const columns = [
    { title: t('mail.number'), dataIndex: 'number', key: 'number', render: (n: string, m: Mail) => (
      <span style={{ whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: 600 }}>{n}</span>
        {m.files_count ? <span style={{ marginLeft: 6 }}><PaperClipOutlined aria-label={`${t('piece.files')} : ${m.files_count}`} /> {m.files_count}</span> : null}
      </span>
    ) },
    { title: t('mail.received_date'), dataIndex: 'received_date', key: 'received_date', render: (d: string) => dayjs(d).format('L') },
    { title: t('mail.sender'), key: 'sender', render: (_: unknown, m: Mail) => contactLabel({ kind: m.sender_kind, name: m.sender_name, first_name: m.sender_first_name, organisation: m.sender_organisation }) },
    { title: t('mail.subject'), dataIndex: 'subject', key: 'subject', ellipsis: true },
    { title: t('mail.type'), key: 'type', render: (_: unknown, m: Mail) => pick(m, 'type_label', lang) },
    { title: t('mail.urgency'), dataIndex: 'urgency', key: 'urgency', render: (u: Mail['urgency']) => (u === 'urgente' ? <Tag color="red">{t('mail.urgency.urgente')}</Tag> : null) },
    ...(box === 'a_attribuer' ? [
      { title: t('attr.returned.title'), key: 'returned', render: (_: unknown, m: Mail) => (m.return_reason ? <Space size={4} wrap><Tag color="orange">{t('box.returned')}</Tag><span>{m.return_reason}</span></Space> : null) },
    ] : [
      { title: t('box.service'), key: 'service', render: (_: unknown, m: Mail) => (m.service_id ? pick({ x_fr: m.service_name_fr, x_nl: m.service_name_nl }, 'x', lang) : t('box.unassigned')) },
      { title: t('box.agent'), key: 'agent', render: (_: unknown, m: Mail) => [m.agent_first_name, m.agent_last_name].filter(Boolean).join(' ') },
    ]),
    ...(simple ? [] : [
      { title: t('mail.registered_at'), dataIndex: 'registered_at', key: 'registered_at', render: (d: string) => dayjs.utc(d).local().format('L LT') },
    ]),
  ];

  const noService = !keepsRegister && (role?.service_ids || []).length === 0;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0, minWidth: 0 }}>{t('bannettes.title')}{entity ? ` · ${entity.code}` : ''}</Typography.Title>
        <Space wrap><EntityChoice allowed={allowed} value={entity} /></Space>
      </div>
      {noService && <Alert type="warning" showIcon style={{ marginBottom: 16 }} message={t('bannettes.noservice')} />}
      <Card>
        <Tabs activeKey={box} onChange={changeTab} aria-label={t('bannettes.tabs')}
          items={boxes.map((b) => ({ key: b, label: `${t(`box.${b}`)} (${counts[b]})` }))} />
        <Table<Mail> rowKey="id" size="middle" loading={loading} dataSource={rows} columns={columns}
          locale={{ emptyText: t(`box.empty.${box}`) }} scroll={{ x: 'max-content' }}
          onRow={(r) => ({ onClick: () => setCurrent(r), style: { cursor: 'pointer' } })}
          pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false,
            onChange: (p) => { const n = new URLSearchParams(params); n.set('page', String(p)); setParams(n); } }} />
      </Card>
      <MailDrawer mail={current} onClose={closeDrawer} onChanged={(m) => { setCurrent(m); load(); }} onReturned={() => { load(); }} />
    </div>
  );
}
