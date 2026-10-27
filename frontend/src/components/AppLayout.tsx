/**
 * Mise en page (patron SAGA AppLayout.tsx, standard v3.2 section 12.3) :
 * menu latéral sombre de 230 px replié à 80 px, tiroir de 260 px sous 768 px, en-tête blanc de 56 px collant,
 * bascule Simple ou Complet, langue, thème, menu de l'utilisateur, lien d'évitement, chatbot.
 */
import { useState } from 'react';
import { Avatar, Button, Drawer, Dropdown, Grid, Layout, Menu, Segmented, Select, Tag, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  TeamOutlined, QuestionCircleOutlined, EyeOutlined, MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, LockOutlined, SunOutlined, MoonOutlined,
  BookOutlined, FormOutlined, ContactsOutlined, ApartmentOutlined, TagsOutlined, NumberOutlined, HomeOutlined,
  InboxOutlined, AuditOutlined, SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { auditRoles, registerRoles, useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import AppMark from './AppMark';
import Chatbot from './Chatbot';
import PasswordModal from './PasswordModal';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const screens = Grid.useBreakpoint();
  // Grid.useBreakpoint() est vide au premier rendu : on attend la vraie valeur (piège SAGA 84)
  const isMobile = screens.md === false;
  // Sous 992 px, le nom de la personne et la bascule de thème quittent l'en-tête (le thème passe dans son menu).
  const compact = screens.lg === false;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const { user, isAdmin, logout, savePreferences } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const dark = user?.theme === 'sombre';

  // Menus de confort : le serveur recontrôle chaque appel (standard v3.2, section 8.4).
  const keepsRegister = registerRoles(user).length > 0;
  const audits = auditRoles(user).length > 0;
  const managesTypes = isAdmin || (user?.entity_roles || []).some((r) => r.role === 'gestionnaire');
  const admin = [
    ...(isAdmin ? [{ key: '/admin/utilisateurs', icon: <TeamOutlined />, label: t('nav.users') },
      { key: '/admin/registres', icon: <NumberOutlined />, label: t('nav.entities') },
      { key: '/admin/services', icon: <ApartmentOutlined />, label: t('nav.services') },
      { key: '/admin/parametres', icon: <SettingOutlined />, label: t('nav.settings') }] : []),
    ...(managesTypes ? [{ key: '/admin/types', icon: <TagsOutlined />, label: t('nav.types') }] : []),
  ];
  const menuItems: MenuProps['items'] = [
    { type: 'group', label: t('nav.group.main'), children: [
      ...(keepsRegister ? [
        { key: '/registre', icon: <BookOutlined />, label: t('nav.register') },
        { key: '/a-enregistrer', icon: <InboxOutlined />, label: t('nav.inbox') },
        { key: '/enregistrer', icon: <FormOutlined />, label: t('nav.registration') },
        { key: '/contacts', icon: <ContactsOutlined />, label: t('nav.contacts') },
      ] : [{ key: '/accueil', icon: <HomeOutlined />, label: t('nav.home') }]),
      ...(audits ? [{ key: '/consultations', icon: <AuditOutlined />, label: t('nav.consultations') }] : []),
    ] },
    ...(admin.length ? [{ type: 'group' as const, label: t('nav.group.admin'), children: admin }] : []),
    { type: 'group', label: t('nav.group.help'), children: [
      { key: '/help', icon: <QuestionCircleOutlined />, label: t('nav.help') },
      { key: '/accessibility', icon: <EyeOutlined />, label: t('nav.accessibility') },
    ] },
  ];

  const go: MenuProps['onClick'] = ({ key }) => { navigate(key); setDrawerOpen(false); };
  const changeLang = (l: 'fr' | 'nl') => { setLang(l); savePreferences({ preferred_lang: l }); };

  const sidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start', padding: collapsed && !isMobile ? '0 8px' : '0 16px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <AppMark collapsed={collapsed && !isMobile} onDark />
      </div>
      <nav aria-label={t('layout.menu')} style={{ flex: 1, overflow: 'auto' }}>
        <Menu mode="inline" theme="dark" selectedKeys={[location.pathname]} items={menuItems} onClick={go}
          style={{ background: 'transparent', border: 'none', marginTop: 8 }} inlineCollapsed={collapsed && !isMobile} />
      </nav>
      {!(collapsed && !isMobile) && (
        <div style={{ padding: '8px 0 12px', textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>
          v{settings.version}
        </div>
      )}
    </div>
  );

  const userMenu: MenuProps = {
    items: [
      ...(compact ? [{ key: 'theme', icon: dark ? <SunOutlined /> : <MoonOutlined />, label: dark ? t('layout.theme.light') : t('layout.theme.dark') }] : []),
      { key: 'password', icon: <LockOutlined />, label: t('layout.password') },
      { key: 'logout', icon: <LogoutOutlined />, label: t('layout.logout') },
    ],
    onClick: ({ key }) => {
      if (key === 'theme') savePreferences({ theme: dark ? 'clair' : 'sombre' });
      else if (key === 'password') setPwdOpen(true);
      else logout();
    },
  };

  const width = collapsed ? 80 : 230;
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <a className="skip-link" href="#main-content">{t('layout.skip')}</a>
      <PasswordModal open={pwdOpen || user?.must_change_password === 1} forced={user?.must_change_password === 1} onClose={() => setPwdOpen(false)} />
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} width={230}
          style={{ background: 'var(--app-menu-bg)', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 10, overflow: 'auto' }}>
          {sidebar}
        </Sider>
      )}
      {isMobile && (
        <Drawer placement="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} width={260}
          styles={{ body: { padding: 0, background: 'var(--app-menu-bg)' }, header: { display: 'none' } }}>
          {sidebar}
        </Drawer>
      )}
      <Layout style={{ marginLeft: isMobile ? 0 : width, transition: 'margin-left 0.2s' }}>
        <Header style={{ padding: '0 16px', background: 'var(--app-bg-container)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--app-border)', position: 'sticky', top: 0, zIndex: 9, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', height: 56 }}>
          <Button type="text" aria-label={t('layout.menu')}
            icon={isMobile || collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed))} />
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 12, minWidth: 0 }}>
            {settings.environment && settings.environment !== 'production' && !isMobile && <Tag color="orange">{t(`env.${settings.environment}`)}</Tag>}
            <Segmented size="small" aria-label={t('layout.mode')} value={user?.ui_mode || 'simple'}
              onChange={(v) => savePreferences({ ui_mode: v as 'simple' | 'complet' })}
              options={[{ label: t('layout.mode.simple'), value: 'simple' }, { label: t('layout.mode.complet'), value: 'complet' }]} />
            <Select size="small" aria-label={t('layout.lang')} value={lang} onChange={changeLang} style={{ width: 64 }}
              options={[{ value: 'fr', label: 'FR' }, { value: 'nl', label: 'NL' }]} />
            {!compact && <Tooltip title={dark ? t('layout.theme.light') : t('layout.theme.dark')}>
              <Button type="text" aria-label={dark ? t('layout.theme.light') : t('layout.theme.dark')}
                icon={dark ? <SunOutlined /> : <MoonOutlined />} onClick={() => savePreferences({ theme: dark ? 'clair' : 'sombre' })} />
            </Tooltip>}
            <Dropdown menu={userMenu} trigger={['click']}>
              <Button type="text" aria-label={`${user?.first_name || ''} ${user?.last_name || ''}`} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: isMobile ? '0 4px' : undefined }}>
                <Avatar size={30} style={{ background: 'var(--app-primary)', flexShrink: 0 }}>{user?.first_name?.[0]}{user?.last_name?.[0]}</Avatar>
                {!compact && <span style={{ fontSize: 12, fontWeight: 500 }}>{user?.first_name} {user?.last_name}</span>}
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content id="main-content" role="main" aria-label={t('layout.main')} style={{ padding: isMobile ? 12 : 24, background: 'var(--app-bg-page)', minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
          <Chatbot />
        </Content>
      </Layout>
    </Layout>
  );
}
