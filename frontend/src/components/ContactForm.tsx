/**
 * Contacts : fenêtre de création ou de modification, et sélecteur avec recherche pendant la frappe (CDC CE-045).
 * La liste déroulante sert à chercher dans un catalogue, avec showSearch (standard v3.2, section 12.4).
 */
import { useEffect, useRef, useState } from 'react';
import { Button, Form, Input, Modal, Radio, Select, Space, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api, { ApiError, qs } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { contactLabel, NO_FOR } from '../labels';

export interface Contact {
  id: number; kind: 'personne' | 'organisation'; name: string; first_name: string | null; organisation: string | null; email: string | null;
  phone: string | null; street: string | null; postal_code: string | null; city: string | null; country: string | null;
  lang: 'fr' | 'nl' | 'autre'; company_number: string | null; is_demo: number; is_active: number; cancel_reason: string | null;
}

export function ContactFormModal({ open, contact, onClose, onSaved }: {
  open: boolean; contact?: Contact | null; onClose: () => void; onSaved: (c: Contact) => void;
}) {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const kind = Form.useWatch('kind', form);
  useEffect(() => {
    if (open) { form.resetFields(); form.setFieldsValue(contact || { kind: 'personne', lang: 'fr' }); }
  }, [open, contact, form]);
  const save = async (v: Partial<Contact>) => {
    const body = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === '' || x === undefined ? null : x]));
    try {
      const c = contact ? await api.put<Contact>(`/contacts/${contact.id}`, body) : await api.post<Contact>('/contacts', body);
      onSaved(c);
    } catch (e) { message.error(e instanceof ApiError ? e.message : t('common.error')); }
  };
  return (
    <Modal open={open} title={contact ? t('contact.edit') : t('contact.new')} okText={t('common.save')} cancelText={t('common.cancel')}
      onOk={() => form.submit()} onCancel={onClose} destroyOnClose>
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item {...NO_FOR} name="kind" label={t('contact.kind')}>
          <Radio.Group aria-label={t('contact.kind')} optionType="button" options={[{ value: 'personne', label: t('contact.kind.personne') }, { value: 'organisation', label: t('contact.kind.organisation') }]} />
        </Form.Item>
        <Form.Item name="name" label={kind === 'organisation' ? t('contact.name.organisation') : t('contact.name')} rules={[{ required: true, max: 200 }]}><Input /></Form.Item>
        {kind !== 'organisation' && (
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="first_name" label={t('contact.first_name')} rules={[{ max: 100 }]}><Input /></Form.Item>
            <Form.Item name="organisation" label={t('contact.organisation')} rules={[{ max: 200 }]}><Input /></Form.Item>
          </Space>
        )}
        <Form.Item {...NO_FOR} name="lang" label={t('contact.lang')}>
          <Radio.Group aria-label={t('contact.lang')} optionType="button" options={(['fr', 'nl', 'autre'] as const).map((l) => ({ value: l, label: t(`mail.lang.${l}`) }))} />
        </Form.Item>
        <Space wrap style={{ width: '100%' }}>
          <Form.Item name="email" label={t('contact.email')} rules={[{ type: 'email', max: 200 }]}><Input /></Form.Item>
          <Form.Item name="phone" label={t('contact.phone')} rules={[{ max: 50 }]}><Input /></Form.Item>
        </Space>
        <Form.Item name="street" label={t('contact.street')} rules={[{ max: 200 }]}><Input /></Form.Item>
        <Space wrap style={{ width: '100%' }}>
          <Form.Item name="postal_code" label={t('contact.postal_code')} rules={[{ max: 20 }]}><Input style={{ width: 110 }} /></Form.Item>
          <Form.Item name="city" label={t('contact.city')} rules={[{ max: 100 }]}><Input /></Form.Item>
          <Form.Item name="country" label={t('contact.country')} rules={[{ max: 100 }]}><Input /></Form.Item>
        </Space>
        {kind === 'organisation' && <Form.Item name="company_number" label={t('contact.company_number')} rules={[{ max: 20 }]}><Input /></Form.Item>}
      </Form>
    </Modal>
  );
}

/** Sélecteur d'expéditeur : recherche à partir de deux lettres ; « Nouveau contact » crée et choisit sans quitter le formulaire. */
export function ContactPicker({ value, onChange, onPicked, id, initial }: {
  value?: number; onChange?: (v: number | undefined) => void; onPicked?: (c: Contact) => void; id?: string; initial?: Contact | null;
}) {
  const { t } = useI18n();
  const [options, setOptions] = useState<Contact[]>(initial ? [initial] : []);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const search = (q: string) => {
    window.clearTimeout(timer.current);
    if (q.trim().length < 2) return;
    timer.current = window.setTimeout(async () => {
      setLoading(true);
      try { setOptions((await api.page<Contact>(`/contacts${qs({ q: q.trim(), is_active: 1, limit: 20 })}`)).data); } catch { setOptions([]); } finally { setLoading(false); }
    }, 250);
  };
  const choose = (c: Contact) => {
    setOptions((o) => (o.some((x) => x.id === c.id) ? o : [c, ...o]));
    onChange?.(c.id);
    onPicked?.(c);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
      <Select id={id} showSearch allowClear filterOption={false} value={value} loading={loading} placeholder={t('contact.pick')}
        aria-label={t('mail.sender')} style={{ flex: '1 1 220px', minWidth: 0 }} onSearch={search} notFoundContent={null}
        onChange={(v) => { onChange?.(v); const c = options.find((o) => o.id === v); if (c) onPicked?.(c); }}
        options={options.map((c) => ({ value: c.id, label: <span>{contactLabel(c)}{c.city ? `, ${c.city}` : ''} {c.is_demo ? <Tag>{t('common.fictive')}</Tag> : null}</span> }))} />
      <Button icon={<PlusOutlined />} onClick={() => setCreating(true)}>{t('contact.new')}</Button>
      <ContactFormModal open={creating} onClose={() => setCreating(false)}
        onSaved={(c) => { setCreating(false); choose(c); message.success(t('contact.created')); }} />
    </div>
  );
}
