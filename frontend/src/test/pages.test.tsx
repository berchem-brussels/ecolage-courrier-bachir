/**
 * Chaque écran s'affiche et passe l'audit axe-core, en FR et en NL (patron SAGA a11y.test.tsx).
 * La règle color-contrast est désactivée : jsdom ne calcule pas les couleurs rendues ; le contraste se vérifie à l'écran.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { I18nProvider } from '../contexts/I18nContext';
import { SettingsProvider, FALLBACK_SETTINGS } from '../contexts/SettingsContext';

const user = { id: 1, email: 'a@exemple.test', first_name: 'Ada', last_name: 'Admin', user_role: 'admin', preferred_lang: 'fr', ui_mode: 'simple', theme: 'clair', must_change_password: 0,
  entity_roles: [{ entity_id: 1, entity_code: 'AC', role: 'gestionnaire' }, { entity_id: 2, entity_code: 'CPAS', role: 'secretariat' }] };
vi.mock('../contexts/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../contexts/AuthContext')>()),
  useAuth: () => ({ user, loading: false, isAdmin: true, login: async () => {}, logout: async () => {}, refresh: async () => {}, savePreferences: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Données fictives de test, à la forme exacte des réponses de l'API.
const entities = [{ id: 1, code: 'AC', name_fr: 'Administration communale', name_nl: 'Gemeentebestuur', is_active: 1 }, { id: 2, code: 'CPAS', name_fr: 'Centre public d’action sociale', name_nl: 'OCMW', is_active: 1 }];
const mails = [{ id: 1, number: 'AC-2026-000001', entity_id: 1, entity_code: 'AC', year: 2026, seq: 1, received_date: '2026-10-13', registered_at: '2026-10-13 08:00:00', channel: 'courrier',
  tracking_number: null, sender_contact_id: 1, sender_kind: 'personne', sender_name: 'Exemple', sender_first_name: 'Marie', sender_organisation: null, sender_is_demo: 1, addressee_name: null,
  subject: 'Demande de renseignements', type_id: 1, type_label_fr: 'Demande', type_label_nl: 'Aanvraag', lang: 'fr', urgency: 'normale', sender_reference: null, document_date: null,
  pieces_count: null, notes: null, status: 'enregistre', cancel_reason: null, created_by_first_name: 'Ada', created_by_last_name: 'Admin', created_at: '2026-10-13 08:00:00', updated_at: '2026-10-13 08:00:00' }];
const types = [{ id: 1, entity_id: 1, entity_code: 'AC', label_fr: 'Demande', label_nl: 'Aanvraag', nl_to_validate: 1, is_demo: 1, is_active: 1 }];
const services = [{ id: 1, name_fr: 'Ressources humaines', name_nl: 'Personeelszaken', nl_to_validate: 1, parent_id: null, parent_name_fr: null, parent_name_nl: null, entity_ids: [1, 2], is_active: 1 }];
const contacts = [{ id: 1, kind: 'personne', name: 'Exemple', first_name: 'Marie', organisation: null, email: null, phone: null, street: null, postal_code: null, city: 'Ville fictive', country: null, lang: 'fr', company_number: null, is_demo: 1, is_active: 1, cancel_reason: null }];
const registers = [{ id: 1, entity_id: 1, entity_code: 'AC', direction: 'entree', prefix: 'AC', digits: 6, is_active: 1 }];
const pieces = [{ id: 7, entity_id: 1, entity_code: 'AC', mail_id: null, mail_number: null, status: 'a_enregistrer', original_name: 'scan-fictif.pdf', mime: 'application/pdf',
  size_bytes: 52000, sha256: 'a'.repeat(64), position: 1, origin: 'depot', reject_reason: null, created_by: 1, created_by_first_name: 'Ada', created_by_last_name: 'Admin',
  created_at: '2026-10-20 08:00:00', updated_at: '2026-10-20 08:00:00' }];
const mailDetail = { ...mails[0], files_count: 1, pieces: [{ ...pieces[0], mail_id: 1, mail_number: 'AC-2026-000001', status: 'rattachee' }] };
const LISTS: Record<string, unknown[]> = { '/api/pieces': pieces, '/api/consultations': [], '/api/mails': mails, '/api/entities': entities, '/api/mail-types': types, '/api/services': services, '/api/contacts': contacts, '/api/registers': registers };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { method?: string; body?: unknown }) => (init?.method === 'POST' && url === '/api/pieces' && init.body instanceof FormData && init.body.get('mail_id') ? {
    // Ajout d'un fichier à un courrier enregistré : la pièce créée, à la forme de la réponse réelle.
    ok: true, status: 201, statusText: 'Created',
    json: async () => ({ data: { ...pieces[0], id: 8, mail_id: 1, mail_number: 'AC-2026-000001', status: 'rattachee', position: 2, original_name: 'annexe.png', mime: 'image/png' }, meta: { envelope: 1 } }),
  } : init?.method === 'POST' && url === '/api/pieces' ? {
    // Réponse réelle du serveur pour un TIFF (pieces.test.js) : 415 FILE_TIFF avec son libellé.
    ok: false, status: 415, statusText: 'Unsupported Media Type',
    json: async () => ({ error: true, code: 'FILE_TIFF', message: 'Fichier TIFF refusé : réglez le copieur pour produire des PDF.' }),
  } : {
    ok: true, status: 200, statusText: 'OK',
    json: async () => (url.startsWith('/api/mails/1') ? { data: mailDetail, meta: { envelope: 1 } }
      : url.startsWith('/api/settings') ? { data: { pieces_max_mb: 50, pieces_mcp_read_max_mb: 5, defaults: { pieces_max_mb: 50, pieces_mcp_read_max_mb: 5 } }, meta: { envelope: 1 } }
      : Object.keys(LISTS).find((k) => url.startsWith(k)) ? { data: LISTS[Object.keys(LISTS).find((k) => url.startsWith(k))!], meta: { envelope: 1 }, pagination: { total: 1, limit: 20, offset: 0 } }
      : url.startsWith('/api/users') ? { data: [{ ...user, is_active: 1 }], meta: { envelope: 1 }, pagination: { total: 1, limit: 200, offset: 0 } }
      : { data: {}, meta: { envelope: 1 } }),
  })));
});

import RegisterPage from '../pages/RegisterPage';
import RegistrationPage from '../pages/RegistrationPage';
import ContactsPage from '../pages/ContactsPage';
import EntitiesPage from '../pages/EntitiesPage';
import ServicesPage from '../pages/ServicesPage';
import TypesPage from '../pages/TypesPage';
import HomePage from '../pages/HomePage';
import UsersPage from '../pages/UsersPage';
import HelpPage from '../pages/HelpPage';
import AccessibilityPage from '../pages/AccessibilityPage';
import LoginPage from '../pages/LoginPage';
import InboxPage from '../pages/InboxPage';
import ConsultationsPage from '../pages/ConsultationsPage';
import SettingsPage from '../pages/SettingsPage';
import MailDrawer, { type Mail } from '../components/MailDrawer';

const PAGES: [string, React.ComponentType][] = [['Register', RegisterPage], ['Registration', RegistrationPage], ['Contacts', ContactsPage],
  ['Entities', EntitiesPage], ['Services', ServicesPage], ['Types', TypesPage], ['Home', HomePage], ['Users', UsersPage], ['Help', HelpPage], ['Accessibility', AccessibilityPage], ['Login', LoginPage],
  ['Inbox', InboxPage], ['Consultations', ConsultationsPage], ['Settings', SettingsPage]];

function wrap(C: React.ComponentType, lang: 'fr' | 'nl') {
  return (
    <SettingsProvider value={{ settings: FALLBACK_SETTINGS, reload: async () => {} }}>
      <I18nProvider defaultLang={lang}><MemoryRouter><C /></MemoryRouter></I18nProvider>
    </SettingsProvider>
  );
}

describe('écrans', () => {
  for (const lang of ['fr', 'nl'] as const) {
    for (const [name, C] of PAGES) {
      it(`${name} (${lang}) s'affiche sans violation axe-core`, async () => {
        const { container } = render(wrap(C, lang));
        await waitFor(() => expect(container.querySelector('h1')).toBeTruthy());
        const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
        expect(r.violations.map((v) => `${v.id}: ${v.nodes.length} ${v.nodes.map((n) => n.html.slice(0, 160)).join(' / ')}`)).toEqual([]);
      });
    }
  }

  // Une étiquette <label for> doit viser un champ de saisie : Chrome le signale sinon (« Incorrect use of <label for=FORM_ELEMENT> »),
  // ce qu'axe-core ne contrôle pas. Défaut relevé à la recette de la 0.2.0 sur NIXUS (groupes de boutons, présent depuis la 0.1.0).
  const LABELABLE = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'METER', 'OUTPUT', 'PROGRESS'];
  const badLabels = (root: HTMLElement) => [...root.ownerDocument.querySelectorAll('label[for]')]
    .map((l) => ({ f: l.getAttribute('for') || '', e: root.ownerDocument.getElementById(l.getAttribute('for') || '') }))
    .filter((x) => !x.e || !LABELABLE.includes(x.e.tagName)).map((x) => `${x.f} -> ${x.e ? x.e.tagName : 'absent'}`);
  for (const [name, C] of [...PAGES, ['MailDrawer', () => <MailDrawer mail={mails[0] as unknown as Mail} onClose={() => {}} onChanged={() => {}} />] as [string, React.ComponentType]]) {
    it(`${name} : chaque étiquette vise un champ de saisie`, async () => {
      const { container } = render(wrap(C, 'fr'));
      await waitFor(() => expect(container.ownerDocument.querySelector('h1, h2')).toBeTruthy());
      await new Promise((r) => setTimeout(r, 50));
      expect(badLabels(container)).toEqual([]);
    });
  }

  it('fenêtres « Nouvel utilisateur » et « Nouveau contact » : chaque étiquette vise un champ de saisie', async () => {
    const u = render(wrap(UsersPage, 'fr'));
    fireEvent.click(await screen.findByRole('button', { name: /Créer/ }));
    await screen.findByRole('dialog');
    await screen.findByText(/Obliger le changement/);
    expect(badLabels(u.container)).toEqual([]);
    u.unmount();
    const c = render(wrap(ContactsPage, 'fr'));
    fireEvent.click((await screen.findAllByRole('button', { name: /Nouveau contact/ }))[0]);
    await screen.findByRole('dialog');
    await screen.findAllByText(/Correspondentietaal|Langue de correspondance/);
    expect(badLabels(c.container)).toEqual([]);
  });

  it('le registre affiche le numéro et l’expéditeur reçus de l’API', async () => {
    render(wrap(RegisterPage, 'fr'));
    expect(await screen.findByText('AC-2026-000001')).toBeInTheDocument();
    expect(await screen.findByText('Exemple Marie')).toBeInTheDocument();
  });

  it('en néerlandais, le titre du registre est traduit', async () => {
    render(wrap(RegisterPage, 'nl'));
    expect(await screen.findByRole('heading', { name: /Register van inkomende post/ })).toBeInTheDocument();
  });

  it('enregistrement : le choix de l’entité et les types de l’entité sont proposés en boutons', async () => {
    render(wrap(RegistrationPage, 'fr'));
    expect(await screen.findByText(/AC · Administration communale/)).toBeInTheDocument();
    expect(await screen.findByText('Demande')).toBeInTheDocument();
    expect(screen.getByText('Recommandé')).toBeInTheDocument();
  });

  it('file « À enregistrer » : le fichier s’affiche en aperçu à côté du formulaire, servi par la route authentifiée', async () => {
    const { container } = render(wrap(InboxPage, 'fr'));
    expect(await screen.findByTitle('Aperçu du fichier : scan-fictif.pdf')).toBeInTheDocument();
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe('/api/pieces/7/contenu');
    expect(screen.getByRole('button', { name: /Enregistrer et passer au suivant/ })).toBeInTheDocument();
    expect(screen.getByText(/Fichier 1 \/ 1/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rejeter ce fichier/ })).toBeInTheDocument();
  });

  it('file « À enregistrer » : un TIFF glissé dans le cadre part au serveur et son refus s’affiche avec la raison', async () => {
    // Geste réel : dépôt sur le cadre (dataTransfer), et non dépôt direct dans le champ caché qui contourne le filtre
    // « accept » du composant. Défaut relevé à la recette de la 0.2.0 sur NIXUS : le TIFF était écarté sans message.
    render(wrap(InboxPage, 'fr'));
    const zone = (await screen.findByText(/Glissez ici les fichiers scannés/)).closest('.ant-upload') as HTMLElement;
    const tiff = new File([new Uint8Array([0x49, 0x49, 0x2a, 0x00, 1, 2, 3])], 'scan-fictif.tif', { type: 'image/tiff' });
    fireEvent.drop(zone, { dataTransfer: { files: [tiff], items: [{ kind: 'file', getAsFile: () => tiff }], types: ['Files'] } });
    expect(await screen.findByText('Fichiers refusés')).toBeInTheDocument();
    expect(screen.getByText(/Fichier TIFF refusé : réglez le copieur pour produire des PDF\./)).toBeInTheDocument();
    expect(screen.getByText('scan-fictif.tif')).toBeInTheDocument();
  });

  it('file « À enregistrer » en néerlandais', async () => {
    render(wrap(InboxPage, 'nl'));
    expect(await screen.findByRole('button', { name: /Registreren en naar het volgende/ })).toBeInTheDocument();
  });

  it('fiche : relue par son identifiant, elle montre ses fichiers et le cadre d’ajout', async () => {
    render(wrap(() => <MailDrawer mail={mails[0] as unknown as Mail} onClose={() => {}} onChanged={() => {}} />, 'fr'));
    expect(await screen.findByText('Fichiers (1)')).toBeInTheDocument();
    expect(await screen.findByTitle('Aperçu du fichier : scan-fictif.pdf')).toBeInTheDocument();
    expect(screen.getByText('Ajouter un fichier à ce courrier')).toBeInTheDocument();
    expect((fetch as unknown as { mock: { calls: string[][] } }).mock.calls.some((c) => c[0] === '/api/mails/1')).toBe(true);
  });

  it('fiche : un fichier ajouté prévient le registre, qui met à jour le nombre de fichiers sans rechargement', async () => {
    const onChanged = vi.fn();
    render(wrap(() => <MailDrawer mail={mails[0] as unknown as Mail} onClose={() => {}} onChanged={onChanged} />, 'fr'));
    const zone = (await screen.findByText('Ajouter un fichier à ce courrier')).closest('.ant-upload') as HTMLElement;
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'annexe.png', { type: 'image/png' });
    fireEvent.drop(zone, { dataTransfer: { files: [png], items: [{ kind: 'file', getAsFile: () => png }], types: ['Files'] } });
    expect(await screen.findByText('Fichiers (2)')).toBeInTheDocument();
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(expect.objectContaining({ id: 1, files_count: 2 })));
  });

  it('paramètres : la taille maximale d’un fichier est réglable, valeur livrée affichée', async () => {
    render(wrap(SettingsPage, 'fr'));
    expect(await screen.findByText(/Valeur livrée : 50 Mo/)).toBeInTheDocument();
  });

  it('services : un nom NL à valider est signalé, un service commun aussi', async () => {
    render(wrap(ServicesPage, 'fr'));
    expect(await screen.findByText('NL à valider')).toBeInTheDocument();
    expect(await screen.findByText('Commun')).toBeInTheDocument();
  });
});
