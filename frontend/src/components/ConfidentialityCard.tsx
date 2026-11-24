/**
 * Confidentialité d'un courrier sur sa fiche (version 0.5.0, CDC CR-001 à CR-005).
 * - Le registre de l'entité change le niveau avec un motif obligatoire (normal ou restreint avec ses personnes désignées) et
 *   enregistre la remise d'un pli confidentiel fermé. Un courrier enregistré ne devient pas confidentiel : l'écran ne le propose pas.
 * - Une personne qui lit le courrier parce qu'elle y est désignée en est informée.
 * L'écran n'affiche que ce que le serveur accepte (champ « rights » de la fiche) ; le serveur recontrôle tout.
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Form, Input, Radio, Select, Typography, message } from 'antd';
import dayjs from 'dayjs';
import api, { ApiError, qs } from '../api';
import GroupItem from './GroupItem';
import { useI18n } from '../contexts/I18nContext';
import { RADIOGROUP } from '../labels';
import type { Level } from './LevelTag';

export interface Designee { id: number; first_name: string; last_name: string }
export interface MailConfidentiality {
  id: number; entity_id: number; status: string; confidentiality?: Level; designees?: Designee[]; designated?: boolean;
  handed_at?: string | null; handed_by_first_name?: string | null; handed_by_last_name?: string | null; handed_to_first_name?: string | null; handed_to_last_name?: string | null;
  rights?: { change_level?: boolean; handover?: boolean };
}
interface Person { id: number; first_name: string; last_name: string; role: string }

export default function ConfidentialityCard({ mail, onChanged }: { mail: MailConfidentiality; onChanged: (m: MailConfidentiality) => void }) {
  const { t, hint } = useI18n();
  const [form] = Form.useForm();
  const [people, setPeople] = useState<Person[]>([]);
  const [busy, setBusy] = useState(false);
  const level = mail.confidentiality || 'normal';
  const canChange = !!mail.rights?.change_level;
  const target: Level | undefined = Form.useWatch('level', form);
  const name = (p: { first_name?: string | null; last_name?: string | null }) => `${p.first_name || ''} ${p.last_name || ''}`.trim();
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));

  useEffect(() => {
    form.setFieldsValue({ level, designee_ids: (mail.designees || []).map((d) => d.id), reason: '' });
  }, [mail.id, level, mail.designees, form]);
  useEffect(() => {
    if (!canChange) return;
    api.get<Person[]>(`/mails/designable-users${qs({ entity_id: mail.entity_id })}`).then(setPeople).catch(() => setPeople([]));
  }, [canChange, mail.entity_id]);

  if (!canChange && !mail.designated && level === 'normal') return null;

  const save = async (v: { level: Level; designee_ids?: number[]; reason: string }) => {
    setBusy(true);
    try {
      const body = { level: v.level, reason: v.reason.trim(), designee_ids: v.level === 'normal' ? [] : (v.designee_ids || []) };
      onChanged(await api.put<MailConfidentiality>(`/mails/${mail.id}/confidentiality`, body));
      message.success(t('conf.changed'));
    } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const handover = async () => {
    setBusy(true);
    try { onChanged(await api.post<MailConfidentiality>(`/mails/${mail.id}/handover`, {})); message.success(t('conf.handover.done')); } catch (e) { fail(e); } finally { setBusy(false); }
  };

  // Un courrier enregistré ne devient pas confidentiel ; un pli confidentiel peut redescendre (le destinataire l'a ouvert).
  const choices: Level[] = level === 'confidentiel' ? ['normal', 'restreint', 'confidentiel'] : ['normal', 'restreint'];

  return (
    <Card size="small" title={t('conf.title')} style={{ marginBottom: 16 }}>
      <Descriptions column={1} size="small" style={{ marginBottom: 8 }}>
        <Descriptions.Item label={t('mail.confidentiality')}>{t(`mail.level.${level}`)}</Descriptions.Item>
        {canChange && (mail.designees || []).length > 0 && (
          <Descriptions.Item label={level === 'confidentiel' ? t('mail.designee') : t('mail.designees')}>{(mail.designees || []).map(name).join(', ')}</Descriptions.Item>
        )}
        {mail.handed_at && (
          <>
            <Descriptions.Item label={t('conf.handed.by')}>{name({ first_name: mail.handed_by_first_name, last_name: mail.handed_by_last_name })}</Descriptions.Item>
            <Descriptions.Item label={t('conf.handed.to')}>{name({ first_name: mail.handed_to_first_name, last_name: mail.handed_to_last_name })}</Descriptions.Item>
            <Descriptions.Item label={t('conf.handed.at')}>{dayjs.utc(mail.handed_at).local().format('L LT')}</Descriptions.Item>
          </>
        )}
      </Descriptions>
      {mail.designated && !canChange && <Alert type="info" showIcon style={{ marginBottom: 8 }} message={t('mail.designated')} />}
      {level === 'confidentiel' && !mail.handed_at && mail.rights?.handover && (
        <div style={{ marginBottom: 12 }}>
          <Alert type="info" showIcon style={{ marginBottom: 8 }} message={t('conf.handover.help')} />
          <Button type="primary" onClick={handover} loading={busy}>{t('conf.handover')}</Button>
        </div>
      )}
      {canChange && mail.status !== 'annule' && (
        <Form form={form} layout="vertical" onFinish={save}>
          <Alert type="info" showIcon style={{ marginBottom: 8 }} message={t('conf.help')} />
          <GroupItem name="level" tooltip={hint('conf.level')} label={t('conf.new_level')} rules={[{ required: true }]}>
            <Radio.Group aria-label={t('conf.new_level')} {...RADIOGROUP} optionType="button" options={choices.map((l) => ({ value: l, label: t(`mail.level.${l}`) }))} />
          </GroupItem>
          {target && target !== 'normal' && (
            <Form.Item name="designee_ids" tooltip={hint('conf.designees')} label={target === 'confidentiel' ? t('mail.designee') : t('mail.designees')} rules={[{ required: true }]}>
              <Select mode={target === 'confidentiel' ? undefined : 'multiple'} showSearch optionFilterProp="label" aria-label={t('mail.designees')} placeholder={t('mail.designees.placeholder')}
                options={people.map((p) => ({ value: p.id, label: name(p) }))} />
            </Form.Item>
          )}
          <Form.Item name="reason" tooltip={hint('conf.reason')} label={t('conf.reason')} rules={[{ required: true, whitespace: true, max: 500 }]}><Input.TextArea autoComplete="off" rows={2} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>{t('conf.change')}</Button>
          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>{t(`mail.level.${target || level}.help`)}</Typography.Text>
        </Form>
      )}
    </Card>
  );
}
