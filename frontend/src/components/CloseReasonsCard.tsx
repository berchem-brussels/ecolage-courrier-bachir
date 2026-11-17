/**
 * Motifs de clôture d'une entité (CDC CE-073), version 0.4.0 : liste, ajout, modification et désactivation avec motif.
 * Montée dans la page « Types de courrier » : mêmes droits (administrateur ou gestionnaire de l'entité), vérifiés par le serveur.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api, { ApiError, qs } from '../api';
import { useI18n } from '../contexts/I18nContext';

interface CloseReason { id: number; entity_id: number; label_fr: string; label_nl: string | null; is_active: number }

export default function CloseReasonsCard({ entityId }: { entityId: number }) {
  const { t, hint } = useI18n();
  const [rows, setRows] = useState<CloseReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CloseReason | null | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [form] = Form.useForm();
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows((await api.page<CloseReason>(`/close-reasons${qs({ entity_id: entityId, limit: 200 })}`)).data); } catch (e) { fail(e); } finally { setLoading(false); }
  }, [entityId, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (editing === undefined) return;
    form.resetFields();
    form.setFieldsValue(editing || {});
  }, [editing, form]);

  const save = async (v: { label_fr: string; label_nl?: string }) => {
    const body = { label_fr: v.label_fr, label_nl: v.label_nl?.trim() || null };
    try {
      if (editing) await api.put(`/close-reasons/${editing.id}`, body); else await api.post('/close-reasons', { ...body, entity_id: entityId });
      setEditing(undefined); message.success(t('common.saved')); load();
    } catch (e) { fail(e); }
  };
  const deactivate = async (r: CloseReason) => {
    if (!reason.trim()) return;
    try { await api.del(`/close-reasons/${r.id}`, { reason: reason.trim() }); setReason(''); load(); } catch (e) { fail(e); }
  };

  return (
    <Card style={{ marginTop: 16 }} title={t('closereason.title')} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>{t('closereason.new')}</Button>}>
      <Alert type="info" showIcon style={{ marginBottom: 12 }} message={t('closereason.help')} />
      <Table<CloseReason> rowKey="id" size="middle" loading={loading} dataSource={rows} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: t('common.nodata') }}
        columns={[
          { title: t('closereason.label_fr'), dataIndex: 'label_fr', key: 'fr' },
          { title: t('closereason.label_nl'), key: 'nl', render: (_, r) => r.label_nl || <Tag color="red">{t('common.nl.missing')}</Tag> },
          { title: t('common.status'), key: 'st', render: (_, r) => (r.is_active ? <Tag color="green">{t('common.active')}</Tag> : <Tag>{t('common.inactive')}</Tag>) },
          { title: t('common.actions'), key: 'actions', render: (_, r) => (r.is_active ? (
            <Space>
              <Button size="small" onClick={() => setEditing(r)}>{t('common.edit')}</Button>
              <Popconfirm title={<Input autoComplete="off" name="close_reason_deactivation" aria-label={t('common.reason')} placeholder={t('common.reason')} value={reason} onChange={(e) => setReason(e.target.value)} />}
                okText={t('common.deactivate')} cancelText={t('common.cancel')} onConfirm={() => deactivate(r)} okButtonProps={{ disabled: !reason.trim() }}>
                <Button size="small" danger>{t('common.deactivate')}</Button>
              </Popconfirm>
            </Space>
          ) : null) },
        ]} />
      <Modal open={editing !== undefined} title={editing ? t('closereason.edit') : t('closereason.new')} okText={t('common.save')} cancelText={t('common.cancel')}
        onOk={() => form.submit()} onCancel={() => setEditing(undefined)} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="label_fr" tooltip={hint('closereason.label_fr')} label={t('closereason.label_fr')} rules={[{ required: true, max: 200 }]}><Input autoComplete="off" /></Form.Item>
          <Form.Item name="label_nl" tooltip={hint('closereason.label_nl')} label={t('closereason.label_nl')} rules={[{ max: 200 }]}><Input autoComplete="off" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
