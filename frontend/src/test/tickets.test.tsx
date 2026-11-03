/**
 * Tickets côté interface (standard v3.3, section 13.5) : choix de l'entité, aucune capture sur les écrans qui affichent du courrier,
 * contexte sans donnée de courrier, liste des écrans alignée sur celle du serveur.
 */
import React from 'react';
import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../contexts/I18nContext';
import { SettingsProvider, FALLBACK_SETTINGS } from '../contexts/SettingsContext';
import ReportTicketModal from '../components/ReportTicketModal';
import TicketSettingsCard from '../components/TicketSettingsCard';
import { SCREENS, screenForPath } from '../screens';

let entityRoles: { entity_id: number; entity_code: string; role: string }[] = [];
vi.mock('../contexts/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../contexts/AuthContext')>()),
  useAuth: () => ({ user: { id: 1, user_role: 'agent', entity_roles: entityRoles }, loading: false, isAdmin: false, login: async () => {}, logout: async () => {}, refresh: async () => {}, savePreferences: async () => {} }),
}));

const posted: { url: string; body: Record<string, unknown> }[] = [];
beforeEach(() => {
  posted.length = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
    if (init?.method === 'POST') posted.push({ url, body: JSON.parse(String(init.body)) });
    const data = url.startsWith('/api/settings/tickets')
      ? { sla: { P1: [1, 8], P2: [4, 24], P3: [8, 72], P4: [24, 240] }, reopen_days: 14, business_roles: ['gestionnaire'], it_roles: ['admin'], role_codes: ['admin', 'agent', 'chef_service', 'secretariat', 'gestionnaire', 'auditeur'] }
      : { reference: 'TCK-2026-00001' };
    return { ok: true, status: 200, statusText: 'OK', json: async () => ({ data, meta: { envelope: 1 } }) };
  }));
});

const AC = { entity_id: 1, entity_code: 'AC', role: 'secretariat' };
const CPAS = { entity_id: 2, entity_code: 'CPAS', role: 'secretariat' };
function modal(pathname: string, lang: 'fr' | 'nl' = 'fr') {
  return render(
    <SettingsProvider value={{ settings: { ...FALLBACK_SETTINGS, version: '0.2.6' }, reload: async () => {} }}>
      <I18nProvider defaultLang={lang}><MemoryRouter initialEntries={[pathname]}><ReportTicketModal open onClose={() => {}} /></MemoryRouter></I18nProvider>
    </SettingsProvider>,
  );
}

describe('signalement', () => {
  it('écran qui affiche du courrier : aucune capture proposée, explication affichée', async () => {
    entityRoles = [AC];
    modal('/registre');
    await screen.findByText(/Aucune capture sur cet écran/);
    expect(document.querySelector('input[type=file]')).toBeNull();
  });

  it('autre écran : capture facultative avec avertissement, champ nommé', async () => {
    entityRoles = [AC];
    modal('/contacts');
    await screen.findByText(/N'envoyez aucune capture/);
    const f = document.querySelector('input[type=file]') as HTMLInputElement;
    expect(f).toBeTruthy();
    expect(f.id).toBe('ticket-screenshot');
    expect(f.name).toBe('screenshot');
  });

  it('une seule entité : aucun choix d\'entité ; deux entités : choix obligatoire pour une question', async () => {
    entityRoles = [AC];
    const one = modal('/contacts');
    await screen.findByText(/Écran joint automatiquement/);
    expect(screen.queryByText('Entité concernée')).toBeNull();
    one.unmount();
    entityRoles = [AC, CPAS];
    modal('/contacts');
    await screen.findByText('Entité concernée');
    expect(screen.getByRole('radio', { name: 'CPAS' })).toBeInTheDocument();
  });

  it('envoi : écran nommé par son identifiant, entité choisie, chemin sans paramètre, aucune capture sur un écran de courrier', async () => {
    entityRoles = [AC, CPAS];
    modal('/registre?entite=AC&statut=enregistre', 'fr');
    await screen.findByText('Entité concernée');
    fireEvent.click(screen.getByRole('radio', { name: 'CPAS' }));
    fireEvent.change(document.querySelector('#title') as HTMLInputElement, { target: { value: 'Une question' } });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    await waitFor(() => expect(posted.length).toBe(1));
    const b = posted[0].body as { screen: string; entity_id: number; context: { path: string; version: string }; screenshot?: string };
    expect(posted[0].url).toBe('/api/tickets');
    expect(b.screen).toBe('register');
    expect(b.entity_id).toBe(2);
    expect(b.context.path).toBe('/registre');
    expect(b.context.version).toBe('0.2.6');
    expect(b.screenshot).toBeUndefined();
  });

  it('néerlandais : titres traduits', async () => {
    entityRoles = [AC];
    modal('/contacts', 'nl');
    await screen.findByText('Melden');
    expect(screen.getByText('Schermafbeelding (facultatief)')).toBeInTheDocument();
  });
});

describe('écrans et réglages', () => {
  it('liste des écrans alignée sur le serveur : les écrans sans capture sont les mêmes des deux côtés', () => {
    const src = fs.readFileSync(path.resolve(process.cwd(), '..', 'backend', 'src', 'services', 'tickets.js'), 'utf8');
    const m = /NO_CAPTURE_SCREENS = new Set\(\[([^\]]*)\]\)/.exec(src);
    const server = (m ? [...m[1].matchAll(/'([a-z-]+)'/g)].map((x) => x[1]) : []).sort();
    expect(server.length).toBeGreaterThan(0);
    expect(SCREENS.filter((s) => s.noCapture).map((s) => s.id).sort()).toEqual(server);
  });

  it('chaque route du menu a son identifiant d\'écran, une seule fois', () => {
    const app = fs.readFileSync(path.resolve(process.cwd(), 'src', 'App.tsx'), 'utf8');
    const routes = [...app.matchAll(/<Route path="([a-z][a-z/-]*)"/g)].map((m) => `/${m[1]}`);
    expect(routes.length).toBeGreaterThan(10);
    for (const r of routes) expect(screenForPath(r), r).toBeTruthy();
    expect(new Set(SCREENS.map((s) => s.id)).size).toBe(SCREENS.length);
    expect(screenForPath('/registre/')?.id).toBe('register');
    expect(screenForPath('/inconnu')).toBeUndefined();
  });

  it('réglages des tickets : rôles de chaque file et délais affichés, en français et en néerlandais', async () => {
    for (const [lang, titre, role] of [['fr', 'Rôles de la file métier', 'Gestionnaire du registre'], ['nl', 'Rollen van de functionele wachtrij', 'Registerbeheerder']] as const) {
      const r = render(<I18nProvider defaultLang={lang}><TicketSettingsCard /></I18nProvider>);
      await screen.findByText(titre);
      expect(screen.getAllByText(role).length).toBeGreaterThan(0);
      await waitFor(() => expect((document.querySelector('input[id="sla_P1_0"]') as HTMLInputElement)?.value).toBe('1'));
      r.unmount();
    }
  });
});
