/**
 * Paramètres › Connexion (administrateur) : mode, inscription de l'application dans Entra ID (standard v3.3, sections 8.2 et 8.6).
 * Le secret client est chiffré par le serveur et n'est jamais réaffiché ; laissé vide, la valeur enregistrée est gardée.
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Radio, Space, Typography, message } from 'antd';
import api, { ApiError } from '../api';
import { NO_FOR } from '../labels';
import { useI18n } from '../contexts/I18nContext';

interface AuthSettings { mode: 'local' | 'sso' | 'sso_optional'; tenant: string; client_id: string; public_url: string; domains: string; secret_set: boolean; redirect_uri: string | null }

export default function AuthSettingsCard() {
  const { t, hint } = useI18n();
  const [form] = Form.useForm();
  const [data, setData] = useState<AuthSettings | null>(null);
  const [tested, setTested] = useState(false);
  const fail = (e: unknown) => message.error(e instanceof ApiError ? e.message : t('common.error'));

  useEffect(() => {
    api.get<AuthSettings>('/settings/auth').then((d) => { setData(d); form.setFieldsValue(d); }).catch(() => setData(null));
  }, [form]);

  const save = async (v: Partial<AuthSettings> & { client_secret?: string }) => {
    const body = { ...v };
    if (!body.client_secret) delete body.client_secret;
    try {
      const d = await api.put<AuthSettings>('/settings/auth', body);
      setData(d); form.setFieldsValue({ ...d, client_secret: '' }); message.success(t('common.saved'));
    } catch (e) { fail(e); }
  };

  const test = async () => {
    setTested(false);
    try { await api.post('/settings/auth/test', { tenant: form.getFieldValue('tenant') || undefined }); setTested(true); } catch (e) { fail(e); }
  };

  return (
    <Card title={t('settings.auth')} style={{ maxWidth: 720, marginTop: 16 }}>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('settings.auth.help')} />
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item {...NO_FOR} name="mode" label={t('settings.mode')} tooltip={hint('settings.mode')}>
          <Radio.Group aria-label={t('settings.mode')} optionType="button" options={(['local', 'sso_optional', 'sso'] as const).map((m) => ({ value: m, label: t(`settings.mode.${m}`) }))} />
        </Form.Item>
        <Form.Item name="tenant" label={t('settings.tenant')} tooltip={hint('settings.tenant')}><Input autoComplete="off" /></Form.Item>
        <Form.Item name="client_id" label={t('settings.client_id')} tooltip={hint('settings.client_id')}><Input autoComplete="off" /></Form.Item>
        <Form.Item name="client_secret" label={t('settings.client_secret')} tooltip={hint('settings.client_secret')} extra={data?.secret_set ? t('settings.secret_set') : undefined}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="public_url" label={t('settings.public_url')} tooltip={hint('settings.public_url')} rules={[{ pattern: /^(https:\/\/[^\s/]+(\/\S*)?)?$/ }]}><Input placeholder="https://" autoComplete="off" /></Form.Item>
        <Form.Item name="domains" label={t('settings.domains')} tooltip={hint('settings.domains')}><Input autoComplete="off" /></Form.Item>
        {data?.redirect_uri && <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('settings.redirect_uri')} description={<Typography.Text copyable code>{data.redirect_uri}</Typography.Text>} />}
        {tested && <Alert type="success" showIcon style={{ marginBottom: 16 }} message={t('settings.test.ok')} />}
        <Space wrap>
          <Button type="primary" htmlType="submit">{t('common.save')}</Button>
          <Button onClick={test}>{t('settings.test')}</Button>
        </Space>
      </Form>
    </Card>
  );
}
