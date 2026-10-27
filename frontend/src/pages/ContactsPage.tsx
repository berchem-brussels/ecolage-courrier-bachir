/** Contacts communs à l'application (CDC CE-130) : recherche, création, modification, désactivation avec motif. */
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Input, Popconfirm, Radio, Space, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import api, { ApiError, qs } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { contactLabel } from '../labels';
import { ContactFormModal, type Contact } from '../components/ContactForm';

const PAGE_SIZE = 20;

export default function ContactsPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Contact | null | undefined>(undefined);
  const [reason, setReason] = useState('');
  const q = params.get('q') || '';
  const active = params.get('actif') || '1';
  const page = Number(params.get('page') || 1);
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.page<Contact>(`/contacts${qs({ q, is_active: active === 'tous' ? undefined : Number(active), limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })}`);
      setRows(r.data);
      setTotal(r.pagination.total);
    } catch (e) { fail(e); } finally { setLoading(false); }
  }, [q, active, page, t]);
  useEffect(() => { load(); }, [load]);

  const setFilter = (k: string, v: string) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); p.delete('page'); setParams(p); };
  const deactivate = async (c: Contact) => {
    if (!reason.trim()) return;
    try { await api.del(`/contacts/${c.id}`, { reason: reason.trim() }); setReason(''); load(); } catch (e) { fail(e); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0 }}>{t('contact.title')}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>{t('contact.new')}</Button>
      </div>
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search allowClear aria-label={t('common.search')} placeholder={t('contact.search')} defaultValue={q} onSearch={(v) => setFilter('q', v)} style={{ width: 300 }} />
          <Radio.Group optionType="button" aria-label={t('common.status')} value={active} onChange={(e) => setFilter('actif', e.target.value === '1' ? '' : e.target.value)}
            options={[{ value: '1', label: t('common.active') }, { value: '0', label: t('common.inactive') }, { value: 'tous', label: t('common.all') }]} />
        </Space>
        <Table<Contact> rowKey="id" size="middle" loading={loading} dataSource={rows} locale={{ emptyText: t('common.nodata') }} scroll={{ x: 'max-content' }}
          pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, onChange: (p) => { const n = new URLSearchParams(params); n.set('page', String(p)); setParams(n); } }}
          columns={[
            { title: t('contact.name'), key: 'name', render: (_, c) => <span>{contactLabel(c)} {c.is_demo ? <Tag>{t('common.fictive')}</Tag> : null}</span> },
            { title: t('contact.kind'), dataIndex: 'kind', key: 'kind', render: (k: string) => t(`contact.kind.${k}`) },
            { title: t('contact.city'), dataIndex: 'city', key: 'city' },
            { title: t('contact.lang'), dataIndex: 'lang', key: 'lang', render: (l: string) => t(`mail.lang.${l}`) },
            { title: t('contact.email'), dataIndex: 'email', key: 'email' },
            { title: t('common.actions'), key: 'actions', render: (_, c) => (c.is_active ? (
              <Space>
                <Button size="small" onClick={() => setEditing(c)}>{t('common.edit')}</Button>
                <Popconfirm title={<Input aria-label={t('common.reason')} placeholder={t('common.reason')} value={reason} onChange={(e) => setReason(e.target.value)} />}
                  okText={t('common.deactivate')} cancelText={t('common.cancel')} onConfirm={() => deactivate(c)} okButtonProps={{ disabled: !reason.trim() }}>
                  <Button size="small" danger>{t('common.deactivate')}</Button>
                </Popconfirm>
              </Space>
            ) : <Tag>{t('common.inactive')}</Tag>) },
          ]} />
      </Card>
      <ContactFormModal open={editing !== undefined} contact={editing} onClose={() => setEditing(undefined)}
        onSaved={() => { setEditing(undefined); message.success(t('common.saved')); load(); }} />
    </div>
  );
}
