/**
 * Traitement du courrier entrant, version 0.4.0 : ce que chaque rôle voit et peut faire à l'écran (CDC CE-070, CE-071, CE-073, CE-079).
 * Les réponses fictives ont la forme exacte de celles du serveur (traitement.test.js). Chaque test dit ce que la personne voit
 * ET ce qu'elle ne voit pas : le serveur recontrôle tout, l'écran ne propose que ce qui sera accepté.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../contexts/I18nContext';
import { SettingsProvider, FALLBACK_SETTINGS } from '../contexts/SettingsContext';

const state = vi.hoisted(() => ({ user: null as unknown as Record<string, unknown>, isAdmin: false }));
vi.mock('../contexts/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../contexts/AuthContext')>()),
  useAuth: () => ({ user: state.user, loading: false, isAdmin: state.isAdmin, login: async () => {}, logout: async () => {}, refresh: async () => {}, savePreferences: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import TraitementCard from '../components/TraitementCard';
import CloseReasonsCard from '../components/CloseReasonsCard';
import BannettesPage from '../pages/BannettesPage';
import NotificationBell from '../components/NotificationBell';

const reasons = [
  { id: 1, entity_id: 1, label_fr: 'Répondu', label_nl: 'Beantwoord', is_active: 1 },
  { id: 2, entity_id: 1, label_fr: 'Classé sans suite', label_nl: null, is_active: 1 },
];
const none = { take: false, close: false, reopen: false, comment: false };
const base = {
  id: 1, entity_id: 1, status: 'en_traitement' as const,
  taken_by_first_name: 'Agnès', taken_by_last_name: 'Fictive', taken_at: '2026-11-12 09:00:00',
  rights: none,
  timeline: [
    { type: 'reouverture', id: 4, at: '2026-11-14 10:00:00', author_first_name: 'Sec', author_last_name: 'Fictif', note: 'Réponse incomplète' },
    { type: 'cloture', id: 3, at: '2026-11-13 10:00:00', author_first_name: 'Agnès', author_last_name: 'Fictive', close_reason_label_fr: 'Répondu', close_reason_label_nl: 'Beantwoord', note: 'Fini' },
    { type: 'commentaire', id: 2, at: '2026-11-12 11:00:00', author_first_name: 'Chef', author_last_name: 'Fictif', scope: 'entity', body: 'Merci de joindre la décision.' },
    { type: 'prise_en_charge', id: 2, at: '2026-11-12 09:00:00', author_first_name: 'Agnès', author_last_name: 'Fictive' },
    { type: 'attribution', id: 3, kind: 'reattribution', at: '2026-11-11 09:00:00', author_first_name: 'Sec', author_last_name: 'Fictif', service_name_fr: 'Service A fictif', service_name_nl: 'Dienst A',
      from_service_name_fr: 'Service B fictif', from_service_name_nl: 'Dienst B', agent_first_name: 'Agnès', agent_last_name: 'Fictive', reason: 'Compétence du service A' },
    { type: 'consultation', id: 7, at: '2026-11-11 08:30:00', author_first_name: 'Sec', author_last_name: 'Fictif' },
    { type: 'enregistrement', id: 1, at: '2026-11-10 08:00:00', author_first_name: 'Ada', author_last_name: 'Admin' },
  ],
};

const calls: { method: string; url: string; body?: Record<string, unknown> }[] = [];
let detail: Record<string, unknown> = base;
let counts = { a_enregistrer: 0, a_attribuer: 0, mon_service: 2, moi: 1, en_copie: 0, clos: 4 };
let notes: { data: unknown[]; unread: number } = { data: [], unread: 0 };

beforeEach(() => {
  calls.length = 0;
  detail = base;
  counts = { a_enregistrer: 0, a_attribuer: 0, mon_service: 2, moi: 1, en_copie: 0, clos: 4 };
  notes = { data: [], unread: 0 };
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { method?: string; body?: unknown }) => {
    const method = init?.method || 'GET';
    calls.push({ method, url, body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined });
    const reply = (data: unknown, extra: Record<string, unknown> = {}, meta: Record<string, unknown> = {}) => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ data, meta: { envelope: 1, ...meta }, ...extra }) });
    const page = (data: unknown[]) => reply(data, { pagination: { total: data.length, limit: 50, offset: 0 } });
    if (url.startsWith('/api/mails/counts')) return reply(counts);
    if (/^\/api\/mails\/\d+\/(take|close|reopen)$/.test(url)) return reply({ ...detail, status: 'en_traitement' });
    if (/^\/api\/mails\/\d+\/comments$/.test(url)) return reply({ id: 9 });
    if (/^\/api\/mails\/\d+/.test(url)) return reply(detail);
    if (url.startsWith('/api/mails')) return page([]);
    if (url.startsWith('/api/close-reasons') && method === 'GET') return page(reasons);
    if (url.startsWith('/api/close-reasons')) return reply({ id: 3 });
    if (url.startsWith('/api/entities')) return page([{ id: 1, code: 'AC', name_fr: 'Administration communale', name_nl: 'Gemeentebestuur', is_active: 1 }]);
    if (url.startsWith('/api/notifications/read')) return reply({ updated: 1 });
    if (url.startsWith('/api/notifications')) return reply(notes.data, { pagination: { total: notes.data.length, limit: 20, offset: 0 } }, { unread: notes.unread });
    return reply({});
  }));
});

const wrap = (ui: React.ReactElement, lang: 'fr' | 'nl' = 'fr', path = '/') => (
  <SettingsProvider value={{ settings: FALLBACK_SETTINGS, reload: async () => {} }}>
    <I18nProvider defaultLang={lang}><MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter></I18nProvider>
  </SettingsProvider>
);
const field = (label: string) => screen.getAllByLabelText(label).find((e) => e.tagName === 'INPUT')!;
const choose = async (label: string, option: string) => {
  const input = field(label);
  fireEvent.mouseDown(input);
  const hit = await waitFor(() => {
    const list = document.getElementById(input.getAttribute('aria-controls') || '');
    const el = [...(list?.closest('.ant-select-dropdown')?.querySelectorAll('.ant-select-item-option') || [])].find((e) => e.getAttribute('title') === option);
    if (!el) throw new Error(`option introuvable : ${option}`);
    return el;
  });
  fireEvent.click(hit);
};
const posts = (suffix: string) => calls.filter((c) => c.method === 'POST' && c.url.endsWith(suffix));
const settle = () => new Promise((r) => setTimeout(r, 150));

describe('cadre Traitement : ce que chaque rôle voit', () => {
  it('sans droit : ni prise en charge, ni clôture, ni réouverture, ni formulaire de commentaire ; l’état et l’historique se lisent', () => {
    render(wrap(<TraitementCard mail={base as never} onChanged={() => {}} />));
    for (const name of ['Prendre en charge', 'Clore le courrier', 'Rouvrir le courrier', 'Ajouter le commentaire']) expect(screen.queryByRole('button', { name })).toBeNull();
    expect(screen.getByText('Traitement')).toBeTruthy();
    expect(screen.getByText(/Agnès Fictive · /)).toBeTruthy();
    expect(screen.getByText('Merci de joindre la décision.')).toBeTruthy();
    expect(calls.some((c) => c.url.startsWith('/api/close-reasons'))).toBe(false);
  });

  it('courrier pas encore pris en charge : le texte le dit', () => {
    render(wrap(<TraitementCard mail={{ ...base, status: 'enregistre', taken_at: null } as never} onChanged={() => {}} />));
    expect(screen.getByText('Pas encore pris en charge.')).toBeTruthy();
  });

  it('courrier annulé : aucun état de traitement affiché', () => {
    render(wrap(<TraitementCard mail={{ ...base, status: 'annule' } as never} onChanged={() => {}} />));
    expect(screen.queryByText('Pas encore pris en charge.')).toBeNull();
    expect(screen.queryByText(/Pris en charge par/)).toBeNull();
  });

  it('courrier clos : motif, auteur de la clôture et note affichés', () => {
    render(wrap(<TraitementCard mail={{ ...base, status: 'clos', closed_by_first_name: 'Agnès', closed_by_last_name: 'Fictive', closed_at: '2026-11-13 10:00:00', close_reason_label_fr: 'Répondu', close_reason_label_nl: 'Beantwoord', close_note: 'Réponse envoyée' } as never} onChanged={() => {}} />));
    expect(screen.getByText('Motif de clôture')).toBeTruthy();
    expect(screen.getByText('Réponse envoyée')).toBeTruthy();
    expect(screen.getByText(/Clos par/)).toBeTruthy();
  });
});

describe('prise en charge', () => {
  it('l’agent nommé : un clic envoie la prise en charge et la fiche est rendue à la liste', async () => {
    const onChanged = vi.fn();
    render(wrap(<TraitementCard mail={{ ...base, status: 'enregistre', taken_at: null, rights: { ...none, take: true } } as never} onChanged={onChanged} />));
    fireEvent.click(screen.getByRole('button', { name: 'Prendre en charge' }));
    await waitFor(() => expect(posts('/api/mails/1/take').length).toBe(1));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});

describe('clôture', () => {
  it('les motifs de l’entité sont chargés ; sans motif choisi rien n’est envoyé', async () => {
    render(wrap(<TraitementCard mail={{ ...base, rights: { ...none, close: true } } as never} onChanged={() => {}} />));
    await waitFor(() => expect(calls.some((c) => c.url.startsWith('/api/close-reasons?entity_id=1&is_active=1'))).toBe(true));
    fireEvent.click(screen.getByRole('button', { name: 'Clore le courrier' }));
    await settle();
    expect(posts('/api/mails/1/close').length).toBe(0);
  });

  it('motif choisi et note : envoi du motif et de la note', async () => {
    const onChanged = vi.fn();
    render(wrap(<TraitementCard mail={{ ...base, rights: { ...none, close: true } } as never} onChanged={onChanged} />));
    await waitFor(() => expect(calls.some((c) => c.url.startsWith('/api/close-reasons'))).toBe(true));
    await choose('Motif de clôture', 'Répondu');
    fireEvent.change(screen.getByLabelText('Note (facultative)'), { target: { value: '  Réponse envoyée  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clore le courrier' }));
    await waitFor(() => expect(posts('/api/mails/1/close').length).toBe(1));
    expect(posts('/api/mails/1/close')[0].body).toEqual({ close_reason_id: 1, note: 'Réponse envoyée' });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});

describe('réouverture', () => {
  it('motif obligatoire : sans motif rien n’est envoyé, avec motif la réouverture part', async () => {
    render(wrap(<TraitementCard mail={{ ...base, status: 'clos', rights: { ...none, reopen: true } } as never} onChanged={() => {}} />));
    expect(screen.queryByRole('button', { name: 'Clore le courrier' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Rouvrir le courrier' }));
    await settle();
    expect(posts('/api/mails/1/reopen').length).toBe(0);
    fireEvent.change(screen.getByLabelText('Motif de la réouverture'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rouvrir le courrier' }));
    await settle();
    expect(posts('/api/mails/1/reopen').length).toBe(0);
    fireEvent.change(screen.getByLabelText('Motif de la réouverture'), { target: { value: 'Réponse incomplète' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rouvrir le courrier' }));
    await waitFor(() => expect(posts('/api/mails/1/reopen').length).toBe(1));
    expect(posts('/api/mails/1/reopen')[0].body).toEqual({ reason: 'Réponse incomplète' });
  });
});

describe('commentaires', () => {
  it('la portée se choisit à chaque commentaire, sans valeur par défaut : sans portée rien n’est envoyé', async () => {
    render(wrap(<TraitementCard mail={{ ...base, rights: { ...none, comment: true } } as never} onChanged={() => {}} />));
    fireEvent.change(screen.getByLabelText('Votre commentaire'), { target: { value: 'Un commentaire' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le commentaire' }));
    await settle();
    expect(posts('/api/mails/1/comments').length).toBe(0);
    expect((screen.getByRole('radio', { name: 'Le service traitant' }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole('radio', { name: 'Toute l’entité'.replace('’', "'") }) as HTMLInputElement).checked).toBe(false);
  });

  it('portée choisie : le commentaire part avec sa portée, la fiche est relue, le formulaire se vide', async () => {
    const onChanged = vi.fn();
    render(wrap(<TraitementCard mail={{ ...base, rights: { ...none, comment: true } } as never} onChanged={onChanged} />));
    fireEvent.click(screen.getByRole('radio', { name: 'Le service traitant' }));
    fireEvent.change(screen.getByLabelText('Votre commentaire'), { target: { value: '  Note du service  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le commentaire' }));
    await waitFor(() => expect(posts('/api/mails/1/comments').length).toBe(1));
    expect(posts('/api/mails/1/comments')[0].body).toEqual({ scope: 'service', body: 'Note du service' });
    await waitFor(() => expect(calls.some((c) => c.method === 'GET' && c.url === '/api/mails/1')).toBe(true));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    await waitFor(() => expect((screen.getByLabelText('Votre commentaire') as HTMLTextAreaElement).value).toBe(''));
  });

  it('aucun bouton pour modifier ou supprimer un commentaire', () => {
    render(wrap(<TraitementCard mail={{ ...base, rights: { ...none, comment: true } } as never} onChanged={() => {}} />));
    expect(screen.queryByRole('button', { name: /Modifier|Supprimer/ })).toBeNull();
  });
});

describe('historique complet', () => {
  it('toutes les natures d’événement, du plus récent au plus ancien, avec leur auteur, leur motif et leur note', () => {
    render(wrap(<TraitementCard mail={base as never} onChanged={() => {}} />));
    const text = document.body.textContent || '';
    const order = ['Rouvert', 'Clos', 'Commentaire', 'Pris en charge', 'Réattribué au service', 'Fiche consultée', 'Enregistré'];
    const at = order.map((o) => text.indexOf(o, text.indexOf('Historique complet')));
    expect(at.every((i) => i > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(screen.getByText('Réponse incomplète')).toBeTruthy();
    expect(screen.getByText('Fini')).toBeTruthy();
    expect(screen.getByText(/depuis Service B fictif/)).toBeTruthy();
    expect(screen.getByText('Compétence du service A')).toBeTruthy();
  });

  it('en néerlandais, titres, boutons et événements sont traduits', () => {
    render(wrap(<TraitementCard mail={{ ...base, status: 'enregistre', taken_at: null, rights: { ...none, take: true } } as never} onChanged={() => {}} />, 'nl'));
    expect(screen.getByText('Behandeling')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'In behandeling nemen' })).toBeTruthy();
    expect(screen.getByText('Volledige geschiedenis')).toBeTruthy();
    expect(screen.getByText('Dossier geraadpleegd')).toBeTruthy();
  });
});

describe('bannettes et cloche', () => {
  it('agent : onglet « Clos » avec son compteur ; secrétariat : pas d’onglet « Clos »', async () => {
    state.user = { id: 5, email: 'x@exemple.test', first_name: 'T', last_name: 'F', user_role: 'agent', preferred_lang: 'fr', ui_mode: 'simple', theme: 'clair', must_change_password: 0, entity_roles: [{ entity_id: 1, entity_code: 'AC', role: 'agent', service_ids: [10] }] };
    state.isAdmin = false;
    const r = render(wrap(<BannettesPage />, 'fr', '/bannettes'));
    expect(await screen.findByRole('tab', { name: /Clos \(4\)/ })).toBeTruthy();
    r.unmount();
    state.user = { ...state.user, entity_roles: [{ entity_id: 1, entity_code: 'AC', role: 'secretariat', service_ids: [] }] };
    render(wrap(<BannettesPage />, 'fr', '/bannettes'));
    await screen.findByRole('tab', { name: /À attribuer/ });
    expect(screen.queryByRole('tab', { name: /Clos/ })).toBeNull();
  });

  it('cloche : les trois natures ajoutées en 0.4.0 ont leur texte, sans objet ni expéditeur', async () => {
    notes = { unread: 3, data: [
      { id: 1, kind: 'commente', mail_id: 1, mail_number: 'AC-2026-000001', entity_code: 'AC', created_at: '2026-11-12 09:00:00', read_at: null },
      { id: 2, kind: 'clos', mail_id: 2, mail_number: 'AC-2026-000002', entity_code: 'AC', created_at: '2026-11-12 09:00:00', read_at: null },
      { id: 3, kind: 'rouvert', mail_id: 3, mail_number: 'AC-2026-000003', entity_code: 'AC', created_at: '2026-11-12 09:00:00', read_at: null },
    ] };
    render(wrap(<NotificationBell />));
    fireEvent.click(await screen.findByRole('button', { name: /Notifications|Meldingen/ }));
    expect(await screen.findByText('Courrier clos')).toBeTruthy();
    expect(screen.getByText('Courrier rouvert')).toBeTruthy();
    expect(screen.getByText(/Nouveau commentaire/)).toBeTruthy();
  });
});

describe('motifs de clôture (administration)', () => {
  it('liste de l’entité, ajout et modification ; la désactivation demande un motif', async () => {
    render(wrap(<CloseReasonsCard entityId={1} />));
    expect(await screen.findByText('Répondu')).toBeTruthy();
    expect(screen.getByText('Classé sans suite')).toBeTruthy();
    expect(screen.getByText('NL manquant')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Nouveau motif/ }));
    fireEvent.change(await screen.findByLabelText('Libellé en français'), { target: { value: 'Transmis' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(posts('/api/close-reasons').length).toBe(1));
    expect(posts('/api/close-reasons')[0].body).toEqual({ label_fr: 'Transmis', label_nl: null, entity_id: 1 });
    fireEvent.click(screen.getAllByRole('button', { name: 'Désactiver' })[0]);
    const ok = (await screen.findAllByRole('button', { name: 'Désactiver' })).find((b) => b.classList.contains('ant-btn-primary'))!;
    expect((ok as HTMLButtonElement).disabled).toBe(true);
  });
});
