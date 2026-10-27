/**
 * Formulaire d'enregistrement d'un courrier entrant (CDC CE-040 à CE-048), commun à l'écran « Enregistrer un courrier »
 * et à la file « À enregistrer », où il s'affiche à côté de l'aperçu du fichier (CE-025).
 * Champs essentiels visibles ; champs secondaires repliés sous « + Plus d'options » en mode Simple, jamais retirés
 * du formulaire (piège SAGA 84). Après chaque enregistrement, le formulaire est prêt pour le suivant avec la même date
 * et le même mode d'arrivée.
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Col, DatePicker, Form, Input, InputNumber, Radio, Row, Space, Typography, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import api, { ApiError, qs } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { NO_FOR, pick, RADIOGROUP, type Entity } from '../labels';
import { ContactPicker, type Contact } from './ContactForm';

interface MailType { id: number; label_fr: string; label_nl: string | null; is_demo: number }
export interface SavedMail { id: number; number: string }
const CHANNELS = ['courrier', 'recommande', 'colis', 'guichet'] as const;

export default function RegistrationForm({ entity, pieceIds, onSaved, saveLabel }: {
  entity: Entity; pieceIds?: number[]; onSaved: (m: SavedMail) => void; saveLabel?: string;
}) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [types, setTypes] = useState<MailType[]>([]);
  const [more, setMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const channel = Form.useWatch('channel', form);
  const simple = user?.ui_mode !== 'complet';

  useEffect(() => {
    api.page<MailType>(`/mail-types${qs({ entity_id: entity.id, is_active: 1, limit: 200 })}`).then((r) => setTypes(r.data)).catch(() => setTypes([]));
    form.setFieldValue('type_id', undefined);
  }, [entity, form]);

  const submit = async (v: Record<string, unknown> & { received_date: Dayjs; document_date?: Dayjs | null }) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...v, entity_id: entity.id, received_date: v.received_date.format('YYYY-MM-DD'),
        document_date: v.document_date ? v.document_date.format('YYYY-MM-DD') : null };
      for (const k of Object.keys(body)) if (body[k] === '' || body[k] === undefined) delete body[k];
      if (body.channel !== 'recommande') delete body.tracking_number;
      if (pieceIds && pieceIds.length) body.piece_ids = pieceIds;
      const m = await api.post<SavedMail>('/mails', body);
      message.success(`${t('mail.saved')} : ${m.number}`);
      const keep = { received_date: v.received_date, channel: v.channel, lang: 'fr', urgency: 'normale' };
      form.resetFields();
      form.setFieldsValue(keep);
      setMore(false);
      onSaved(m);
    } catch (e) {
      message.error(e instanceof ApiError ? `${e.message}${e.details ? ` (${e.details.join(', ')})` : ''}` : t('common.error'));
    } finally { setSaving(false); }
  };

  const showMore = !simple || more;
  return (
    <>
      {types.length === 0 && <Alert type="warning" showIcon style={{ marginBottom: 16 }} message={t('mail.notype')} />}
      <Form form={form} layout="vertical" onFinish={submit} initialValues={{ received_date: dayjs(), channel: 'courrier', lang: 'fr', urgency: 'normale' }}>
        <Row gutter={16}>
          <Col xs={24} sm={10}>
            <Form.Item name="received_date" label={t('mail.received_date')} rules={[{ required: true }]}>
              <DatePicker format="L" allowClear={false} style={{ width: '100%' }} disabledDate={(d) => d.isAfter(dayjs(), 'day')} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={14}>
            <Form.Item {...NO_FOR} name="channel" label={t('mail.channel')} rules={[{ required: true }]}>
              <Radio.Group aria-label={t('mail.channel')} {...RADIOGROUP} optionType="button" options={CHANNELS.map((c) => ({ value: c, label: t(`mail.channel.${c}`) }))} />
            </Form.Item>
          </Col>
        </Row>
        {channel === 'recommande' && (
          <Form.Item name="tracking_number" label={t('mail.tracking_number')} rules={[{ max: 50 }]}><Input style={{ maxWidth: 280 }} /></Form.Item>
        )}
        <Form.Item name="sender_contact_id" label={t('mail.sender')} rules={[{ required: true }]}>
          <ContactPicker onPicked={(c: Contact) => form.setFieldValue('lang', c.lang)} />
        </Form.Item>
        <Form.Item name="subject" label={t('mail.subject')} rules={[{ required: true, max: 500 }]}><Input.TextArea rows={2} autoSize={{ minRows: 2, maxRows: 5 }} /></Form.Item>
        <Form.Item {...NO_FOR} name="type_id" label={t('mail.type')} rules={[{ required: true }]}>
          <Radio.Group aria-label={t('mail.type')} {...RADIOGROUP} optionType="button" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
            options={types.map((ty) => ({ value: ty.id, label: pick(ty, 'label', lang) }))} />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={14}>
            <Form.Item {...NO_FOR} name="lang" label={t('mail.lang')}>
              <Radio.Group aria-label={t('mail.lang')} optionType="button" options={(['fr', 'nl', 'autre'] as const).map((l) => ({ value: l, label: t(`mail.lang.${l}`) }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={10}>
            <Form.Item {...NO_FOR} name="urgency" label={t('mail.urgency')}>
              <Radio.Group aria-label={t('mail.urgency')} optionType="button" options={(['normale', 'urgente'] as const).map((u) => ({ value: u, label: t(`mail.urgency.${u}`) }))} />
            </Form.Item>
          </Col>
        </Row>
        <div style={{ display: showMore ? 'block' : 'none' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="addressee_name" label={t('mail.addressee_name')} rules={[{ max: 200 }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="sender_reference" label={t('mail.sender_reference')} rules={[{ max: 100 }]}><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="document_date" label={t('mail.document_date')}><DatePicker format="L" style={{ width: '100%' }} disabledDate={(d) => d.isAfter(dayjs(), 'day')} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="pieces_count" label={t('mail.pieces_count')}><InputNumber min={0} max={9999} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label={t('mail.notes')} rules={[{ max: 5000 }]}><Input.TextArea rows={2} /></Form.Item>
        </div>
        {simple && (
          <Button type="link" style={{ padding: 0, marginBottom: 16 }} onClick={() => setMore(!more)}>{more ? t('common.less') : t('common.more')}</Button>
        )}
        <div>
          <Space wrap>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">{saveLabel || t('common.save')}</Button>
            <Typography.Text type="secondary">{t('mail.number.help')}</Typography.Text>
          </Space>
        </div>
      </Form>
    </>
  );
}
