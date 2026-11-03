/** Aide par écran côté interface (standard v3.3, section 13.1) : panneau de l'écran, centre d'aide, parcours par rôle, recherche, impression. */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../contexts/I18nContext';
import { SettingsProvider, FALLBACK_SETTINGS } from '../contexts/SettingsContext';
import HelpButton from '../help/HelpButton';
import HelpPage from '../pages/HelpPage';
import { TOPICS } from '../help';

let held: string[] = [];
let admin = false;
vi.mock('../contexts/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../contexts/AuthContext')>()),
  useAuth: () => ({ user: { id: 1, user_role: admin ? 'admin' : 'agent', entity_roles: held.map((role) => ({ entity_id: 1, entity_code: 'AC', role })) }, loading: false, isAdmin: admin, login: async () => {}, logout: async () => {}, refresh: async () => {}, savePreferences: async () => {} }),
}));

beforeEach(() => { held = []; admin = false; vi.stubGlobal('print', vi.fn()); });

const wrap = (node: React.ReactNode, path: string, lang: 'fr' | 'nl' = 'fr') => render(
  <SettingsProvider value={{ settings: { ...FALLBACK_SETTINGS, app: { ...FALLBACK_SETTINGS.app, support_contact: 'Le support de test' } }, reload: async () => {} }}>
    <I18nProvider defaultLang={lang}><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></I18nProvider>
  </SettingsProvider>,
);

describe('panneau d\'aide d\'un écran', () => {
  it('le bouton Aide ouvre la fiche de l\'écran en cours, libellés réels à la place des clés', async () => {
    wrap(<HelpButton />, '/registre');
    fireEvent.click(screen.getByRole('button', { name: 'Aide' }));
    await screen.findByText(/Cet écran liste les courriers enregistrés/);
    expect(screen.getByText('Retrouver un courrier')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Mode d'emploi complet" })).toHaveAttribute('href', '/help#help-register');
    expect(document.body.textContent).not.toMatch(/\{\{|\}\}/);
    expect(document.body.textContent).toContain('« Enregistrer un courrier »');
  });

  it('en néerlandais, fiche et libellés en néerlandais', async () => {
    wrap(<HelpButton />, '/registre', 'nl');
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    await screen.findByText(/Dit scherm toont de ingeschreven brieven/);
    expect(screen.getByText('Een brief terugvinden')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\{\{|\}\}/);
  });

  it('une procédure se déplie : étapes, résultat et erreurs lisibles', async () => {
    wrap(<HelpButton />, '/enregistrer');
    fireEvent.click(screen.getByRole('button', { name: 'Aide' }));
    fireEvent.click(await screen.findByText('Enregistrer un courrier reçu'));
    await screen.findByText(/Vérifiez/);
    expect(screen.getAllByText('Résultat :').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Si ça ne marche pas :').length).toBeGreaterThan(0);
  });

  it('aucun bouton Aide sur un écran sans fiche', () => {
    wrap(<HelpButton />, '/login');
    expect(screen.queryByRole('button', { name: 'Aide' })).toBeNull();
  });
});

describe('centre d\'aide', () => {
  it('parcours par défaut selon le rôle : le gestionnaire lit la tenue du registre, pas l\'administration des comptes', async () => {
    held = ['gestionnaire'];
    wrap(<HelpPage />, '/help');
    await screen.findByText('Types de courrier');
    expect(screen.getAllByText('Enregistrer un courrier').length).toBeGreaterThan(0);
    expect(screen.queryByText('Utilisateurs')).toBeNull();
    expect(screen.queryByText('Journal des consultations')).toBeNull();
  });

  it('parcours de l\'administrateur : comptes, registres, services, paramètres', async () => {
    admin = true;
    wrap(<HelpPage />, '/help');
    await screen.findByText('Utilisateurs');
    expect(screen.getByText('Entités et registres')).toBeInTheDocument();
    expect(screen.getByText('Paramètres')).toBeInTheDocument();
    expect(screen.queryByText('Journal des consultations')).toBeNull();
  });

  it('un lien vers une fiche hors du parcours élargit à tout le mode d\'emploi', async () => {
    held = ['agent'];
    wrap(<HelpPage />, '/help#help-register');
    await screen.findByText('Registre des entrées');
  });

  it('recherche plein texte : seules les fiches qui contiennent le mot restent', async () => {
    held = ['gestionnaire'];
    wrap(<HelpPage />, '/help');
    await screen.findByText('Types de courrier');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher' }), { target: { value: 'recommandé' } });
    await waitFor(() => expect(screen.queryByText('Types de courrier')).toBeNull());
    expect(screen.getAllByText('Enregistrer un courrier').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher' }), { target: { value: 'zzzzzz' } });
    await screen.findByText('Aucune fiche ne correspond à la recherche.');
  });

  it('impression : toutes les fiches, procédures dépliées, sans filtre ni recherche', async () => {
    wrap(<HelpPage />, '/help?print=1');
    await waitFor(() => expect(document.querySelectorAll('.help-topic').length).toBe(TOPICS.length));
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getAllByText('Résultat :').length).toBeGreaterThan(20);
    await waitFor(() => expect(window.print).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('contact du support en paramètre, jamais une personne dans le texte', async () => {
    admin = true;
    wrap(<HelpPage />, '/help');
    await screen.findByText('Le support de test');
  });
});
