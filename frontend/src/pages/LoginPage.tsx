/**
 * Page de connexion (patron SAGA LoginPage.tsx) : dégradé aux couleurs de l'institution, carte de 440 px,
 * sélecteur de langue. Tant qu'aucun compte n'existe, la carte présente l'assistant d'installation du premier administrateur.
 * Le bouton Microsoft (SSO préconisé) s'ajoute avec le patron OpenID Connect de PILOT : non inclus dans le gabarit.
 */
import { useState } from 'react';
import { Alert, Button, Card, Form, Grid, Input, Select, Typography } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import api, { ApiError } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import AppMark from '../components/AppMark';

export default function LoginPage() {
  const { login, refresh } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { settings, reload } = useSettings();
  const screens = Grid.useBreakpoint();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError('');
    try { await fn(); } catch (e) { setError(e instanceof ApiError ? e.message : t('common.error')); } finally { setLoading(false); }
  };

  const onLogin = (v: { email: string; password: string }) => run(() => login(v.email, v.password));
  const onInstall = (v: { email: string; first_name: string; last_name: string; password: string }) => run(async () => {
    await api.post('/install', v);
    await reload();
    await refresh();
  });

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      background: `linear-gradient(135deg, ${settings.theme.primary} 0%, ${settings.theme.menu_bg} 50%, ${settings.theme.login_gradient_end} 100%)` }}>
      <Card style={{ width: screens.sm ? 440 : '100%', maxWidth: 440, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><AppMark /></div>
        <Typography.Title level={1} style={{ fontSize: 18, textAlign: 'center', marginBottom: 16 }}>
          {settings.installed ? t('login.title') : t('install.title')}
        </Typography.Title>
        {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} style={{ marginBottom: 16 }} />}

        {settings.installed ? (
          <Form onFinish={onLogin} size="large" layout="vertical" requiredMark={false}>
            <Form.Item name="email" label={t('login.email')} rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label={t('login.password')} rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44 }}>{t('login.submit')}</Button>
          </Form>
        ) : (
          <Form onFinish={onInstall} layout="vertical" requiredMark={false}>
            <Typography.Paragraph type="secondary">{t('install.intro')}</Typography.Paragraph>
            <Form.Item name="email" label={t('users.field.email')} rules={[{ required: true, type: 'email' }]}><Input prefix={<MailOutlined />} autoComplete="email" /></Form.Item>
            <Form.Item name="first_name" label={t('users.field.first_name')} rules={[{ required: true }]}><Input autoComplete="given-name" /></Form.Item>
            <Form.Item name="last_name" label={t('users.field.last_name')} rules={[{ required: true }]}><Input autoComplete="family-name" /></Form.Item>
            <Form.Item name="password" label={t('login.password')} extra={t('install.password.help')} rules={[{ required: true, min: 12 }]}>
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44 }}>{t('install.submit')}</Button>
          </Form>
        )}

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Select size="small" aria-label={t('layout.lang')} value={lang} onChange={setLang} style={{ width: 120 }}
            options={[{ value: 'fr', label: 'Français' }, { value: 'nl', label: 'Nederlands' }]} />
        </div>
      </Card>
    </main>
  );
}
