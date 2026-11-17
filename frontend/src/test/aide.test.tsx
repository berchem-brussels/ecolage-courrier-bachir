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

const LOCAL = [
  { id: 1, topic_id: 'register', question_fr: 'Que faire d\'un courrier abîmé ?', question_nl: 'Wat te doen met een beschadigde brief?', answer_fr: 'Notez-le dans la remarque.', answer_nl: 'Noteer het in de opmerking.', is_active: 1 },
  { id: 2, topic_id: null, question_fr: 'À qui poser une question ?', question_nl: 'Aan wie stel ik een vraag?', answer_fr: 'Au support.', answer_nl: 'Aan de ondersteuning.', is_active: 1 },
  { id: 3, topic_id: 'register', question_fr: 'Ancienne question retirée', question_nl: 'Oude ingetrokken vraag', answer_fr: 'x', answer_nl: 'y', is_active: 0 },
];
const calls: { url: string; method?: string }[] = [];
function stubFaq() {
  calls.length = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { method?: string }) => {
    calls.push({ url, method: init?.method });
    const data = url.startsWith('/api/faq') ? LOCAL : {};
    return { ok: true, status: 200, statusText: 'OK', json: async () => ({ data, meta: { envelope: 1 }, pagination: { total: LOCAL.length, limit: 200, offset: 0 } }) };
  }));
}

describe('FAQ locale', () => {
  it('le panneau de l\'écran montre les questions locales de l\'écran, sans celles qui sont retirées', async () => {
    stubFaq();
    wrap(<HelpButton />, '/registre');
    fireEvent.click(screen.getByRole('button', { name: 'Aide' }));
    await screen.findByText('Que faire d\'un courrier abîmé ?');
    expect(screen.queryByText('Ancienne question retirée')).toBeNull();
    expect(calls.some((c) => c.url === '/api/faq?topic_id=register')).toBe(true);
  });

  it('en néerlandais, la question locale s\'affiche en néerlandais', async () => {
    stubFaq();
    wrap(<HelpButton />, '/registre', 'nl');
    fireEvent.click(screen.getByRole('button', { name: 'Help' }));
    await screen.findByText('Wat te doen met een beschadigde brief?');
  });

  it('centre d\'aide : questions générales et questions d\'écran ; le lecteur ne voit ni bouton d\'ajout ni question retirée', async () => {
    stubFaq();
    held = ['secretariat'];
    wrap(<HelpPage />, '/help');
    await screen.findByText('À qui poser une question ?');
    await screen.findByText('Que faire d\'un courrier abîmé ?');
    expect(screen.queryByText('Ancienne question retirée')).toBeNull();
    expect(screen.queryByRole('button', { name: /Ajouter une question/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retirer' })).toBeNull();
  });

  it('le gestionnaire du registre ajoute, corrige et retire ; il voit aussi les questions retirées', async () => {
    stubFaq();
    held = ['gestionnaire'];
    wrap(<HelpPage />, '/help');
    await screen.findByText('Ancienne question retirée');
    expect(screen.getByRole('button', { name: /Ajouter une question/ })).toBeInTheDocument();
    // Les questions sont repliées : on ouvre une question active, puis la question retirée.
    fireEvent.click(screen.getByText('À qui poser une question ?'));
    await screen.findByRole('button', { name: 'Retirer' });
    expect(screen.getAllByRole('button', { name: 'Modifier' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText('Ancienne question retirée'));
    await screen.findByText('Retirée');
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une question/ }));
    await screen.findByText(/lue par toutes les personnes connectées/);
    for (const label of ['Écran concerné', 'Question en français', 'Question en néerlandais', 'Réponse en français', 'Réponse en néerlandais']) expect(screen.getByText(label)).toBeInTheDocument();
    expect(document.querySelectorAll('.ant-modal .ant-form-item-tooltip').length).toBe(5);
  });

  it('l\'administrateur gère aussi la FAQ ; un agent sans rôle de registre ne la gère pas', async () => {
    stubFaq();
    admin = true;
    const a = wrap(<HelpPage />, '/help');
    await screen.findByRole('button', { name: /Ajouter une question/ });
    a.unmount();
    admin = false; held = ['agent'];
    wrap(<HelpPage />, '/help');
    await screen.findByText('À qui poser une question ?');
    expect(screen.queryByRole('button', { name: /Ajouter une question/ })).toBeNull();
  });

  it('défaut de la 0.2.7 : le choix du parcours n\'est élargi à tout le mode d\'emploi que par un changement de lien', async () => {
    const { needsAll, defaultPath } = await import('../pages/HelpPage');
    expect(needsAll('agent', 'register')).toBe(true);
    expect(needsAll('gestionnaire', 'register')).toBe(false);
    expect(needsAll('all', 'register')).toBe(false);
    expect(needsAll('admin', '')).toBe(false);
    expect(defaultPath(false, ['secretariat', 'auditeur'])).toBe('secretariat');
    expect(defaultPath(true, [])).toBe('admin');
  });

  it('défaut de la 0.2.7 : plus aucune clé brute dans l\'impression complète, titres et questions compris', async () => {
    stubFaq();
    wrap(<HelpPage />, '/help?print=1');
    await waitFor(() => expect(document.querySelectorAll('.help-topic').length).toBe(TOPICS.length));
    expect(document.body.textContent).not.toMatch(/\{\{|\}\}/);
  });
});
