/**
 * Attribution d'un courrier dans sa fiche (CDC CE-060 à CE-062) : service traitant, agent nommé, services en copie,
 * renvoi au secrétariat, historique. L'écran n'affiche que les actions que le serveur permet (champ « rights » de la fiche) ;
 * le serveur recontrôle chaque appel.
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Form, Input, List, Popconfirm, Select, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import api, { ApiError, qs } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { pick } from '../labels';

export interface Attribution {
  id: number; kind: 'attribution' | 'reattribution' | 'agent' | 'copies' | 'renvoi';
  service_id: number | null; service_name_fr: string | null; service_name_nl: string | null;
  from_service_id: number | null; from_service_name_fr: string | null; from_service_name_nl: string | null;
  agent_id: number | null; agent_first_name: string | null; agent_last_name: string | null;
  from_agent_id: number | null; from_agent_first_name: string | null; from_agent_last_name: string | null;
  copies: number[] | null; reason: string | null; author_first_name: string | null; author_last_name: string | null; created_at: string;
}
export interface MailAttribution {
  id: number; entity_id: number; status: 'enregistre' | 'annule';
  service_id: number | null; service_name_fr: string | null; service_name_nl: string | null;
  agent_id: number | null; agent_first_name: string | null; agent_last_name: string | null;
  return_reason: string | null; returned_at: string | null;
  copies?: { service_id: number; name_fr: string; name_nl: string | null }[];
  attributions?: Attribution[];
  rights?: { edit: boolean; cancel: boolean; attribute: boolean; set_agent: boolean; return_to_secretariat: boolean };
}
interface Service { id: number; name_fr: string; name_nl: string | null }
interface Member { id: number; first_name: string; last_name: string; role: string }

const fullName = (f?: string | null, l?: string | null) => [f, l].filter(Boolean).join(' ');

export default function AttributionCard<M extends MailAttribution>({ mail, onChanged, onReturned }: { mail: M; onChanged: (m: M) => void; onReturned: (id: number) => void }) {
  const { t, lang, hint } = useI18n();
  const [form] = Form.useForm();
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [busy, setBusy] = useState(false);
  const rights = mail.rights;
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));
  const serviceId: number | undefined = Form.useWatch('service_id', form);
  // Le motif est obligatoire pour changer le service d'un courrier déjà attribué.
  const needsReason = !!mail.service_id && serviceId !== undefined && serviceId !== mail.service_id;

  useEffect(() => {
    form.setFieldsValue({ service_id: mail.service_id ?? undefined, agent_id: mail.agent_id ?? undefined, copy_service_ids: (mail.copies || []).map((c) => c.service_id), reason: '' });
    setReturnReason('');
  }, [mail.id, mail.service_id, mail.agent_id, mail.copies, form]);

  useEffect(() => {
    if (!rights?.attribute) return;
    api.page<Service>(`/services${qs({ entity_id: mail.entity_id, is_active: 1, limit: 200 })}`).then((r) => setServices(r.data)).catch(() => setServices([]));
  }, [rights?.attribute, mail.entity_id]);

  // Les agents proposés sont ceux du service choisi (formulaire du secrétariat) ou du service traitant (responsable).
  const memberService = rights?.attribute ? serviceId : mail.service_id;
  useEffect(() => {
    if (!memberService || !(rights?.attribute || rights?.set_agent)) { setMembers([]); return; }
    let alive = true;
    api.get<Member[]>(`/services/${memberService}/members${qs({ entity_id: mail.entity_id })}`).then((r) => { if (alive) setMembers(r); }).catch(() => { if (alive) setMembers([]); });
    return () => { alive = false; };
  }, [memberService, rights?.attribute, rights?.set_agent, mail.entity_id]);

  const serviceOptions = useMemo(() => services.map((s) => ({ value: s.id, label: pick(s, 'name', lang) })), [services, lang]);
  const memberOptions = members.map((m) => ({ value: m.id, label: `${m.first_name} ${m.last_name} · ${t(`role.${m.role}`)}` }));

  const attribute = async (v: { service_id: number; agent_id?: number | null; copy_service_ids?: number[]; reason?: string }) => {
    setBusy(true);
    try {
      const body: Record<string, unknown> = { service_id: v.service_id, agent_id: v.agent_id ?? null, copy_service_ids: v.copy_service_ids || [] };
      if (v.reason && v.reason.trim()) body.reason = v.reason.trim();
      onChanged(await api.put<M>(`/mails/${mail.id}/attribution`, body));
      message.success(t('attr.saved'));
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  const setAgent = async (v: { agent_id?: number | null }) => {
    setBusy(true);
    try { onChanged(await api.put<M>(`/mails/${mail.id}/agent`, { agent_id: v.agent_id ?? null })); message.success(t('attr.agent.saved')); } catch (e) { fail(e); } finally { setBusy(false); }
  };

  const giveBack = async () => {
    if (!returnReason.trim()) return;
    setBusy(true);
    try {
      await api.post(`/mails/${mail.id}/return`, { reason: returnReason.trim() });
      message.success(t('attr.return.done'));
      onReturned(mail.id);
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  const svcName = (m: { service_name_fr: string | null; service_name_nl: string | null }) => pick({ x_fr: m.service_name_fr, x_nl: m.service_name_nl }, 'x', lang);
  const agentName = fullName(mail.agent_first_name, mail.agent_last_name);

  const eventText = (h: Attribution) => {
    const svc = pick({ x_fr: h.service_name_fr, x_nl: h.service_name_nl }, 'x', lang);
    const from = pick({ x_fr: h.from_service_name_fr, x_nl: h.from_service_name_nl }, 'x', lang);
    const agent = fullName(h.agent_first_name, h.agent_last_name);
    if (h.kind === 'attribution') return `${svc}${agent ? ` · ${agent}` : ''}`;
    if (h.kind === 'reattribution') return `${svc}${from ? ` (${t('attr.event.from')} ${from})` : ''}${agent ? ` · ${agent}` : ''}`;
    if (h.kind === 'agent') return agent || t('attr.event.agent_removed');
    if (h.kind === 'renvoi') return from;
    return (h.copies || []).length === 0 ? t('attr.event.copies_none') : '';
  };

  return (
    <Card size="small" title={t('attr.title')} style={{ marginBottom: 16 }}>
      {mail.return_reason && !mail.service_id && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} message={t('attr.returned.title')} description={mail.return_reason} />
      )}
      <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
        <Descriptions.Item label={t('attr.service')}>{mail.service_id ? svcName(mail) : <Typography.Text type="secondary">{t('attr.none.service')}</Typography.Text>}</Descriptions.Item>
        <Descriptions.Item label={t('attr.agent')}>{agentName || <Typography.Text type="secondary">{t('attr.none.agent')}</Typography.Text>}</Descriptions.Item>
        <Descriptions.Item label={t('attr.copies')}>
          {(mail.copies || []).length > 0
            ? <Space size={4} wrap>{(mail.copies || []).map((c) => <Tag key={c.service_id}>{pick(c, 'name', lang)}</Tag>)}</Space>
            : <Typography.Text type="secondary">{t('attr.none.copies')}</Typography.Text>}
        </Descriptions.Item>
      </Descriptions>

      {rights?.attribute && (
        <Form form={form} layout="vertical" onFinish={attribute}>
          <Form.Item name="service_id" tooltip={hint('attr.service')} label={t('attr.service')} rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" aria-label={t('attr.service')} placeholder={t('attr.service.placeholder')} options={serviceOptions} onChange={() => form.setFieldValue('agent_id', undefined)} />
          </Form.Item>
          <Form.Item name="agent_id" tooltip={hint('attr.agent')} label={t('attr.agent')}>
            <Select allowClear showSearch optionFilterProp="label" aria-label={t('attr.agent')} placeholder={t('attr.agent.placeholder')} options={memberOptions} />
          </Form.Item>
          <Form.Item name="copy_service_ids" tooltip={hint('attr.copies')} label={t('attr.copies')}>
            <Select mode="multiple" showSearch optionFilterProp="label" aria-label={t('attr.copies')} placeholder={t('attr.copies.placeholder')} options={serviceOptions.filter((o) => o.value !== serviceId)} />
          </Form.Item>
          {needsReason && (
            <Form.Item name="reason" tooltip={hint('attr.reason')} label={t('attr.reason')} extra={t('attr.reason.required')} rules={[{ required: true, whitespace: true }, { max: 500 }]}>
              <Input.TextArea autoComplete="off" rows={2} />
            </Form.Item>
          )}
          <Button type="primary" htmlType="submit" loading={busy}>{t('attr.submit')}</Button>
        </Form>
      )}

      {!rights?.attribute && rights?.set_agent && (
        <Form form={form} layout="vertical" onFinish={setAgent}>
          <Form.Item name="agent_id" tooltip={hint('attr.agent')} label={t('attr.agent')}>
            <Select allowClear showSearch optionFilterProp="label" aria-label={t('attr.agent')} placeholder={t('attr.agent.placeholder')} options={memberOptions} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>{t('attr.agent.set')}</Button>
        </Form>
      )}

      {rights?.return_to_secretariat && (
        <div style={{ marginTop: 16 }}>
          <Alert type="info" showIcon style={{ marginBottom: 8 }} message={t('attr.return.help')} />
          <div title={hint('attr.return_reason')}>
            <Input.TextArea autoComplete="off" name="return_reason" rows={2} aria-label={t('attr.return.reason')} placeholder={t('attr.return.reason')} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
          </div>
          <Popconfirm title={t('attr.return.confirm')} okText={t('yes')} cancelText={t('no')} onConfirm={giveBack} disabled={!returnReason.trim()}>
            <Button style={{ marginTop: 8 }} disabled={!returnReason.trim()} loading={busy}>{t('attr.return')}</Button>
          </Popconfirm>
        </div>
      )}

      {(mail.attributions || []).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Typography.Text strong>{t('attr.history')}</Typography.Text>
          <List size="small" dataSource={mail.attributions} renderItem={(h) => (
            <List.Item key={h.id} style={{ display: 'block' }}>
              <Typography.Text type="secondary">{dayjs.utc(h.created_at).local().format('L LT')} · {t('attr.event.by')} {fullName(h.author_first_name, h.author_last_name)}</Typography.Text>
              <div><strong>{t(`attr.event.${h.kind}`)}</strong>{eventText(h) ? ` : ${eventText(h)}` : ''}</div>
              {h.reason && <div><Typography.Text type="secondary">{h.reason}</Typography.Text></div>}
            </List.Item>
          )} />
        </div>
      )}
    </Card>
  );
}
