/**
 * Services destinataires (administrateur) : nom FR, nom NL facultatif ou « à valider », entités (service commun),
 * service parent. Désactivation avec motif, jamais de suppression.
 */
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Checkbox, Form, Input, Modal, Popconfirm, Radio, Select, Space, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api, { ApiError, qs } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { useEntities } from '../hooks';
import { pick } from '../labels';

interface Service { id: number; name_fr: string; name_nl: string | null; nl_to_validate: number; parent_id: number | null; parent_name_fr: string | null; parent_name_nl: string | null; entity_ids: number[]; is_active: number }

export default function ServicesPage() {
  const { t, lang } = useI18n();
  const entities = useEntities();
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [entityFilter, setEntityFilter] = useState<number | 0>(0);
  const [editing, setEditing] = useState<Service | null | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [form] = Form.useForm();
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows((await api.page<Service>(`/services${qs({ entity_id: entityFilter || undefined, limit: 200 })}`)).data); } catch (e) { fail(e); } finally { setLoading(false); }
  }, [entityFilter, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (editing === undefined) return;
    form.resetFields();
    form.setFieldsValue(editing ? { ...editing, nl_to_validate: !!editing.nl_to_validate } : { entity_ids: [], nl_to_validate: false });
  }, [editing, form]);

  const save = async (v: { name_fr: string; name_nl?: string; nl_to_validate: boolean; parent_id?: number | null; entity_ids: number[] }) => {
    const body = { ...v, name_nl: v.name_nl?.trim() || null, parent_id: v.parent_id || null };
    try {
      if (editing) await api.put(`/services/${editing.id}`, body); else await api.post('/services', body);
      setEditing(undefined); message.success(t('common.saved')); load();
    } catch (e) { fail(e); }
  };
  const deactivate = async (s: Service) => {
    if (!reason.trim()) return;
    try { await api.del(`/services/${s.id}`, { reason: reason.trim() }); setReason(''); load(); } catch (e) { fail(e); }
  };
  const code = (id: number) => entities.find((e) => e.id === id)?.code || String(id);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0 }}>{t('service.title')}</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>{t('service.new')}</Button>
      </div>
      <Card>
        <Radio.Group optionType="button" aria-label={t('common.entity')} value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} style={{ marginBottom: 16 }}
          options={[{ value: 0, label: t('common.all') }, ...entities.map((e) => ({ value: e.id, label: e.code }))]} />
        <Table<Service> rowKey="id" size="middle" loading={loading} dataSource={rows} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: t('common.nodata') }}
          columns={[
            { title: t('common.name_fr'), dataIndex: 'name_fr', key: 'fr' },
            { title: t('common.name_nl'), key: 'nl', render: (_, s) => (s.name_nl
              ? <span>{s.name_nl} {s.nl_to_validate ? <Tag color="orange">{t('common.nl.validate')}</Tag> : null}</span>
              : <Tag color="red">{t('common.nl.missing')}</Tag>) },
            { title: t('service.entities'), key: 'ent', render: (_, s) => <Space size={4}>{s.entity_ids.map((id) => <Tag key={id}>{code(id)}</Tag>)}{s.entity_ids.length > 1 && <Tag color="green">{t('service.common')}</Tag>}</Space> },
            { title: t('service.parent'), key: 'parent', render: (_, s) => pick({ name_fr: s.parent_name_fr, name_nl: s.parent_name_nl }, 'name', lang) },
            { title: t('common.actions'), key: 'actions', render: (_, s) => (s.is_active ? (
              <Space>
                <Button size="small" onClick={() => setEditing(s)}>{t('common.edit')}</Button>
                <Popconfirm title={<Input aria-label={t('common.reason')} placeholder={t('common.reason')} value={reason} onChange={(e) => setReason(e.target.value)} />}
                  okText={t('common.deactivate')} cancelText={t('common.cancel')} onConfirm={() => deactivate(s)} okButtonProps={{ disabled: !reason.trim() }}>
                  <Button size="small" danger>{t('common.deactivate')}</Button>
                </Popconfirm>
              </Space>
            ) : <Tag>{t('common.inactive')}</Tag>) },
          ]} />
      </Card>
      <Modal open={editing !== undefined} title={editing ? t('service.edit') : t('service.new')} okText={t('common.save')} cancelText={t('common.cancel')}
        onOk={() => form.submit()} onCancel={() => setEditing(undefined)} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name_fr" label={t('common.name_fr')} rules={[{ required: true, max: 200 }]}><Input /></Form.Item>
          <Form.Item name="name_nl" label={t('common.name_nl')} rules={[{ max: 200 }]}><Input /></Form.Item>
          <Form.Item name="nl_to_validate" valuePropName="checked"><Checkbox>{t('common.nl_to_validate')}</Checkbox></Form.Item>
          <Form.Item name="entity_ids" label={t('service.entities')} extra={t('service.entities.help')} rules={[{ required: true, type: 'array', min: 1 }]}>
            <Checkbox.Group options={entities.map((e) => ({ value: e.id, label: `${e.code} · ${pick(e, 'name', lang)}` }))} />
          </Form.Item>
          <Form.Item name="parent_id" label={t('service.parent')}>
            <Select allowClear showSearch optionFilterProp="label" aria-label={t('service.parent')}
              options={rows.filter((s) => s.is_active && s.id !== editing?.id).map((s) => ({ value: s.id, label: pick(s, 'name', lang) }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
