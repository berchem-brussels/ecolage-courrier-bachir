/**
 * Connexion Microsoft compatible avec Portal, côté interface (standard v3.3, section 8.6) :
 * départ automatique en mode « sso », aucune redirection après une déconnexion, une erreur ou pour l'accès de secours,
 * retour à l'écran demandé contrôlé.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../contexts/I18nContext';
import { SettingsProvider, FALLBACK_SETTINGS } from '../contexts/SettingsContext';
import LoginPage, { autoSsoAllowed, redirector, safeNextPath, ssoStartUrl } from '../pages/LoginPage';

vi.mock('../contexts/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../contexts/AuthContext')>()),
  useAuth: () => ({ user: null, loading: false, isAdmin: false, login: async () => {}, logout: async () => {}, refresh: async () => {}, savePreferences: async () => {} }),
}));

const CONFIG = { mode: 'sso', microsoft: true, installed: true };
function stubConfig(cfg: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ data: cfg, meta: { envelope: 1 } }) })));
}
function mount(search: string, lang: 'fr' | 'nl' = 'fr') {
  return render(
    <SettingsProvider value={{ settings: FALLBACK_SETTINGS, reload: async () => {} }}>
      <I18nProvider defaultLang={lang}><MemoryRouter initialEntries={[`/login${search}`]}><LoginPage /></MemoryRouter></I18nProvider>
    </SettingsProvider>,
  );
}
const settle = () => new Promise((r) => setTimeout(r, 80));

describe('connexion Microsoft : règles', () => {
  it('départ automatique seulement en mode sso, Microsoft prêt, hors les trois exceptions', () => {
    const p = (q: string) => new URLSearchParams(q);
    expect(autoSsoAllowed(CONFIG as never, p(''))).toBe(true);
    expect(autoSsoAllowed(CONFIG as never, p('deconnecte=1'))).toBe(false);
    expect(autoSsoAllowed(CONFIG as never, p('erreur=SSO_TOKEN'))).toBe(false);
    expect(autoSsoAllowed(CONFIG as never, p('local=1'))).toBe(false);
    expect(autoSsoAllowed({ ...CONFIG, mode: 'sso_optional' } as never, p(''))).toBe(false);
    expect(autoSsoAllowed({ ...CONFIG, mode: 'local' } as never, p(''))).toBe(false);
    expect(autoSsoAllowed({ ...CONFIG, microsoft: false } as never, p(''))).toBe(false);
    expect(autoSsoAllowed(null, p(''))).toBe(false);
  });

  it('chemin de retour : adresse complète, « // », « /\\ » ou caractères douteux ramenés à « / »', () => {
    for (const bad of ['https://exemple.com', '//exemple.com', '/\\exemple.com', 'registre', '/registre?x=<script>', '/a b', null, '']) expect(safeNextPath(bad), String(bad)).toBe('/');
    expect(safeNextPath('/registre')).toBe('/registre');
    expect(safeNextPath('/admin/utilisateurs')).toBe('/admin/utilisateurs');
    expect(ssoStartUrl('//exemple.com')).toBe('/api/auth/sso/start?next=%2F');
    expect(ssoStartUrl('/registre')).toBe('/api/auth/sso/start?next=%2Fregistre');
  });
});

describe('page de connexion', () => {
  let go: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { vi.restoreAllMocks(); go = vi.spyOn(redirector, 'go').mockImplementation(() => {}); });

  it('mode sso sans session : part vers Microsoft sans clic, avec l’écran demandé', async () => {
    stubConfig(CONFIG);
    mount('?next=/registre');
    await waitFor(() => expect(go).toHaveBeenCalledWith('/api/auth/sso/start?next=%2Fregistre'));
    expect(go).toHaveBeenCalledTimes(1);
  });

  it('après la déconnexion : message affiché, aucune redirection, bouton Microsoft proposé', async () => {
    stubConfig(CONFIG);
    mount('?deconnecte=1');
    await screen.findByText('Vous êtes déconnecté.');
    await settle();
    expect(go).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Se connecter avec Microsoft/ })).toBeInTheDocument();
  });

  it('erreur de connexion : message traduit, aucune redirection (pas de boucle), en français et en néerlandais', async () => {
    stubConfig(CONFIG);
    const fr = mount('?erreur=SSO_UNKNOWN_ACCOUNT');
    await screen.findByText(/Aucun compte actif ne correspond/);
    await settle();
    expect(go).not.toHaveBeenCalled();
    fr.unmount();
    mount('?erreur=SSO_UNKNOWN_ACCOUNT', 'nl');
    await screen.findByText(/Geen enkel actief account/);
    expect(go).not.toHaveBeenCalled();
  });

  it('accès de secours : formulaire local affiché, aucune redirection', async () => {
    stubConfig(CONFIG);
    mount('?local=1');
    await screen.findByLabelText(/Mot de passe/);
    await settle();
    expect(go).not.toHaveBeenCalled();
  });

  it('mode local : ni redirection ni bouton Microsoft ; mode facultatif : bouton et formulaire, sans redirection', async () => {
    stubConfig({ mode: 'local', microsoft: false, installed: true });
    const a = mount('');
    await screen.findByLabelText(/Mot de passe/);
    await settle();
    expect(go).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Microsoft/ })).toBeNull();
    a.unmount();
    stubConfig({ mode: 'sso_optional', microsoft: true, installed: true });
    mount('');
    await screen.findByRole('button', { name: /Se connecter avec Microsoft/ });
    expect(screen.getByLabelText(/Mot de passe/)).toBeInTheDocument();
    await settle();
    expect(go).not.toHaveBeenCalled();
  });
});
