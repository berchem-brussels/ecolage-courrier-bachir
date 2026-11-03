/**
 * Paramètres › Tickets (administrateur) : délais ITIL par priorité, délai de réouverture, rôles de chaque file (standard v3.3, 13.5).
 * Un rôle par entité vaut dans l'entité du ticket seulement ; « Administrateur » vaut pour toute l'application.
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Checkbox, Form, InputNumber, Space, message } from 'antd';
import api, { ApiError } from '../api';
import { useI18n } from '../contexts/I18nContext';
import { NO_FOR } from '../labels';

type Hours = [number, number];
interface TicketSettings { sla: Record<'P1' | 'P2' | 'P3' | 'P4', Hours>; reopen_days: number; business_roles: string[]; it_roles: string[]; role_codes: string[] }
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;

export default function TicketSettingsCard() {
  const { t, hint } = useI18n();
  const [form] = Form.useForm();
  const [data, setData] = useState<TicketSettings | null>(null);
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));

  useEffect(() => {
    api.get<TicketSettings>('/settings/tickets').then((d) => { setData(d); form.setFieldsValue(d); }).catch(() => setData(null));
  }, [form]);

  const save = async (v: TicketSettings) => {
    try {
      const d = await api.put<TicketSettings>('/settings/tickets', { sla: v.sla, reopen_days: v.reopen_days, business_roles: v.business_roles, it_roles: v.it_roles });
      setData(d); form.setFieldsValue(d); message.success(t('common.saved'));
    } catch (e) { fail(e); }
  };
  // Pas de règle « required » : elle poserait aria-required sur le groupe de cases, attribut refusé par l'audit d'accessibilité.
  const atLeastOne = { validator: (_: unknown, v?: string[]) => (v && v.length ? Promise.resolve() : Promise.reject(new Error(t('settings.tickets.roles_required')))) };
  const roleOptions = (data?.role_codes || []).map((c) => ({ value: c, label: c === 'admin' ? t('users.role.admin') : t(`role.${c}`) }));

  return (
    <Card title={t('settings.tickets')} style={{ maxWidth: 720, marginTop: 16 }}>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('settings.tickets.help')} />
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item {...NO_FOR} name="business_roles" label={t('settings.tickets.business_roles')} tooltip={hint('settings.tickets.business_roles')} rules={[atLeastOne]}>
          <Checkbox.Group options={roleOptions} />
        </Form.Item>
        <Form.Item {...NO_FOR} name="it_roles" label={t('settings.tickets.it_roles')} tooltip={hint('settings.tickets.it_roles')} rules={[atLeastOne]}>
          <Checkbox.Group options={roleOptions} />
        </Form.Item>
        {PRIORITIES.map((p) => (
          <Space key={p} align="start" wrap>
            <Form.Item name={['sla', p, 0]} label={`${p} · ${t('settings.tickets.response')}`} tooltip={hint('settings.tickets.sla')} rules={[{ required: true }]}><InputNumber min={1} max={8760} precision={0} style={{ width: 160 }} /></Form.Item>
            <Form.Item name={['sla', p, 1]} label={`${p} · ${t('settings.tickets.resolution')}`} tooltip={hint('settings.tickets.sla')} rules={[{ required: true }]}><InputNumber min={1} max={8760} precision={0} style={{ width: 160 }} /></Form.Item>
          </Space>
        ))}
        <Form.Item name="reopen_days" label={t('settings.tickets.reopen')} tooltip={hint('settings.tickets.reopen')} rules={[{ required: true }]}><InputNumber min={1} max={90} precision={0} style={{ width: 160 }} /></Form.Item>
        <Button type="primary" htmlType="submit">{t('common.save')}</Button>
      </Form>
    </Card>
  );
}
