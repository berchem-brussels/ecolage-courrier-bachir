/** Types de courrier par entité (CDC CR-021) : administrateur ou gestionnaire du registre de l'entité. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api, { ApiError, qs } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useEntities } from '../hooks';
import EntityChoice, { useEntityParam } from '../components/EntityChoice';

interface MailType { id: number; entity_id: number; label_fr: string; label_nl: string | null; nl_to_validate: number; is_demo: number; is_active: number }

export default function TypesPage() {
  const { t } = useI18n();
  const { user, isAdmin } = useAuth();
  const entities = useEntities();
  const allowed = useMemo(() => entities.filter((e) => isAdmin || (user?.entity_roles || []).some((r) => r.entity_id === e.id && r.role === 'gestionnaire')), [entities, user, isAdmin]);
  const entity = useEntityParam(allowed);
  const [rows, setRows] = useState<MailType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<MailType | null | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [form] = Form.useForm();
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try { setRows((await api.page<MailType>(`/mail-types${qs({ entity_id: entity.id, limit: 200 })}`)).data); } catch (e) { fail(e); } finally { setLoading(false); }
  }, [entity, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (editing === undefined) return;
    form.resetFields();
    form.setFieldsValue(editing ? { ...editing, nl_to_validate: !!editing.nl_to_validate } : { nl_to_validate: false });
  }, [editing, form]);

  const save = async (v: { label_fr: string; label_nl?: string; nl_to_validate: boolean }) => {
    if (!entity) return;
    const body = { ...v, label_nl: v.label_nl?.trim() || null };
    try {
      if (editing) await api.put(`/mail-types/${editing.id}`, body); else await api.post('/mail-types', { ...body, entity_id: entity.id });
      setEditing(undefined); message.success(t('common.saved')); load();
    } catch (e) { fail(e); }
  };
  const deactivate = async (ty: MailType) => {
    if (!reason.trim()) return;
    try { await api.del(`/mail-types/${ty.id}`, { reason: reason.trim() }); setReason(''); load(); } catch (e) { fail(e); }
  };

  if (entities.length > 0 && allowed.length === 0) return <Alert type="info" showIcon message={t('mail.norole')} />;
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={1} style={{ fontSize: 22, margin: 0 }}>{t('type.title')}{entity ? ` · ${entity.code}` : ''}</Typography.Title>
        <Space wrap>
          <EntityChoice allowed={allowed} value={entity} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing(null)}>{t('type.new')}</Button>
        </Space>
      </div>
      <Card>
        <Table<MailType> rowKey="id" size="middle" loading={loading} dataSource={rows} pagination={false} scroll={{ x: 'max-content' }} locale={{ emptyText: t('common.nodata') }}
          columns={[
            { title: t('type.label_fr'), key: 'fr', render: (_, ty) => <span>{ty.label_fr} {ty.is_demo ? <Tag>{t('common.fictive')}</Tag> : null}</span> },
            { title: t('type.label_nl'), key: 'nl', render: (_, ty) => (ty.label_nl
              ? <span>{ty.label_nl} {ty.nl_to_validate ? <Tag color="orange">{t('common.nl.validate')}</Tag> : null}</span>
              : <Tag color="red">{t('common.nl.missing')}</Tag>) },
            { title: t('common.status'), key: 'st', render: (_, ty) => (ty.is_active ? <Tag color="green">{t('common.active')}</Tag> : <Tag>{t('common.inactive')}</Tag>) },
            { title: t('common.actions'), key: 'actions', render: (_, ty) => (ty.is_active ? (
              <Space>
                <Button size="small" onClick={() => setEditing(ty)}>{t('common.edit')}</Button>
                <Popconfirm title={<Input aria-label={t('common.reason')} placeholder={t('common.reason')} value={reason} onChange={(e) => setReason(e.target.value)} />}
                  okText={t('common.deactivate')} cancelText={t('common.cancel')} onConfirm={() => deactivate(ty)} okButtonProps={{ disabled: !reason.trim() }}>
                  <Button size="small" danger>{t('common.deactivate')}</Button>
                </Popconfirm>
              </Space>
            ) : null) },
          ]} />
      </Card>
      <Modal open={editing !== undefined} title={editing ? t('type.edit') : t('type.new')} okText={t('common.save')} cancelText={t('common.cancel')}
        onOk={() => form.submit()} onCancel={() => setEditing(undefined)} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="label_fr" label={t('type.label_fr')} rules={[{ required: true, max: 200 }]}><Input /></Form.Item>
          <Form.Item name="label_nl" label={t('type.label_nl')} rules={[{ max: 200 }]}><Input /></Form.Item>
          <Form.Item name="nl_to_validate" valuePropName="checked"><Checkbox>{t('common.nl_to_validate')}</Checkbox></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
