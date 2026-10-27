/**
 * Entités et registres (administrateur, CDC CR-020 et CR-021) : noms FR et NL des entités, préfixe et nombre de chiffres
 * des registres, avec un exemple de numéro. Le préfixe se fige dès qu'un numéro a été attribué.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import api, { ApiError, qs } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { pick, type Entity } from '../labels';

interface Register { id: number; entity_id: number; entity_code: string; direction: 'entree' | 'depart'; prefix: string; digits: number; is_active: number }
interface RegisterDetail extends Register { numbers_issued: number }

const example = (prefix: string, digits: number) => `${prefix}-${dayjs().year()}-${String(1).padStart(digits || 6, '0')}`;

export default function EntitiesPage() {
  const { t, lang } = useI18n();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [registers, setRegisters] = useState<Register[]>([]);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [register, setRegister] = useState<RegisterDetail | null>(null);
  const [eForm] = Form.useForm();
  const [rForm] = Form.useForm();
  const prefix = Form.useWatch('prefix', rForm);
  const digits = Form.useWatch('digits', rForm);
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));

  const load = useCallback(async () => {
    try {
      setEntities((await api.page<Entity>(`/entities${qs({ limit: 50 })}`)).data);
      setRegisters((await api.page<Register>(`/registers${qs({ limit: 50 })}`)).data);
    } catch (e) { fail(e); }
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const openRegister = async (r: Register) => {
    try { const d = await api.get<RegisterDetail>(`/registers/${r.id}`); setRegister(d); rForm.setFieldsValue(d); } catch (e) { fail(e); }
  };
  const saveEntity = async (v: { name_fr: string; name_nl: string }) => {
    if (!entity) return;
    try { await api.put(`/entities/${entity.id}`, v); setEntity(null); message.success(t('common.saved')); load(); } catch (e) { fail(e); }
  };
  const saveRegister = async (v: { prefix: string; digits: number }) => {
    if (!register) return;
    try { await api.put(`/registers/${register.id}`, v); setRegister(null); message.success(t('common.saved')); load(); } catch (e) { fail(e); }
  };

  return (
    <div>
      <Typography.Title level={1} style={{ fontSize: 22, marginBottom: 16 }}>{t('entity.title')}</Typography.Title>
      <Card title={t('entity.list')} style={{ marginBottom: 16 }}>
        <Table<Entity> rowKey="id" size="middle" dataSource={entities} pagination={false} scroll={{ x: 'max-content' }}
          onRow={(e) => ({ onClick: () => { setEntity(e); eForm.setFieldsValue(e); }, style: { cursor: 'pointer' } })}
          columns={[
            { title: t('entity.code'), dataIndex: 'code', key: 'code', render: (c: string) => <Tag>{c}</Tag> },
            { title: t('common.name_fr'), dataIndex: 'name_fr', key: 'fr' },
            { title: t('common.name_nl'), dataIndex: 'name_nl', key: 'nl' },
          ]} />
      </Card>
      <Card title={t('register.title')}>
        <Table<Register> rowKey="id" size="middle" dataSource={registers} pagination={false} scroll={{ x: 'max-content' }}
          onRow={(r) => ({ onClick: () => openRegister(r), style: { cursor: 'pointer' } })}
          columns={[
            { title: t('common.entity'), dataIndex: 'entity_code', key: 'e', render: (c: string) => <Tag>{c}</Tag> },
            { title: t('register.direction'), dataIndex: 'direction', key: 'd', render: (d: string) => t(`register.direction.${d}`) },
            { title: t('register.prefix'), dataIndex: 'prefix', key: 'p' },
            { title: t('register.digits'), dataIndex: 'digits', key: 'n' },
            { title: t('register.example'), key: 'x', render: (_, r) => <Typography.Text code>{example(r.prefix, r.digits)}</Typography.Text> },
          ]} />
      </Card>
      <Modal open={!!entity} title={t('entity.edit')} okText={t('common.save')} cancelText={t('common.cancel')} onOk={() => eForm.submit()} onCancel={() => setEntity(null)} destroyOnClose>
        {entity && <Typography.Paragraph><Tag>{entity.code}</Tag>{pick(entity, 'name', lang)}</Typography.Paragraph>}
        <Form form={eForm} layout="vertical" onFinish={saveEntity}>
          <Form.Item name="name_fr" label={t('common.name_fr')} rules={[{ required: true, max: 200 }]}><Input /></Form.Item>
          <Form.Item name="name_nl" label={t('common.name_nl')} rules={[{ required: true, max: 200 }]}><Input /></Form.Item>
        </Form>
      </Modal>
      <Modal open={!!register} title={t('register.edit')} okText={t('common.save')} cancelText={t('common.cancel')} onOk={() => rForm.submit()} onCancel={() => setRegister(null)}
        okButtonProps={{ disabled: !!register && register.numbers_issued > 0 }} destroyOnClose>
        {register && register.numbers_issued > 0 && <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('register.locked')} description={`${t('register.issued')} : ${register.numbers_issued}`} />}
        <Form form={rForm} layout="vertical" onFinish={saveRegister} disabled={!!register && register.numbers_issued > 0}>
          <Form.Item name="prefix" label={t('register.prefix')} rules={[{ required: true, pattern: /^[A-Z0-9-]{1,20}$/ }]}><Input style={{ maxWidth: 200 }} /></Form.Item>
          <Form.Item name="digits" label={t('register.digits')} rules={[{ required: true }]}><InputNumber min={3} max={9} /></Form.Item>
        </Form>
        <Typography.Text type="secondary">{t('register.example')} : </Typography.Text><Typography.Text code>{example(prefix || '', digits || 6)}</Typography.Text>
      </Modal>
    </div>
  );
}
