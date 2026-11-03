/**
 * Page de connexion : comptes locaux, connexion Microsoft compatible avec Portal (standard v3.3, section 8.6), installation.
 * En mode « sso », départ automatique vers Microsoft sauf après une déconnexion, une erreur ou pour l'accès de secours (?local=1).
 */
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Divider, Form, Grid, Input, Select, Spin, Typography } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, WindowsOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import api, { ApiError } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import AppMark from '../components/AppMark';

interface AuthConfig { mode: 'local' | 'sso' | 'sso_optional'; microsoft: boolean; installed: boolean }

/** Départ automatique vers Microsoft : mode sso configuré, sauf après une déconnexion, une erreur ou pour l'accès de secours. */
export function autoSsoAllowed(config: AuthConfig | null, params: URLSearchParams) {
  return !!config && config.mode === 'sso' && config.microsoft && config.installed
    && params.get('deconnecte') !== '1' && !params.get('erreur') && params.get('local') !== '1';
}

/**
 * Chemin de retour accepté : un seul « / » au début, lettres, chiffres et -._~/ seulement, comme côté serveur (standard v3.3, 8.6).
 * « //site.exemple » ou « /\\site » sont ramenés à « / » : le contrôle du gabarit (commence par « / ») les laissait passer.
 */
export function safeNextPath(next: string | null) {
  return next && /^\/(?![/\\])[A-Za-z0-9\-._~/]*$/.test(next) ? next : '/';
}

/** Point unique de navigation complète de la page (remplaçable dans les tests, jsdom ne navigue pas). */
export const redirector = { go: (url: string) => window.location.assign(url) };

export function ssoStartUrl(next: string | null) {
  return `/api/auth/sso/start?next=${encodeURIComponent(safeNextPath(next))}`;
}

export default function LoginPage() {
  const { login, refresh } = useAuth();
  const { t, lang, setLang, hint } = useI18n();
  const { settings, reload } = useSettings();
  const screens = Grid.useBreakpoint();
  const [params] = useSearchParams();
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const next = params.get('next');
  const disconnected = params.get('deconnecte') === '1';
  const ssoError = params.get('erreur');
  const local = params.get('local') === '1';

  useEffect(() => {
    api.get<AuthConfig>('/auth/config').then(setConfig).catch(() => setConfig({ mode: 'local', microsoft: false, installed: settings.installed }));
  }, [settings.installed]);

  const autoSso = autoSsoAllowed(config, params);
  useEffect(() => { if (autoSso) redirector.go(ssoStartUrl(next)); }, [autoSso, next]);

  const run = async (fn: () => Promise<void>) => {
    setLoading(true); setError('');
    try { await fn(); } catch (e) { setError(e instanceof ApiError ? e.message : t('common.error')); } finally { setLoading(false); }
  };
  const onLogin = (v: { email: string; password: string }) => run(async () => { await login(v.email, v.password); redirector.go(safeNextPath(next)); });
  const onInstall = (v: { email: string; first_name: string; last_name: string; password: string }) => run(async () => { await api.post('/install', v); await reload(); await refresh(); });

  const showLocal = !config || config.mode !== 'sso' || local;
  const showMicrosoft = !!config && config.microsoft;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      background: `linear-gradient(135deg, ${settings.theme.primary} 0%, ${settings.theme.menu_bg} 50%, ${settings.theme.login_gradient_end} 100%)` }}>
      <Card style={{ width: screens.sm ? 440 : '100%', maxWidth: 440, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><AppMark /></div>
        <Typography.Title level={1} style={{ fontSize: 18, textAlign: 'center', marginBottom: 16 }}>
          {settings.installed ? t('login.title') : t('install.title')}
        </Typography.Title>
        {disconnected && <Alert type="info" showIcon message={t('login.disconnected')} style={{ marginBottom: 16 }} />}
        {ssoError && <Alert type="error" showIcon message={t(`login.error.${ssoError}`) === `login.error.${ssoError}` ? t('common.error') : t(`login.error.${ssoError}`)} style={{ marginBottom: 16 }} />}
        {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} style={{ marginBottom: 16 }} />}
        {autoSso && <div style={{ textAlign: 'center' }}><Spin /><Typography.Paragraph>{t('login.redirecting')}</Typography.Paragraph></div>}

        {!autoSso && settings.installed && (
          <>
            {showMicrosoft && (
              <Button block size="large" icon={<WindowsOutlined />} onClick={() => redirector.go(ssoStartUrl(next))}
                style={{ background: '#0078d4', color: '#fff', height: 48, marginBottom: showLocal ? 8 : 0 }}>{t('login.microsoft')}</Button>
            )}
            {showMicrosoft && showLocal && <Divider plain>{t('login.local')}</Divider>}
            {showLocal && (
              <Form onFinish={onLogin} size="large" layout="vertical" requiredMark={false}>
                <Form.Item name="email" label={t('login.email')} tooltip={hint('login.email')} rules={[{ required: true }]}><Input prefix={<UserOutlined />} autoComplete="username" /></Form.Item>
                <Form.Item name="password" label={t('login.password')} tooltip={hint('login.password')} rules={[{ required: true }]}><Input.Password prefix={<LockOutlined />} autoComplete="current-password" /></Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44 }}>{t('login.submit')}</Button>
              </Form>
            )}
          </>
        )}

        {!settings.installed && (
          <Form onFinish={onInstall} layout="vertical" requiredMark={false}>
            <Typography.Paragraph type="secondary">{t('install.intro')}</Typography.Paragraph>
            <Form.Item name="email" label={t('users.field.email')} tooltip={hint('install.email')} rules={[{ required: true, type: 'email' }]}><Input prefix={<MailOutlined />} autoComplete="email" /></Form.Item>
            <Form.Item name="first_name" label={t('users.field.first_name')} tooltip={hint('install.first_name')} rules={[{ required: true }]}><Input autoComplete="given-name" /></Form.Item>
            <Form.Item name="last_name" label={t('users.field.last_name')} tooltip={hint('install.last_name')} rules={[{ required: true }]}><Input autoComplete="family-name" /></Form.Item>
            <Form.Item name="password" label={t('login.password')} tooltip={hint('install.password')} extra={t('install.password.help')} rules={[{ required: true, min: 12 }]}><Input.Password autoComplete="new-password" /></Form.Item>
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
