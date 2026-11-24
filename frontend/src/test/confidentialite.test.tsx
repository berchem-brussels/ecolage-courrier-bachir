/**
 * Confidentialité du courrier entrant, version 0.5.0 : ce que chaque rôle voit et peut faire à l'écran (CDC CR-001 à CR-005).
 * Les réponses fictives ont la forme exacte de celles du serveur (confidentialite.test.js). Chaque test dit ce que la personne voit
 * ET ce qu'elle ne voit pas : le serveur recontrôle tout, l'écran ne propose que ce qui sera accepté.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../contexts/I18nContext';
import { SettingsProvider, FALLBACK_SETTINGS } from '../contexts/SettingsContext';

const state = vi.hoisted(() => ({ user: { id: 7, email: 'sec@exemple.test', first_name: 'Sec', last_name: 'Fictif', role: 'agent', ui_mode: 'complet', entity_roles: [] } as Record<string, unknown>, isAdmin: false }));
vi.mock('../contexts/AuthContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../contexts/AuthContext')>()),
  useAuth: () => ({ user: state.user, loading: false, isAdmin: state.isAdmin, login: async () => {}, logout: async () => {}, refresh: async () => {}, savePreferences: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import ConfidentialityCard from '../components/ConfidentialityCard';
import RegistrationForm from '../components/RegistrationForm';
import LevelTag, { displaySubject } from '../components/LevelTag';
import TraitementCard from '../components/TraitementCard';

const people = [
  { id: 11, first_name: 'Agnès', last_name: 'Fictive', role: 'agent' },
  { id: 12, first_name: 'Chloé', last_name: 'Fictive', role: 'chef_service' },
];
const base = { id: 1, entity_id: 1, status: 'enregistre', confidentiality: 'normal', designees: [], designated: false, rights: { change_level: true, handover: false } };

const calls: { method: string; url: string; body?: Record<string, unknown> }[] = [];
let answer: Record<string, unknown> = base;

beforeEach(() => {
  calls.length = 0;
  answer = base;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { method?: string; body?: unknown }) => {
    const method = init?.method || 'GET';
    calls.push({ method, url, body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined });
    const reply = (data: unknown, meta: Record<string, unknown> = {}) => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ data, meta: { envelope: 1, ...meta } }) });
    if (url.startsWith('/api/mails/designable-users')) return reply(people);
    if (/^\/api\/mails\/\d+\/(confidentiality|handover)$/.test(url)) return reply(answer);
    if (url.startsWith('/api/mail-types')) return { ok: true, status: 200, statusText: 'OK', json: async () => ({ data: [{ id: 1, label_fr: 'Demande', label_nl: 'Aanvraag', is_demo: 0 }], meta: { envelope: 1 }, pagination: { total: 1, limit: 200, offset: 0 } }) };
    if (url.startsWith('/api/contacts')) return { ok: true, status: 200, statusText: 'OK', json: async () => ({ data: [], meta: { envelope: 1 }, pagination: { total: 0, limit: 20, offset: 0 } }) };
    return reply({ id: 5, number: 'AC-2026-000005' });
  }));
});

const wrap = (ui: React.ReactElement, lang: 'fr' | 'nl' = 'fr') => (
  <SettingsProvider value={{ settings: FALLBACK_SETTINGS, reload: async () => {} }}>
    <I18nProvider defaultLang={lang}><MemoryRouter>{ui}</MemoryRouter></I18nProvider>
  </SettingsProvider>
);
const settle = () => new Promise((r) => setTimeout(r, 150));
const puts = () => calls.filter((c) => c.method === 'PUT' && c.url.endsWith('/confidentiality'));

describe('pastille et objet', () => {
  it('rien pour un courrier normal ; cadenas et libellé pour restreint et confidentiel, en français et en néerlandais', () => {
    const { container, rerender } = render(wrap(<LevelTag level="normal" />));
    expect(container.textContent).toBe('');
    rerender(wrap(<LevelTag level="restreint" />));
    expect(screen.getByText('Restreint')).toBeTruthy();
    rerender(wrap(<LevelTag level="confidentiel" />));
    expect(screen.getByText('Confidentiel')).toBeTruthy();
    rerender(wrap(<LevelTag level="confidentiel" />, 'nl'));
    expect(screen.getByText('Vertrouwelijk')).toBeTruthy();
  });

  it('l’objet d’un pli confidentiel se traduit dans la langue de la personne ; celui des autres courriers reste tel quel', () => {
    const t = (k: string) => (k === 'mail.confidential.subject' ? 'Pli confidentiel remis fermé' : k);
    expect(displaySubject({ subject: 'Texte serveur', confidentiality: 'confidentiel' }, t)).toBe('Pli confidentiel remis fermé');
    expect(displaySubject({ subject: 'Objet normal', confidentiality: 'normal' }, t)).toBe('Objet normal');
    expect(displaySubject({ subject: 'Objet ancien' }, t)).toBe('Objet ancien');
  });
});

describe('carte Confidentialité : ce que chaque rôle voit', () => {
  it('courrier normal sans droit de registre et sans désignation : aucune carte', () => {
    const { container } = render(wrap(<ConfidentialityCard mail={{ ...base, rights: {} } as never} onChanged={() => {}} />));
    expect(container.textContent).toBe('');
  });

  it('personne désignée sans droit de registre : l’écran dit pourquoi elle lit, sans formulaire ni liste des autres personnes', () => {
    render(wrap(<ConfidentialityCard mail={{ ...base, confidentiality: 'restreint', designated: true, rights: {} } as never} onChanged={() => {}} />));
    expect(screen.getByText(/Vous lisez ce courrier parce que vous y êtes désigné/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Changer le niveau' })).toBeNull();
    expect(screen.queryByText('Personnes désignées')).toBeNull();
    expect(calls.some((c) => c.url.startsWith('/api/mails/designable-users'))).toBe(false);
  });

  it('le registre voit le niveau et le formulaire ; un courrier enregistré ne propose pas « Confidentiel »', async () => {
    render(wrap(<ConfidentialityCard mail={base as never} onChanged={() => {}} />));
    await settle();
    expect(screen.getByRole('button', { name: 'Changer le niveau' })).toBeTruthy();
    expect(screen.getByLabelText('Nouveau niveau')).toBeTruthy();
    expect(screen.getAllByText('Normal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Restreint').length).toBeGreaterThan(0);
    expect(screen.queryByText('Confidentiel')).toBeNull();
    expect(calls.some((c) => c.url.startsWith('/api/mails/designable-users?entity_id=1'))).toBe(true);
  });

  it('un pli confidentiel peut redescendre (le destinataire l’a ouvert) : le niveau « Confidentiel » reste affiché comme niveau actuel', async () => {
    render(wrap(<ConfidentialityCard mail={{ ...base, confidentiality: 'confidentiel', designees: [{ id: 11, first_name: 'Agnès', last_name: 'Fictive' }] } as never} onChanged={() => {}} />));
    await settle();
    expect(screen.getAllByText('Confidentiel').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Destinataire nommé').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Agnès Fictive').length).toBeGreaterThan(0);
  });

  it('courrier annulé : le niveau se lit, aucun formulaire', async () => {
    render(wrap(<ConfidentialityCard mail={{ ...base, status: 'annule' } as never} onChanged={() => {}} />));
    await settle();
    expect(screen.queryByRole('button', { name: 'Changer le niveau' })).toBeNull();
  });
});

describe('changement de niveau', () => {
  it('sans motif rien n’est envoyé ; avec motif, le niveau et les personnes désignées partent au serveur', async () => {
    const onChanged = vi.fn();
    answer = { ...base, confidentiality: 'restreint' };
    render(wrap(<ConfidentialityCard mail={base as never} onChanged={onChanged} />));
    await settle();
    fireEvent.click(screen.getByLabelText('Restreint', { selector: 'input' }));
    await waitFor(() => expect(screen.getAllByLabelText('Personnes désignées').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: 'Changer le niveau' }));
    await settle();
    expect(puts().length).toBe(0);
    const input = screen.getAllByLabelText('Personnes désignées').find((e) => e.tagName === 'INPUT')!;
    fireEvent.mouseDown(input);
    const hit = await waitFor(() => {
      const el = [...document.querySelectorAll('.ant-select-item-option')].find((e) => e.getAttribute('title') === 'Agnès Fictive');
      if (!el) throw new Error('option introuvable');
      return el;
    });
    fireEvent.click(hit);
    fireEvent.change(screen.getByLabelText('Motif du changement'), { target: { value: 'Dossier du personnel' } });
    fireEvent.click(screen.getByRole('button', { name: 'Changer le niveau' }));
    await waitFor(() => expect(puts().length).toBe(1));
    expect(puts()[0].body).toEqual({ level: 'restreint', reason: 'Dossier du personnel', designee_ids: [11] });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('sans motif, même avec les personnes choisies, rien n’est envoyé', async () => {
    render(wrap(<ConfidentialityCard mail={base as never} onChanged={() => {}} />));
    await settle();
    fireEvent.click(screen.getByLabelText('Restreint', { selector: 'input' }));
    await waitFor(() => expect(screen.getAllByLabelText('Personnes désignées').length).toBeGreaterThan(0));
    const input = screen.getAllByLabelText('Personnes désignées').find((e) => e.tagName === 'INPUT')!;
    fireEvent.mouseDown(input);
    const hit = await waitFor(() => {
      const el = [...document.querySelectorAll('.ant-select-item-option')].find((e) => e.getAttribute('title') === 'Chloé Fictive');
      if (!el) throw new Error('option introuvable');
      return el;
    });
    fireEvent.click(hit);
    fireEvent.click(screen.getByRole('button', { name: 'Changer le niveau' }));
    await settle();
    expect(puts().length).toBe(0);
  });

  it('redevenir normal : aucune personne désignée n’est envoyée', async () => {
    answer = { ...base };
    render(wrap(<ConfidentialityCard mail={{ ...base, confidentiality: 'restreint', designees: [{ id: 11, first_name: 'Agnès', last_name: 'Fictive' }] } as never} onChanged={() => {}} />));
    await settle();
    fireEvent.click(screen.getByLabelText('Normal', { selector: 'input' }));
    fireEvent.change(screen.getByLabelText('Motif du changement'), { target: { value: 'Levée' } });
    fireEvent.click(screen.getByRole('button', { name: 'Changer le niveau' }));
    await waitFor(() => expect(puts().length).toBe(1));
    expect(puts()[0].body).toEqual({ level: 'normal', reason: 'Levée', designee_ids: [] });
  });
});

describe('remise du pli fermé', () => {
  const sealed = { ...base, confidentiality: 'confidentiel', designees: [{ id: 11, first_name: 'Agnès', last_name: 'Fictive' }], rights: { change_level: true, handover: true } };
  it('le registre enregistre la remise en un clic ; le bouton disparaît ensuite et qui, à qui et quand se lisent', async () => {
    const onChanged = vi.fn();
    answer = { ...sealed, rights: { change_level: true, handover: false }, handed_at: '2026-11-24 14:00:00', handed_by_first_name: 'Sec', handed_by_last_name: 'Fictif', handed_to_first_name: 'Agnès', handed_to_last_name: 'Fictive' };
    const { rerender } = render(wrap(<ConfidentialityCard mail={sealed as never} onChanged={onChanged} />));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la remise du pli' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.url === '/api/mails/1/handover')).toBe(true));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    rerender(wrap(<ConfidentialityCard mail={answer as never} onChanged={onChanged} />));
    expect(screen.queryByRole('button', { name: 'Enregistrer la remise du pli' })).toBeNull();
    expect(screen.getByText('Remis par')).toBeTruthy();
    expect(screen.getByText('Reçu par')).toBeTruthy();
  });
  it('sans droit de remise, aucun bouton', async () => {
    render(wrap(<ConfidentialityCard mail={{ ...sealed, rights: { change_level: true, handover: false } } as never} onChanged={() => {}} />));
    await settle();
    expect(screen.queryByRole('button', { name: 'Enregistrer la remise du pli' })).toBeNull();
  });
});

describe('historique', () => {
  it('un changement de niveau et la remise du pli s’y lisent, avec le motif', () => {
    const mail = { id: 1, entity_id: 1, status: 'enregistre', rights: {}, timeline: [
      { type: 'remise', id: 1, at: '2026-11-24 14:00:00', author_first_name: 'Sec', author_last_name: 'Fictif', to_first_name: 'Agnès', to_last_name: 'Fictive' },
      { type: 'confidentialite', id: 2, at: '2026-11-24 13:00:00', author_first_name: 'Sec', author_last_name: 'Fictif', from_level: 'normal', to_level: 'restreint', reason: 'Dossier du personnel' },
    ] };
    render(wrap(<TraitementCard mail={mail as never} onChanged={() => {}} />));
    expect(screen.getByText('Pli remis fermé')).toBeTruthy();
    expect(screen.getByText(/Agnès Fictive/)).toBeTruthy();
    expect(screen.getByText(/Normal → Restreint/)).toBeTruthy();
    expect(screen.getByText('Dossier du personnel')).toBeTruthy();
  });
});

describe('enregistrement', () => {
  const entity = { id: 1, code: 'AC', name_fr: 'Administration communale', name_nl: 'Gemeentebestuur', is_active: 1 };
  const radio = (name: string) => screen.getByLabelText(name, { selector: 'input[type=radio]' });

  it('par défaut le niveau est « Normal », l’objet est demandé et aucune personne désignée ne l’est', async () => {
    render(wrap(<RegistrationForm entity={entity as never} onSaved={() => {}} />));
    await settle();
    expect((radio('Normal') as HTMLInputElement).checked).toBe(true);
    expect(screen.getByLabelText('Objet')).toBeTruthy();
    expect(screen.queryAllByLabelText('Personnes désignées').length).toBe(0);
  });

  it('« Restreint » demande les personnes désignées ; « Confidentiel » retire l’objet, annonce l’absence de scan et demande un destinataire nommé', async () => {
    render(wrap(<RegistrationForm entity={entity as never} onSaved={() => {}} />));
    await settle();
    fireEvent.click(radio('Restreint'));
    await waitFor(() => expect(screen.getAllByLabelText('Personnes désignées').length).toBeGreaterThan(0));
    expect(screen.getByLabelText('Objet')).toBeTruthy();
    fireEvent.click(radio('Confidentiel'));
    await waitFor(() => expect(screen.queryByLabelText('Objet')).toBeNull());
    expect(screen.getByText(/s’enregistre sans scan/)).toBeTruthy();
    expect(screen.getAllByText('Destinataire nommé').length).toBeGreaterThan(0);
  });

  it('un fichier de la file ne s’enregistre pas comme pli confidentiel : l’option est désactivée et la raison écrite', async () => {
    render(wrap(<RegistrationForm entity={entity as never} pieceIds={[3]} onSaved={() => {}} />));
    await settle();
    expect((radio('Confidentiel') as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/ne s’enregistre pas comme pli confidentiel/)).toBeTruthy();
  });
});
