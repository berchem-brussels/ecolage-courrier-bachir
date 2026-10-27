/**
 * Fiche d'un courrier entrant : informations, correction des champs permis, annulation avec motif (CDC CE-043, CE-079 partiel),
 * fichiers joints dans un lecteur à côté des informations et ajout d'un fichier (CE-124, décision Q5 du 20/10/2026).
 * La fiche se relit par GET /api/mails/:id à l'ouverture : la consultation s'inscrit au journal (CG-003).
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Descriptions, Drawer, Form, Grid, Input, InputNumber, Popconfirm, Radio, Row, Segmented, Tag, Typography, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import api, { ApiError, qs } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { contactLabel, NO_FOR, pick, RADIOGROUP } from '../labels';
import { ContactPicker, type Contact } from './ContactForm';
import PieceUpload from './PieceUpload';
import PieceViewer, { type Piece } from './PieceViewer';

export interface Mail {
  id: number; number: string; entity_id: number; entity_code: string; year: number; seq: number; received_date: string; registered_at: string;
  channel: 'courrier' | 'recommande' | 'colis' | 'guichet'; tracking_number: string | null; sender_contact_id: number; sender_kind: string;
  sender_name: string; sender_first_name: string | null; sender_organisation: string | null; sender_is_demo: number; addressee_name: string | null;
  subject: string; type_id: number; type_label_fr: string; type_label_nl: string | null; lang: 'fr' | 'nl' | 'autre'; urgency: 'normale' | 'urgente';
  sender_reference: string | null; document_date: string | null; pieces_count: number | null; notes: string | null; status: 'enregistre' | 'annule';
  cancel_reason: string | null; created_by_first_name: string | null; created_by_last_name: string | null; created_at: string; updated_at: string;
  files_count?: number; pieces?: Piece[];
}
interface MailType { id: number; label_fr: string; label_nl: string | null }
const CHANNELS = ['courrier', 'recommande', 'colis', 'guichet'] as const;

export default function MailDrawer({ mail: row, onClose, onChanged }: { mail: Mail | null; onClose: () => void; onChanged: (m: Mail) => void }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm();
  const [types, setTypes] = useState<MailType[]>([]);
  const [reason, setReason] = useState('');
  const [full, setFull] = useState<Mail | null>(null);
  const [shown, setShown] = useState<number | null>(null);
  const channel = Form.useWatch('channel', form);
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));
  const mail = full && row && full.id === row.id ? full : row;
  const pieces = full?.pieces || [];
  const wide = screens.lg === true && pieces.length > 0;

  useEffect(() => {
    if (!row) { setFull(null); return; }
    setReason('');
    setShown(null);
    form.setFieldsValue({ ...row, document_date: row.document_date ? dayjs(row.document_date) : null });
    api.page<MailType>(`/mail-types${qs({ entity_id: row.entity_id, is_active: 1, limit: 200 })}`).then((r) => setTypes(r.data)).catch(() => setTypes([]));
    api.get<Mail>(`/mails/${row.id}`).then((m) => {
      setFull(m);
      form.setFieldsValue({ ...m, document_date: m.document_date ? dayjs(m.document_date) : null });
    }).catch(fail);
  }, [row?.id, form]);

  const changed = (m: Mail) => { setFull((f) => ({ ...m, pieces: m.pieces || f?.pieces || [] })); onChanged(m); };
  const added = (p: Piece) => {
    message.success(`${t('piece.received')} : ${p.original_name}`);
    const next = full ? { ...full, pieces: [...(full.pieces || []), p], files_count: (full.files_count || 0) + 1 } : null;
    setFull(next);
    setShown(p.id);
    // Le registre met à jour sa ligne (trombone et nombre de fichiers) sans rechargement (défaut relevé à la recette de la 0.2.0).
    if (next) onChanged(next);
  };

  const save = async (v: Record<string, unknown> & { document_date?: Dayjs | null }) => {
    if (!mail) return;
    const body: Record<string, unknown> = { ...v, document_date: v.document_date ? v.document_date.format('YYYY-MM-DD') : null };
    for (const k of Object.keys(body)) if (body[k] === '' || body[k] === undefined) body[k] = null;
    for (const k of ['subject', 'type_id', 'sender_contact_id', 'channel', 'lang', 'urgency']) if (body[k] === null) delete body[k];
    if (body.channel !== 'recommande') body.tracking_number = null;
    try { changed(await api.put<Mail>(`/mails/${mail.id}`, body)); message.success(t('common.saved')); } catch (e) { fail(e); }
  };

  const cancel = async () => {
    if (!mail || !reason.trim()) return;
    try { changed(await api.del<Mail>(`/mails/${mail.id}`, { reason: reason.trim() })); } catch (e) { fail(e); }
  };

  const sender: Contact | null = mail ? { id: mail.sender_contact_id, kind: mail.sender_kind as Contact['kind'], name: mail.sender_name, first_name: mail.sender_first_name,
    organisation: mail.sender_organisation, email: null, phone: null, street: null, postal_code: null, city: null, country: null, lang: mail.lang,
    company_number: null, is_demo: mail.sender_is_demo, is_active: 1, cancel_reason: null } : null;

  const current = pieces.find((p) => p.id === shown) || pieces[0] || null;
  const files = mail && (
    <Card size="small" title={`${t('piece.files')} (${pieces.length})`} style={{ marginBottom: 16 }}>
      {pieces.length > 1 && (
        <Segmented style={{ marginBottom: 8, maxWidth: '100%', overflowX: 'auto' }} value={current?.id}
          onChange={(v) => setShown(Number(v))} options={pieces.map((p) => ({ value: p.id, label: `${p.position}. ${p.original_name}` }))} />
      )}
      {pieces.length > 0 ? <PieceViewer piece={current} height={wide ? '72vh' : '50vh'} /> : <Typography.Paragraph type="secondary">{t('piece.none.mail')}</Typography.Paragraph>}
      {mail.status !== 'annule' && <div style={{ marginTop: 12 }}><PieceUpload compact fields={{ mail_id: mail.id }} onDone={added} /></div>}
    </Card>
  );

  return (
    <Drawer open={!!mail} width={Math.min(wide ? 1200 : 560, window.innerWidth)} title={t('mail.detail')} onClose={onClose} destroyOnClose>
      {mail && (
        <Row gutter={24}>
        {wide && <Col lg={13}>{files}</Col>}
        <Col xs={24} lg={wide ? 11 : 24}>
          <Typography.Title level={2} style={{ fontSize: 24, marginTop: 0 }}>{mail.number}</Typography.Title>
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label={t('common.status')}><Tag color={mail.status === 'annule' ? 'default' : 'blue'}>{t(`mail.status.${mail.status}`)}</Tag></Descriptions.Item>
            <Descriptions.Item label={t('mail.received_date')}>{dayjs(mail.received_date).format('L')}</Descriptions.Item>
            <Descriptions.Item label={t('mail.registered_at')}>{dayjs.utc(mail.registered_at).local().format('L LT')}</Descriptions.Item>
            <Descriptions.Item label={t('mail.registered_by')}>{mail.created_by_first_name} {mail.created_by_last_name}</Descriptions.Item>
            <Descriptions.Item label={t('mail.sender')}>{contactLabel({ kind: mail.sender_kind, name: mail.sender_name, first_name: mail.sender_first_name, organisation: mail.sender_organisation })}</Descriptions.Item>
            <Descriptions.Item label={t('mail.type')}>{pick(mail, 'type_label', lang)}</Descriptions.Item>
            {mail.cancel_reason && <Descriptions.Item label={t('mail.cancel_reason')}>{mail.cancel_reason}</Descriptions.Item>}
          </Descriptions>
          {!wide && files}
          {mail.status === 'annule' ? null : (
            <>
              <Form form={form} layout="vertical" onFinish={save}>
                <Form.Item {...NO_FOR} name="channel" label={t('mail.channel')}><Radio.Group aria-label={t('mail.channel')} {...RADIOGROUP} optionType="button" options={CHANNELS.map((c) => ({ value: c, label: t(`mail.channel.${c}`) }))} /></Form.Item>
                {channel === 'recommande' && <Form.Item name="tracking_number" label={t('mail.tracking_number')} rules={[{ max: 50 }]}><Input /></Form.Item>}
                <Form.Item name="sender_contact_id" label={t('mail.sender')} rules={[{ required: true }]}><ContactPicker initial={sender} /></Form.Item>
                <Form.Item name="subject" label={t('mail.subject')} rules={[{ required: true, max: 500 }]}><Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} /></Form.Item>
                <Form.Item {...NO_FOR} name="type_id" label={t('mail.type')} rules={[{ required: true }]}>
                  <Radio.Group aria-label={t('mail.type')} {...RADIOGROUP} optionType="button" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} options={types.map((ty) => ({ value: ty.id, label: pick(ty, 'label', lang) }))} />
                </Form.Item>
                <Form.Item {...NO_FOR} name="lang" label={t('mail.lang')}><Radio.Group aria-label={t('mail.lang')} optionType="button" options={(['fr', 'nl', 'autre'] as const).map((l) => ({ value: l, label: t(`mail.lang.${l}`) }))} /></Form.Item>
                <Form.Item {...NO_FOR} name="urgency" label={t('mail.urgency')}><Radio.Group aria-label={t('mail.urgency')} optionType="button" options={(['normale', 'urgente'] as const).map((u) => ({ value: u, label: t(`mail.urgency.${u}`) }))} /></Form.Item>
                <Form.Item name="addressee_name" label={t('mail.addressee_name')} rules={[{ max: 200 }]}><Input /></Form.Item>
                <Form.Item name="sender_reference" label={t('mail.sender_reference')} rules={[{ max: 100 }]}><Input /></Form.Item>
                <Form.Item name="document_date" label={t('mail.document_date')}><DatePicker format="L" disabledDate={(d) => d.isAfter(dayjs(), 'day')} /></Form.Item>
                <Form.Item name="pieces_count" label={t('mail.pieces_count')}><InputNumber min={0} max={9999} /></Form.Item>
                <Form.Item name="notes" label={t('mail.notes')} rules={[{ max: 5000 }]}><Input.TextArea rows={2} /></Form.Item>
                <Button type="primary" htmlType="submit">{t('common.save')}</Button>
              </Form>
              {user && (
                <Card size="small" style={{ marginTop: 24 }} title={t('mail.cancel')}>
                  <Alert type="info" showIcon style={{ marginBottom: 8 }} message={t('mail.cancel.help')} />
                  <Input.TextArea rows={2} aria-label={t('mail.cancel_reason')} placeholder={t('mail.cancel_reason')} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <Popconfirm title={t('mail.cancel.confirm')} okText={t('yes')} cancelText={t('no')} onConfirm={cancel} disabled={!reason.trim()}>
                    <Button danger style={{ marginTop: 8 }} disabled={!reason.trim()}>{t('mail.cancel')}</Button>
                  </Popconfirm>
                </Card>
              )}
            </>
          )}
        </Col>
        </Row>
      )}
    </Drawer>
  );
}
