/**
 * Traitement d'un courrier dans sa fiche (CDC CE-070, CE-071, CE-073, CE-079), version 0.4.0 : prise en charge en un clic,
 * clôture avec motif, réouverture avec motif, commentaires à portée choisie, historique complet.
 * L'écran n'affiche que les actions que le serveur permet (champ « rights » de la fiche) ; le serveur recontrôle chaque appel.
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Form, Input, List, Radio, Select, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import api, { ApiError, qs } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { pick, RADIOGROUP } from '../labels';
import GroupItem from './GroupItem';

export interface TimelineItem {
  type: 'enregistrement' | 'attribution' | 'prise_en_charge' | 'commentaire' | 'cloture' | 'reouverture' | 'consultation';
  id: number; at: string; author_first_name: string | null; author_last_name: string | null;
  kind?: 'attribution' | 'reattribution' | 'agent' | 'copies' | 'renvoi';
  service_name_fr?: string | null; service_name_nl?: string | null; from_service_name_fr?: string | null; from_service_name_nl?: string | null;
  agent_first_name?: string | null; agent_last_name?: string | null;
  reason?: string | null; note?: string | null; scope?: 'service' | 'entity'; body?: string;
  close_reason_label_fr?: string | null; close_reason_label_nl?: string | null;
}
export interface MailTreatment {
  id: number; entity_id: number; status: 'enregistre' | 'en_traitement' | 'clos' | 'annule';
  taken_by_first_name?: string | null; taken_by_last_name?: string | null; taken_at?: string | null;
  closed_by_first_name?: string | null; closed_by_last_name?: string | null; closed_at?: string | null;
  close_reason_label_fr?: string | null; close_reason_label_nl?: string | null; close_note?: string | null;
  rights?: { take?: boolean; close?: boolean; reopen?: boolean; comment?: boolean };
  timeline?: TimelineItem[];
}
interface CloseReason { id: number; label_fr: string; label_nl: string | null }

const fullName = (f?: string | null, l?: string | null) => [f, l].filter(Boolean).join(' ');

export default function TraitementCard<M extends MailTreatment>({ mail, onChanged }: { mail: M; onChanged: (m: M) => void }) {
  const { t, lang, hint } = useI18n();
  const [closeForm] = Form.useForm();
  const [reopenForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [reasons, setReasons] = useState<CloseReason[]>([]);
  const [busy, setBusy] = useState(false);
  const rights = mail.rights;
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));

  useEffect(() => {
    closeForm.resetFields();
    reopenForm.resetFields();
    commentForm.resetFields();
  }, [mail.id, closeForm, reopenForm, commentForm]);

  useEffect(() => {
    if (!rights?.close) return;
    api.page<CloseReason>(`/close-reasons${qs({ entity_id: mail.entity_id, is_active: 1, limit: 200 })}`).then((r) => setReasons(r.data)).catch(() => setReasons([]));
  }, [rights?.close, mail.entity_id]);

  const run = async (fn: () => Promise<M>, done: string, after?: () => void) => {
    setBusy(true);
    try { const m = await fn(); onChanged(m); message.success(done); after?.(); } catch (e) { fail(e); } finally { setBusy(false); }
  };

  const take = () => run(() => api.post<M>(`/mails/${mail.id}/take`, {}), t('treat.taken'));
  const close = (v: { close_reason_id: number; note?: string }) => run(
    () => api.post<M>(`/mails/${mail.id}/close`, { close_reason_id: v.close_reason_id, ...(v.note && v.note.trim() ? { note: v.note.trim() } : {}) }), t('treat.close.done'));
  const reopen = (v: { reason: string }) => run(() => api.post<M>(`/mails/${mail.id}/reopen`, { reason: v.reason.trim() }), t('treat.reopen.done'));
  const comment = async (v: { scope: 'service' | 'entity'; body: string }) => {
    setBusy(true);
    try {
      await api.post(`/mails/${mail.id}/comments`, { scope: v.scope, body: v.body.trim() });
      // La fiche se relit pour montrer le commentaire dans la liste et dans l'historique.
      onChanged(await api.get<M>(`/mails/${mail.id}`));
      commentForm.resetFields();
      message.success(t('treat.comment.added'));
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  const when = (d: string) => dayjs.utc(d).local().format('L LT');
  const svc = (x: { service_name_fr?: string | null; service_name_nl?: string | null }) => pick({ x_fr: x.service_name_fr, x_nl: x.service_name_nl }, 'x', lang);
  const timeline = mail.timeline || [];
  const comments = timeline.filter((e) => e.type === 'commentaire').slice().reverse();

  const eventLabel = (e: TimelineItem) => (e.type === 'attribution' && e.kind ? t(`attr.event.${e.kind}`) : t(`treat.event.${e.type}`));
  const eventText = (e: TimelineItem) => {
    if (e.type === 'attribution') {
      const agent = fullName(e.agent_first_name, e.agent_last_name);
      if (e.kind === 'agent') return agent || t('attr.event.agent_removed');
      if (e.kind === 'renvoi') return svc({ service_name_fr: e.from_service_name_fr, service_name_nl: e.from_service_name_nl });
      if (e.kind === 'copies') return '';
      const from = svc({ service_name_fr: e.from_service_name_fr, service_name_nl: e.from_service_name_nl });
      return `${svc(e)}${e.kind === 'reattribution' && from ? ` (${t('attr.event.from')} ${from})` : ''}${agent ? ` · ${agent}` : ''}`;
    }
    if (e.type === 'cloture') return pick({ x_fr: e.close_reason_label_fr, x_nl: e.close_reason_label_nl || e.close_reason_label_fr }, 'x', lang);
    return '';
  };

  return (
    <Card size="small" title={t('treat.title')} style={{ marginBottom: 16 }}>
      {mail.status !== 'annule' && (
        <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
          <Descriptions.Item label={t('treat.taken_by')}>
            {mail.taken_at
              ? `${fullName(mail.taken_by_first_name, mail.taken_by_last_name)} · ${when(mail.taken_at)}`
              : <Typography.Text type="secondary">{t('treat.not_taken')}</Typography.Text>}
          </Descriptions.Item>
          {mail.status === 'clos' && (
            <>
              <Descriptions.Item label={t('treat.close_reason')}>
                <Tag>{pick({ x_fr: mail.close_reason_label_fr, x_nl: mail.close_reason_label_nl || mail.close_reason_label_fr }, 'x', lang)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('treat.closed_by')}>{fullName(mail.closed_by_first_name, mail.closed_by_last_name)}{mail.closed_at ? ` · ${when(mail.closed_at)}` : ''}</Descriptions.Item>
              {mail.close_note && <Descriptions.Item label={t('treat.close_note')}>{mail.close_note}</Descriptions.Item>}
            </>
          )}
        </Descriptions>
      )}

      {rights?.take && (
        <div style={{ marginBottom: 12 }}>
          <Alert type="info" showIcon style={{ marginBottom: 8 }} message={t('treat.take.help')} />
          <Button type="primary" onClick={take} loading={busy}>{t('treat.take')}</Button>
        </div>
      )}

      {rights?.close && (
        <Form form={closeForm} layout="vertical" onFinish={close} style={{ marginBottom: 12 }}>
          <Alert type="info" showIcon style={{ marginBottom: 8 }} message={t('treat.close.help')} />
          <Form.Item name="close_reason_id" tooltip={hint('treat.close_reason')} label={t('treat.close_reason')} rules={[{ required: true }]}>
            <Select aria-label={t('treat.close_reason')} placeholder={t('treat.close.placeholder')} options={reasons.map((r) => ({ value: r.id, label: pick(r, 'label', lang) }))} />
          </Form.Item>
          <Form.Item name="note" tooltip={hint('treat.close_note')} label={t('treat.close.note')} rules={[{ max: 1000 }]}><Input.TextArea autoComplete="off" rows={2} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>{t('treat.close')}</Button>
        </Form>
      )}

      {rights?.reopen && (
        <Form form={reopenForm} layout="vertical" onFinish={reopen} style={{ marginBottom: 12 }}>
          <Alert type="info" showIcon style={{ marginBottom: 8 }} message={t('treat.reopen.help')} />
          <Form.Item name="reason" tooltip={hint('treat.reopen_reason')} label={t('treat.reopen.reason')} rules={[{ required: true, whitespace: true }, { max: 500 }]}><Input.TextArea autoComplete="off" rows={2} /></Form.Item>
          <Button htmlType="submit" loading={busy}>{t('treat.reopen')}</Button>
        </Form>
      )}

      <Typography.Text strong>{t('treat.comments')}</Typography.Text>
      <List size="small" locale={{ emptyText: t('treat.comment.none') }} dataSource={comments} renderItem={(c) => (
        <List.Item key={c.id} style={{ display: 'block' }}>
          <Typography.Text type="secondary">{when(c.at)} · {fullName(c.author_first_name, c.author_last_name)} · <Tag>{t(`treat.scope.${c.scope}`)}</Tag></Typography.Text>
          <div style={{ whiteSpace: 'pre-wrap' }}>{c.body}</div>
        </List.Item>
      )} />
      {rights?.comment && (
        <Form form={commentForm} layout="vertical" onFinish={comment} style={{ marginTop: 8 }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>{t('treat.comment.help')}</Typography.Paragraph>
          <GroupItem name="scope" tooltip={hint('treat.comment_scope')} label={t('treat.comment.scope')} rules={[{ required: true }]}>
            <Radio.Group aria-label={t('treat.comment.scope')} {...RADIOGROUP} optionType="button"
              options={(['service', 'entity'] as const).map((s) => ({ value: s, label: t(`treat.scope.${s}`) }))} />
          </GroupItem>
          <Form.Item name="body" tooltip={hint('treat.comment_body')} label={t('treat.comment.body')} rules={[{ required: true, whitespace: true }, { max: 2000 }]}><Input.TextArea autoComplete="off" rows={3} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>{t('treat.comment.add')}</Button>
        </Form>
      )}

      <div style={{ marginTop: 16 }}>
        <Typography.Text strong>{t('treat.history')}</Typography.Text>
        <List size="small" locale={{ emptyText: t('treat.history.none') }} dataSource={timeline} renderItem={(e) => (
          <List.Item key={`${e.type}-${e.id}`} style={{ display: 'block' }}>
            <Typography.Text type="secondary">{when(e.at)} · {t('attr.event.by')} {fullName(e.author_first_name, e.author_last_name)}</Typography.Text>
            <div><strong>{eventLabel(e)}</strong>{eventText(e) ? ` : ${eventText(e)}` : ''}</div>
            {e.type === 'commentaire' && <div><Tag>{t(`treat.scope.${e.scope}`)}</Tag></div>}
            {(e.reason || e.note) && <div><Typography.Text type="secondary">{e.reason || e.note}</Typography.Text></div>}
          </List.Item>
        )} />
      </div>
    </Card>
  );
}
