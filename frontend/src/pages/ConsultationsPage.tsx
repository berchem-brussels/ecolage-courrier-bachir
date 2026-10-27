/**
 * Journal des consultations (CDC CG-003) : qui a ouvert quelle fiche ou quel fichier, quand et par quel canal.
 * Réservé à l'auditeur de l'entité, sans contenu du courrier : ni objet, ni expéditeur, ni nom de fichier.
 * Filtres gardés dans l'adresse de la page (standard v3.2, section 12.9).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Card, DatePicker, Input, Space, Table, Tag, Typography, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api, { ApiError, qs } from '../api';
import { auditRoles, useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useEntities } from '../hooks';
import EntityChoice, { useEntityParam } from '../components/EntityChoice';

interface Consultation {
  id: number; created_at: string; action: 'fiche' | 'piece'; channel: 'api' | 'mcp'; entity_code: string; mail_id: number | null;
  mail_number: string | null; piece_id: number | null; user_first_name: string | null; user_last_name: string | null;
}
const PAGE_SIZE = 50;

export default function ConsultationsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const entities = useEntities();
  const allowed = useMemo(() => entities.filter((e) => auditRoles(user).some((r) => r.entity_id === e.id)), [entities, user]);
  const entity = useEntityParam(allowed);
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Consultation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const number = params.get('numero') || '';
  const from = params.get('du') || '';
  const to = params.get('au') || '';
  const page = Number(params.get('page') || 1);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const r = await api.page<Consultation>(`/consultations${qs({ entity_id: entity.id, mail_number: number, from, to, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })}`);
      setRows(r.data);
      setTotal(r.pagination.total);
    } catch (e) { message.error(e instanceof ApiError ? e.message : t('common.error')); } finally { setLoading(false); }
  }, [entity, number, from, to, page, t]);
  useEffect(() => { load(); }, [load]);

  const set = (values: Record<string, string>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(values)) { if (v) p.set(k, v); else p.delete(k); }
    if (!('page' in values)) p.delete('page');
    setParams(p);
  };

  if (allowed.length === 0) {
    return (<div><Typography.Title level={1} style={{ fontSize: 22 }}>{t('consult.title')}</Typography.Title><Alert type="info" showIcon message={t('consult.norole')} /></div>);
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0, minWidth: 0 }}>{t('consult.title')}{entity ? ` · ${entity.code}` : ''}</Typography.Title>
        <EntityChoice allowed={allowed} value={entity} />
      </div>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('consult.help')} />
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search allowClear aria-label={t('consult.number')} placeholder={t('consult.number')} defaultValue={number} onSearch={(v) => set({ numero: v.trim() })} style={{ width: 240 }} />
          <DatePicker.RangePicker format="L" aria-label={t('consult.period')} value={[from ? dayjs(from) : null, to ? dayjs(to) : null]}
            onChange={(v) => set({ du: v?.[0] ? v[0].format('YYYY-MM-DD') : '', au: v?.[1] ? v[1].format('YYYY-MM-DD') : '' })} />
        </Space>
        <Table rowKey="id" size="small" loading={loading} dataSource={rows} scroll={{ x: true }}
          pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, onChange: (p) => set({ page: String(p) }) }}
          columns={[
            { title: t('consult.when'), dataIndex: 'created_at', key: 'at', render: (d: string) => dayjs.utc(d).local().format('L LTS') },
            { title: t('consult.who'), key: 'who', render: (_: unknown, r: Consultation) => `${r.user_first_name || ''} ${r.user_last_name || ''}` },
            { title: t('consult.what'), dataIndex: 'action', key: 'action', render: (a: string) => <Tag>{t(`consult.action.${a}`)}</Tag> },
            { title: t('mail.number'), dataIndex: 'mail_number', key: 'number', render: (n: string | null) => n || t('consult.queue') },
            { title: t('consult.file'), dataIndex: 'piece_id', key: 'piece', render: (id: number | null) => (id ? `${t('consult.file.no')} ${id}` : '') },
            { title: t('consult.channel'), dataIndex: 'channel', key: 'channel', render: (c: string) => t(`consult.channel.${c}`) },
          ]} />
      </Card>
    </div>
  );
}
