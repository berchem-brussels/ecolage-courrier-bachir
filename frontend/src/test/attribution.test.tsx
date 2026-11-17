/**
 * Attribution et bannettes, version 0.3.0 : ce que chaque rôle voit et peut faire à l'écran (CDC CE-060 à CE-062, CE-120, CE-140).
 * Les réponses fictives ont la forme exacte de celles du serveur (attribution.test.js du serveur). Chaque test dit ce que le rôle
 * voit ET ce qu'il ne voit pas : le serveur recontrôle tout, l'écran ne propose que ce qui sera accepté.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { I18nProvider } from '../contexts/I18nContext';
import { SettingsProvider, FALLBACK_SETTINGS } from '../contexts/SettingsContext';

type Role = { entity_id: number; entity_code: string; role: string; service_ids?: number[] };
const state = vi.hoisted(() => ({ user: null as unknown as Record<string, unknown>, isAdmin: false }));
vi.mock('../contexts/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../contexts/AuthContext')>()),
  useAuth: () => ({ user: state.user, loading: false, isAdmin: state.isAdmin, login: async () => {}, logout: async () => {}, refresh: async () => {}, savePreferences: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import AttributionCard from '../components/AttributionCard';
import MailDrawer, { type Mail } from '../components/MailDrawer';
import BannettesPage from '../pages/BannettesPage';
import UsersPage from '../pages/UsersPage';
import NotificationBell from '../components/NotificationBell';

const setUser = (roles: Role[], extra: Record<string, unknown> = {}, admin = false) => {
  state.user = { id: 5, email: 'x@exemple.test', first_name: 'Test', last_name: 'Fictif', user_role: admin ? 'admin' : 'agent', preferred_lang: 'fr', ui_mode: 'simple', theme: 'clair', must_change_password: 0, entity_roles: roles, ...extra };
  state.isAdmin = admin;
};

const entities = [{ id: 1, code: 'AC', name_fr: 'Administration communale', name_nl: 'Gemeentebestuur', is_active: 1 }, { id: 2, code: 'CPAS', name_fr: 'Centre public d’action sociale', name_nl: 'OCMW', is_active: 1 }];
const services = [
  { id: 10, name_fr: 'Service A fictif', name_nl: 'Dienst A', entity_ids: [1], is_active: 1 },
  { id: 11, name_fr: 'Service B fictif', name_nl: 'Dienst B', entity_ids: [1, 2], is_active: 1 },
];
const members = [{ id: 21, first_name: 'Agnès', last_name: 'Fictive', role: 'agent', entity_id: 1 }, { id: 22, first_name: 'Chef', last_name: 'Fictif', role: 'chef_service', entity_id: 1 }];
const base = {
  id: 1, number: 'AC-2026-000001', entity_id: 1, entity_code: 'AC', year: 2026, seq: 1, received_date: '2026-11-10', registered_at: '2026-11-10 08:00:00', channel: 'courrier', tracking_number: null,
  sender_contact_id: 1, sender_kind: 'personne', sender_name: 'Exemple', sender_first_name: 'Marie', sender_organisation: null, sender_is_demo: 1, addressee_name: null,
  subject: 'Objet fictif de test', type_id: 1, type_label_fr: 'Demande', type_label_nl: 'Aanvraag', lang: 'fr', urgency: 'normale', sender_reference: null, document_date: null, pieces_count: null,
  notes: null, status: 'enregistre', cancel_reason: null, created_by_first_name: 'Ada', created_by_last_name: 'Admin', created_at: '2026-11-10 08:00:00', updated_at: '2026-11-10 08:00:00',
  service_id: null, service_name_fr: null, service_name_nl: null, agent_id: null, agent_first_name: null, agent_last_name: null, attributed_at: null, return_reason: null, returned_at: null,
  files_count: 0, pieces: [], copies: [], attributions: [],
};
const rightsNone = { edit: false, cancel: false, attribute: false, set_agent: false, return_to_secretariat: false };
const asRegister = { ...rightsNone, edit: true, cancel: true, attribute: true, set_agent: true };
const attributed = { ...base, service_id: 10, service_name_fr: 'Service A fictif', service_name_nl: 'Dienst A', agent_id: 21, agent_first_name: 'Agnès', agent_last_name: 'Fictive',
  copies: [{ service_id: 11, name_fr: 'Service B fictif', name_nl: 'Dienst B' }],
  attributions: [{ id: 3, kind: 'reattribution', service_id: 10, service_name_fr: 'Service A fictif', service_name_nl: 'Dienst A', from_service_id: 11, from_service_name_fr: 'Service B fictif', from_service_name_nl: 'Dienst B',
    agent_id: 21, agent_first_name: 'Agnès', agent_last_name: 'Fictive', from_agent_id: null, from_agent_first_name: null, from_agent_last_name: null, copies: null, reason: 'Compétence du service A',
    author_id: 9, author_first_name: 'Sec', author_last_name: 'Fictif', created_at: '2026-11-11 09:00:00' }] };

const calls: { method: string; url: string; body?: unknown }[] = [];
let detail: Record<string, unknown> = base;
let counts = { a_enregistrer: 2, a_attribuer: 1, mon_service: 3, moi: 1, en_copie: 0 };
let mailList: unknown[] = [];
let notes: { data: unknown[]; unread: number } = { data: [], unread: 0 };
let usersList: unknown[] = [];

beforeEach(() => {
  calls.length = 0;
  detail = base; mailList = []; notes = { data: [], unread: 0 }; usersList = [];
  counts = { a_enregistrer: 2, a_attribuer: 1, mon_service: 3, moi: 1, en_copie: 0 };
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { method?: string; body?: unknown }) => {
    const method = init?.method || 'GET';
    calls.push({ method, url, body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined });
    const reply = (data: unknown, extra: Record<string, unknown> = {}, meta: Record<string, unknown> = {}) => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ data, meta: { envelope: 1, ...meta }, ...extra }) });
    const page = (data: unknown[]) => reply(data, { pagination: { total: data.length, limit: 50, offset: 0 } });
    if (url.startsWith('/api/mails/counts')) return reply(counts);
    if (/^\/api\/mails\/\d+\/(attribution|agent)$/.test(url) && method === 'PUT') return reply({ ...detail, ...(init?.body ? JSON.parse(init.body as string) : {}), rights: asRegister });
    if (/^\/api\/mails\/\d+\/return$/.test(url)) return reply({ id: 1, number: 'AC-2026-000001', returned: true });
    if (/^\/api\/mails\/\d+/.test(url)) return reply(detail);
    if (url.startsWith('/api/mails')) return page(mailList);
    if (/^\/api\/services\/\d+\/members/.test(url)) return reply(members);
    if (url.startsWith('/api/services')) return page(services);
    if (url.startsWith('/api/entities')) return page(entities);
    if (url.startsWith('/api/mail-types')) return page([{ id: 1, label_fr: 'Demande', label_nl: 'Aanvraag' }]);
    if (url.startsWith('/api/notifications/read')) return reply({ updated: 1 });
    if (url.startsWith('/api/notifications')) return reply(notes.data, { pagination: { total: notes.data.length, limit: 20, offset: 0 } }, { unread: notes.unread });
    if (url.startsWith('/api/users') && method === 'PUT') return reply({});
    if (url.startsWith('/api/users')) return page(usersList);
    return reply({});
  }));
});

function Where() { const l = useLocation(); return <div data-testid="where">{l.pathname + l.search}</div>; }
const wrap = (ui: React.ReactElement, lang: 'fr' | 'nl' = 'fr', path = '/') => (
  <SettingsProvider value={{ settings: FALLBACK_SETTINGS, reload: async () => {} }}>
    <I18nProvider defaultLang={lang}><MemoryRouter initialEntries={[path]}>{ui}<Where /></MemoryRouter></I18nProvider>
  </SettingsProvider>
);
/** Champ de saisie d'une liste déroulante : antd pose le libellé sur plusieurs éléments, seul l'input reçoit le clic. */
const field = (label: string) => screen.getAllByLabelText(label).find((e) => e.tagName === 'INPUT')!;
const choose = async (label: string, option: string) => {
  const input = field(label);
  fireEvent.mouseDown(input);
  // La liste de CE champ : l'input désigne sa liste par aria-controls ; les autres listes gardent leurs options dans la page.
  const hit = await waitFor(() => {
    const list = document.getElementById(input.getAttribute('aria-controls') || '');
    const dropdown = list?.closest('.ant-select-dropdown');
    const el = [...(dropdown?.querySelectorAll('.ant-select-item-option') || [])].find((e) => e.getAttribute('title') === option);
    if (!el) throw new Error(`option introuvable : ${option}`);
    return el;
  });
  fireEvent.click(hit);
};
const put = (suffix: string) => calls.find((c) => c.method === 'PUT' && c.url.endsWith(suffix));

describe('fiche : ce que chaque rôle voit et peut faire', () => {
  it('secrétariat : formulaire d’attribution, pas de bouton de renvoi ; services de l’entité chargés', async () => {
    render(wrap(<AttributionCard mail={{ ...base, rights: asRegister } as never} onChanged={() => {}} onReturned={() => {}} />));
    expect(screen.getByText('Attribution')).toBeTruthy();
    expect(screen.getByText('Pas encore attribué')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Attribuer' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Renvoyer au secrétariat' })).toBeNull();
    await waitFor(() => expect(calls.some((c) => c.url.startsWith('/api/services?entity_id=1&is_active=1'))).toBe(true));
  });

  it('secrétariat : première attribution sans motif demandé ; envoi du service, de l’agent et de la copie', async () => {
    render(wrap(<AttributionCard mail={{ ...base, rights: asRegister } as never} onChanged={() => {}} onReturned={() => {}} />));
    await choose('Service traitant', 'Service A fictif');
    expect(screen.queryByLabelText('Motif du changement')).toBeNull();
    await waitFor(() => expect(calls.some((c) => /\/api\/services\/10\/members/.test(c.url))).toBe(true));
    await choose('Agent nommé', 'Agnès Fictive · Agent');
    await choose('Services en copie', 'Service B fictif');
    fireEvent.click(screen.getByRole('button', { name: 'Attribuer' }));
    await waitFor(() => expect(put('/attribution')).toBeTruthy());
    expect(put('/attribution')!.body).toEqual({ service_id: 10, agent_id: 21, copy_service_ids: [11] });
  });

  it('secrétariat : changer le service d’un courrier déjà attribué exige un motif, et rien ne part sans lui', async () => {
    render(wrap(<AttributionCard mail={{ ...attributed, rights: asRegister } as never} onChanged={() => {}} onReturned={() => {}} />));
    await choose('Service traitant', 'Service B fictif');
    const reason = await screen.findByLabelText('Motif du changement');
    fireEvent.click(screen.getByRole('button', { name: 'Attribuer' }));
    await waitFor(() => expect(document.querySelectorAll('.ant-form-item-explain-error').length).toBeGreaterThan(0));
    expect(put('/attribution')).toBeUndefined();
    fireEvent.change(reason, { target: { value: 'Compétence du service B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Attribuer' }));
    await waitFor(() => expect(put('/attribution')).toBeTruthy());
    expect(put('/attribution')!.body).toMatchObject({ service_id: 11, reason: 'Compétence du service B' });
  });

  it('cadre Attribution : la copie et l’agent actuels sont affichés ; l’historique est dans le cadre Traitement depuis la 0.4.0', () => {
    render(wrap(<AttributionCard mail={{ ...attributed, rights: rightsNone } as never} onChanged={() => {}} onReturned={() => {}} />));
    expect(screen.queryByText(/Historique/)).toBeNull();
    expect(screen.getByText('Agnès Fictive')).toBeTruthy();
    expect(screen.getAllByText('Service B fictif').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Attribuer' })).toBeNull();
  });

  it('agent du service traitant : aucun formulaire d’attribution ni de nomination, seulement le renvoi ; motif obligatoire', async () => {
    const onReturned = vi.fn();
    render(wrap(<AttributionCard mail={{ ...attributed, rights: { ...rightsNone, return_to_secretariat: true } } as never} onChanged={() => {}} onReturned={onReturned} />));
    expect(screen.queryByRole('button', { name: 'Attribuer' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Enregistrer l\u2019agent'.replace('\u2019', "'") })).toBeNull();
    const send = screen.getByRole('button', { name: 'Renvoyer au secrétariat' });
    expect((send as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Motif du renvoi'), { target: { value: 'Concerne les finances' } });
    expect((send as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(send);
    fireEvent.click(await screen.findByRole('button', { name: 'Oui' }));
    await waitFor(() => expect(onReturned).toHaveBeenCalledWith(1));
    const call = calls.find((c) => c.method === 'POST' && c.url === '/api/mails/1/return');
    expect(call!.body).toEqual({ reason: 'Concerne les finances' });
  });

  it('responsable de service : nomme l’agent parmi les membres du service, sans formulaire d’attribution', async () => {
    render(wrap(<AttributionCard mail={{ ...attributed, rights: { ...rightsNone, set_agent: true, return_to_secretariat: true } } as never} onChanged={() => {}} onReturned={() => {}} />));
    expect(screen.queryByRole('button', { name: 'Attribuer' })).toBeNull();
    await waitFor(() => expect(calls.some((c) => c.url.startsWith('/api/services/10/members?entity_id=1'))).toBe(true));
    await choose('Agent nommé', 'Chef Fictif · Responsable de service');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l\u2019agent'.replace('\u2019', "'") }));
    await waitFor(() => expect(put('/agent')).toBeTruthy());
    expect(put('/agent')!.body).toEqual({ agent_id: 22 });
  });

  it('courrier renvoyé : le motif du renvoi est affiché au secrétariat', () => {
    render(wrap(<AttributionCard mail={{ ...base, return_reason: 'Pas pour nous', rights: asRegister } as never} onChanged={() => {}} onReturned={() => {}} />));
    expect(screen.getByText('Renvoyé au secrétariat')).toBeTruthy();
    expect(screen.getByText('Pas pour nous')).toBeTruthy();
  });

  it('en néerlandais : mêmes actions, textes traduits', () => {
    render(wrap(<AttributionCard mail={{ ...attributed, rights: { ...rightsNone, return_to_secretariat: true } } as never} onChanged={() => {}} onReturned={() => {}} />, 'nl'));
    expect(screen.getByText('Toewijzing')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Terugsturen naar het secretariaat' })).toBeTruthy();
  });
});

describe('fiche d’un courrier lue par un agent', () => {
  it('lecture seule : ni correction, ni annulation, ni ajout de fichier ; l’objet reste lisible', async () => {
    detail = { ...attributed, rights: { ...rightsNone, return_to_secretariat: true } };
    setUser([{ entity_id: 1, entity_code: 'AC', role: 'agent', service_ids: [10] }]);
    render(wrap(<MailDrawer mail={{ ...(detail as unknown as Mail) }} onClose={() => {}} onChanged={() => {}} />));
    expect(await screen.findByText('Objet fictif de test')).toBeTruthy();
    expect(screen.getByText(/Vous pouvez lire ce courrier/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Annuler cet enregistrement/ })).toBeNull();
    expect(screen.queryByText('Ajouter un fichier à ce courrier')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Attribuer' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Renvoyer au secrétariat' })).toBeTruthy();
  });

  it('secrétariat : correction, annulation et attribution proposées', async () => {
    detail = { ...base, rights: asRegister };
    setUser([{ entity_id: 1, entity_code: 'AC', role: 'secretariat' }]);
    render(wrap(<MailDrawer mail={{ ...(detail as unknown as Mail) }} onClose={() => {}} onChanged={() => {}} />));
    expect(await screen.findByRole('button', { name: 'Enregistrer' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Attribuer' })).toBeTruthy();
    expect(screen.queryByText(/Vous pouvez lire ce courrier/)).toBeNull();
  });
});

describe('fiche : droits séparés', () => {
  it('correction permise sans droit d’annulation : le bouton d’annulation n’est pas proposé', async () => {
    detail = { ...base, rights: { ...asRegister, cancel: false } };
    setUser([{ entity_id: 1, entity_code: 'AC', role: 'secretariat' }]);
    render(wrap(<MailDrawer mail={{ ...(detail as unknown as Mail) }} onClose={() => {}} onChanged={() => {}} />));
    expect(await screen.findByRole('button', { name: 'Enregistrer' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Annuler cet enregistrement/ })).toBeNull();
  });
});

describe('bannettes', () => {
  it('agent : trois onglets avec compteurs, aucun onglet du secrétariat ; l’onglet choisi charge sa bannette', async () => {
    setUser([{ entity_id: 1, entity_code: 'AC', role: 'agent', service_ids: [10] }]);
    mailList = [{ ...attributed }];
    render(wrap(<BannettesPage />));
    expect(await screen.findByRole('tab', { name: 'Mon service (3)' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Moi (1)' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'En copie (0)' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /À attribuer/ })).toBeNull();
    expect(screen.queryByRole('tab', { name: /À enregistrer/ })).toBeNull();
    await waitFor(() => expect(calls.some((c) => c.url.startsWith('/api/mails?box=mon_service&entity_id=1'))).toBe(true));
    expect(await screen.findByText('Objet fictif de test')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Moi (1)' }));
    await waitFor(() => expect(calls.some((c) => c.url.startsWith('/api/mails?box=moi&entity_id=1'))).toBe(true));
    expect(screen.getByTestId('where').textContent).toContain('onglet=moi');
  });

  it('agent sans service : l’écran le dit', async () => {
    setUser([{ entity_id: 1, entity_code: 'AC', role: 'agent', service_ids: [] }]);
    render(wrap(<BannettesPage />));
    expect(await screen.findByText(/Vous n'êtes rattaché à aucun service/)).toBeTruthy();
  });

  it('secrétariat : « À enregistrer » et « À attribuer » ; un clic sur la file mène à l’écran de dépôt ; un courrier renvoyé montre son motif', async () => {
    setUser([{ entity_id: 1, entity_code: 'AC', role: 'secretariat' }]);
    mailList = [{ ...base, return_reason: 'Pas pour le service A' }];
    render(wrap(<BannettesPage />));
    expect(await screen.findByRole('tab', { name: 'À attribuer (1)' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'À enregistrer (2)' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /Mon service/ })).toBeNull();
    expect(await screen.findByText('Pas pour le service A')).toBeTruthy();
    expect(screen.getByText('Renvoyé')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'À enregistrer (2)' }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/a-enregistrer?entite=AC'));
  });

  it('rôles différents selon l’entité : les onglets suivent le rôle de l’entité choisie', async () => {
    setUser([{ entity_id: 1, entity_code: 'AC', role: 'secretariat' }, { entity_id: 2, entity_code: 'CPAS', role: 'agent', service_ids: [11] }]);
    render(wrap(<BannettesPage />, 'fr', '/bannettes?entite=CPAS'));
    expect(await screen.findByRole('tab', { name: /Mon service/ })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /À attribuer/ })).toBeNull();
  });

  it('sans aucun rôle de traitement : message, aucun appel au courrier', async () => {
    setUser([{ entity_id: 1, entity_code: 'AC', role: 'auditeur' }]);
    render(wrap(<BannettesPage />));
    expect(await screen.findByText(/Les bannettes sont réservées/)).toBeTruthy();
    expect(calls.some((c) => c.url.startsWith('/api/mails'))).toBe(false);
  });

  it('lien de la cloche : ?courrier=<id> ouvre la fiche du courrier', async () => {
    setUser([{ entity_id: 1, entity_code: 'AC', role: 'agent', service_ids: [10] }]);
    detail = { ...attributed, rights: { ...rightsNone, return_to_secretariat: true } };
    render(wrap(<BannettesPage />, 'fr', '/bannettes?entite=AC&courrier=1'));
    expect(await screen.findByText('Fiche du courrier')).toBeTruthy();
    expect(await screen.findByText('Objet fictif de test')).toBeTruthy();
  });
});

describe('cloche de notifications', () => {
  it('affiche le nombre de non lues et la nature de chaque notification, jamais l’objet', async () => {
    notes = { unread: 2, data: [
      { id: 1, kind: 'attribue', mail_id: 1, mail_number: 'AC-2026-000001', entity_code: 'AC', created_at: '2026-11-11 09:00:00', read_at: null },
      { id: 2, kind: 'renvoye', mail_id: 2, mail_number: 'AC-2026-000002', entity_code: 'AC', created_at: '2026-11-11 10:00:00', read_at: null },
    ] };
    render(wrap(<NotificationBell />));
    const bell = await screen.findByRole('button', { name: 'Notifications : 2 non lues' });
    fireEvent.click(bell);
    expect(await screen.findByText('Courrier attribué à vous')).toBeTruthy();
    expect(screen.getByText('Courrier renvoyé au secrétariat')).toBeTruthy();
    expect(screen.queryByText(/Objet fictif/)).toBeNull();
  });

  it('un clic ouvre le courrier dans les bannettes et marque la notification lue', async () => {
    notes = { unread: 1, data: [{ id: 7, kind: 'copie', mail_id: 4, mail_number: 'AC-2026-000004', entity_code: 'CPAS', created_at: '2026-11-11 09:00:00', read_at: null }] };
    render(wrap(<NotificationBell />));
    fireEvent.click(await screen.findByRole('button', { name: /Notifications/ }));
    fireEvent.click(await screen.findByText('Courrier en copie pour votre service'));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/bannettes?entite=CPAS&courrier=4'));
    const read = calls.find((c) => c.url === '/api/notifications/read');
    expect(read!.body).toEqual({ ids: [7] });
  });

  it('sans notification : le dit, sans nombre', async () => {
    render(wrap(<NotificationBell />));
    const bell = await screen.findByRole('button', { name: 'Notifications' });
    fireEvent.click(bell);
    expect(await screen.findByText('Aucune notification.')).toBeTruthy();
  });

  it('une réponse inattendue du serveur laisse la cloche telle quelle, sans erreur', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(async () => ({ ok: false, status: 500, statusText: 'x', json: async () => ({ error: true, code: 'INTERNAL', message: 'x' }) }));
    render(wrap(<NotificationBell />));
    expect(await screen.findByRole('button', { name: 'Notifications' })).toBeTruthy();
  });
});

describe('utilisateurs : services d’un agent ou d’un responsable', () => {
  const account = { id: 8, email: 'ag@exemple.test', first_name: 'Agnès', last_name: 'Fictive', user_role: 'agent', preferred_lang: 'fr', is_active: 1, is_admin_local: 0, microsoft_linked: 0,
    entity_roles: [{ entity_id: 1, entity_code: 'AC', role: 'agent', service_ids: [10] }] };

  it('un agent propose ses services, limités à ceux de l’entité ; l’enregistrement envoie service_ids', async () => {
    setUser([], {}, true);
    usersList = [account];
    render(wrap(<UsersPage />));
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier les rôles' }));
    await screen.findAllByLabelText('Services AC');
    expect(screen.queryAllByLabelText('Services CPAS')).toHaveLength(0);
    fireEvent.mouseDown(field('Services AC'));
    const titles = await waitFor(() => { const t = [...document.querySelectorAll('.ant-select-item-option')].map((e) => e.getAttribute('title')); if (!t.length) throw new Error('vide'); return t; });
    expect(titles).toContain('Service B fictif');
    fireEvent.click(document.querySelector('.ant-select-item-option[title="Service B fictif"]')!);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(put('/users/8')).toBeTruthy());
    expect(put('/users/8')!.body).toEqual({ entity_roles: [{ entity_id: 1, role: 'agent', service_ids: [10, 11] }] });
  });

  it('un rôle de secrétariat n’envoie aucun service et ne propose pas la liste', async () => {
    setUser([], {}, true);
    usersList = [{ ...account, entity_roles: [{ entity_id: 1, entity_code: 'AC', role: 'secretariat', service_ids: [] }] }];
    render(wrap(<UsersPage />));
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier les rôles' }));
    await screen.findAllByText(/Rôles par entité/);
    expect(screen.queryAllByLabelText('Services AC')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(put('/users/8')).toBeTruthy());
    expect(put('/users/8')!.body).toEqual({ entity_roles: [{ entity_id: 1, role: 'secretariat' }] });
  });

  it('passer un agent en secrétariat vide ses services avant l’envoi', async () => {
    setUser([], {}, true);
    usersList = [account];
    render(wrap(<UsersPage />));
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier les rôles' }));
    await screen.findAllByLabelText('Services AC');
    const group = screen.getByLabelText('Rôles par entité AC');
    fireEvent.click(within(group).getByLabelText('Secrétariat'));
    await waitFor(() => expect(screen.queryAllByLabelText('Services AC')).toHaveLength(0));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(put('/users/8')).toBeTruthy());
    expect(put('/users/8')!.body).toEqual({ entity_roles: [{ entity_id: 1, role: 'secretariat' }] });
  });
});
