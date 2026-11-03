/** Tickets : le demandeur suit les siens, les traitants voient leur file et les compteurs (standard v3.3, section 13.5). */
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Input, Row, Select, Space, Statistic, Switch, Table, Tag, Typography, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api, { ApiError, qs } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import ReportTicketModal from '../components/ReportTicketModal';
import TicketDrawer from '../components/TicketDrawer';

interface Row { id: number; entity_code: string | null; reference: string; type: string; title: string; priority: string; status: string; queue: string; overdue: number; updated_at: string; requester_name: string }
interface Stats { open: number; overdue: number; unassigned: number; resolved_30d: number }
const PRIORITY_COLORS: Record<string, string> = { P1: 'red', P2: 'orange', P3: 'blue', P4: 'default' };

export default function TicketsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(false);
  const [q, setQ] = useState('');
  const [type, setType] = useState<string | undefined>();
  const [openOnly, setOpenOnly] = useState(true);
  const current = params.get('id') ? Number(params.get('id')) : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await api.page<Row>(`/tickets${qs({ q, type, open_only: openOnly ? 'true' : undefined, limit: 200 })}`)).data);
      try { setStats(await api.get<Stats>('/tickets/stats')); } catch { setStats(null); }
    } catch (e) { message.error(e instanceof ApiError ? e.message : t('common.error')); } finally { setLoading(false); }
  }, [q, type, openOnly, t]);
  useEffect(() => { load(); }, [load]);

  const openTicket = (id: number | null) => { const p = new URLSearchParams(params); if (id) p.set('id', String(id)); else p.delete('id'); setParams(p); };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0 }}>{t('tickets.title')}</Typography.Title>
        <Button type="primary" onClick={() => setReport(true)}>{t('tickets.report')}</Button>
      </div>
      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {([['open', 'tickets.stats.open'], ['overdue', 'tickets.stats.overdue'], ['unassigned', 'tickets.stats.unassigned'], ['resolved_30d', 'tickets.stats.resolved']] as const).map(([k, label]) => (
            <Col xs={12} md={6} key={k}><Card size="small"><Statistic title={t(label)} value={stats[k]} /></Card></Col>
          ))}
        </Row>
      )}
      <Card>
        <Space wrap className="tickets-filters" style={{ marginBottom: 16 }}>
          <Input.Search allowClear name="q" autoComplete="off" aria-label={t('common.search')} placeholder={t('common.search')} onSearch={setQ} style={{ width: 240 }} />
          <Select allowClear aria-label={t('tickets.field.type')} placeholder={t('tickets.field.type')} value={type} onChange={setType} style={{ width: 200 }}
            options={(['incident', 'bug', 'question', 'wish'] as const).map((x) => ({ value: x, label: t(`tickets.type.${x}`) }))} />
          <Space><Switch checked={openOnly} onChange={setOpenOnly} aria-label={t('tickets.open_only')} />{t('tickets.open_only')}</Space>
        </Space>
        <Table<Row> rowKey="id" size="middle" loading={loading} dataSource={rows} scroll={{ x: 'max-content' }} locale={{ emptyText: t('common.nodata') }}
          onRow={(r) => ({ onClick: () => openTicket(r.id), style: { cursor: 'pointer' } })}
          columns={[
            { title: t('tickets.reference'), dataIndex: 'reference', key: 'reference' },
            { title: t('tickets.field.title'), dataIndex: 'title', key: 'title' },
            { title: t('tickets.field.type'), dataIndex: 'type', key: 'type', render: (v: string) => t(`tickets.type.${v}`) },
            { title: t('tickets.entity'), dataIndex: 'entity_code', key: 'entity', render: (v: string | null) => v || '' },
            { title: t('tickets.priority'), dataIndex: 'priority', key: 'priority', render: (v: string, r) => <Space><Tag color={PRIORITY_COLORS[v]}>{v}</Tag>{r.overdue ? <Tag color="red">{t('tickets.overdue')}</Tag> : null}</Space> },
            { title: t('common.status'), dataIndex: 'status', key: 'status', render: (v: string) => t(`tickets.status.${v}`) },
            { title: t('common.updated'), dataIndex: 'updated_at', key: 'updated_at', render: (d: string) => dayjs(d).format('L LT') },
          ]} />
      </Card>
      <ReportTicketModal open={report} onClose={() => setReport(false)} onCreated={load} />
      <TicketDrawer id={current} userId={user?.id || 0} onClose={() => openTicket(null)} onChanged={load} />
    </div>
  );
}
