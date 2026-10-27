/**
 * Coquille : thème Ant Design par jetons, clair et sombre, langue d'Ant Design et de dayjs, routes.
 * Patron SAGA App.tsx ; les couleurs viennent des paramètres de l'instance, jamais d'une constante.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin, theme as antTheme } from 'antd';
import frFR from 'antd/locale/fr_FR';
import nlNL from 'antd/locale/nl_NL';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/fr';
import 'dayjs/locale/nl';
import utc from 'dayjs/plugin/utc';
import { AuthProvider, auditRoles, registerRoles, useAuth } from './contexts/AuthContext';
import { I18nProvider, useI18n } from './contexts/I18nContext';
import { SettingsProvider, type InstanceSettings } from './contexts/SettingsContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import { loadSettings, applyThemeVariables } from './settings';

const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const RegistrationPage = React.lazy(() => import('./pages/RegistrationPage'));
const InboxPage = React.lazy(() => import('./pages/InboxPage'));
const ConsultationsPage = React.lazy(() => import('./pages/ConsultationsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ContactsPage = React.lazy(() => import('./pages/ContactsPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const EntitiesPage = React.lazy(() => import('./pages/EntitiesPage'));
const ServicesPage = React.lazy(() => import('./pages/ServicesPage'));
const TypesPage = React.lazy(() => import('./pages/TypesPage'));
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));
const AccessibilityPage = React.lazy(() => import('./pages/AccessibilityPage'));

dayjs.extend(localizedFormat);
dayjs.extend(utc);

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function buildTheme(s: InstanceSettings, dark: boolean) {
  const base = {
    token: { colorPrimary: s.theme.primary, borderRadius: 6, fontFamily: FONT },
    components: {
      Menu: { darkItemBg: 'transparent', darkSubMenuItemBg: 'transparent', darkItemSelectedBg: 'rgba(173,212,204,0.2)', darkItemHoverBg: 'rgba(255,255,255,0.08)' },
      Card: { headerFontSize: 14 },
    },
  };
  if (dark) {
    return {
      algorithm: antTheme.darkAlgorithm,
      token: { ...base.token, colorLink: s.theme.primary_text_dark, colorBgLayout: '#141414', colorBgContainer: '#1f1f1f' },
      // Boutons de choix (Radio en boutons) : en sombre, la couleur principale employée comme texte est primary_text_dark,
      // la couleur de l'institution n'atteignant pas le contraste AA sur fond noir (défaut relevé en 0.2.0, présent depuis 0.1.0).
      components: { ...base.components, Table: { headerBg: '#262626', rowHoverBg: 'rgba(95,184,173,0.12)' }, Tabs: { itemSelectedColor: s.theme.primary_text_dark, inkBarColor: s.theme.primary_text_dark },
        Radio: { colorPrimary: s.theme.primary_text_dark, colorPrimaryHover: s.theme.primary_text_dark, colorPrimaryActive: s.theme.primary_text_dark } },
    };
  }
  return {
    token: { ...base.token, colorLink: s.theme.primary, colorText: '#444', colorTextSecondary: '#666', colorBgLayout: '#f6f6f6', colorBgContainer: '#ffffff' },
    components: { ...base.components, Table: { headerBg: '#f6f6f6', rowHoverBg: 'rgba(173,212,204,0.25)' } },
  };
}

function Loading() {
  return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
}

function AdminOnly({ children }: { children: React.ReactElement }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

/** Écran d'arrivée : le registre pour qui le tient, le journal pour l'auditeur, les entités et registres pour l'administrateur, l'accueil sinon. */
function Landing() {
  const { user, isAdmin } = useAuth();
  if (registerRoles(user).length > 0) return <Navigate to="/registre" replace />;
  if (auditRoles(user).length > 0) return <Navigate to="/consultations" replace />;
  return <Navigate to={isAdmin ? '/admin/registres' : '/accueil'} replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return (
    <React.Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<Landing />} />
          <Route path="accueil" element={<HomePage />} />
          <Route path="registre" element={<RegisterPage />} />
          <Route path="enregistrer" element={<RegistrationPage />} />
          <Route path="a-enregistrer" element={<InboxPage />} />
          <Route path="consultations" element={<ConsultationsPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="admin/utilisateurs" element={<AdminOnly><UsersPage /></AdminOnly>} />
          <Route path="admin/registres" element={<AdminOnly><EntitiesPage /></AdminOnly>} />
          <Route path="admin/services" element={<AdminOnly><ServicesPage /></AdminOnly>} />
          <Route path="admin/types" element={<TypesPage />} />
          <Route path="admin/parametres" element={<AdminOnly><SettingsPage /></AdminOnly>} />
          <Route path="help" element={<HelpPage />} />
          <Route path="accessibility" element={<AccessibilityPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}

/** Applique thème et langue de la personne connectée (préférences en base). */
function Themed({ settings, children }: { settings: InstanceSettings; children: React.ReactNode }) {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();
  const dark = user?.theme === 'sombre';
  React.useEffect(() => { if (user?.preferred_lang) setLang(user.preferred_lang); }, [user?.preferred_lang, setLang]);
  React.useEffect(() => { document.body.classList.toggle('app-dark', dark); }, [dark]);
  React.useEffect(() => { dayjs.locale(lang); }, [lang]);
  const theme = useMemo(() => buildTheme(settings, dark), [settings, dark]);
  return <ConfigProvider theme={theme} locale={lang === 'nl' ? nlNL : frFR}>{children}</ConfigProvider>;
}

export default function App({ initialSettings }: { initialSettings: InstanceSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const reload = useCallback(async () => {
    const s = await loadSettings();
    applyThemeVariables(s);
    setSettings(s);
  }, []);
  return (
    <SettingsProvider value={{ settings, reload }}>
      <BrowserRouter>
        <I18nProvider defaultLang={settings.app.default_lang}>
          <AuthProvider>
            <Themed settings={settings}>
              <AppRoutes />
            </Themed>
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </SettingsProvider>
  );
}
