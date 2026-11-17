/** Contrôles bloquants de l'aide et des explications de champs (standard v3.3, section 13.1). */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TOPICS, topicForPath } from '../help';
import { PATHS, ROLES, type L } from '../help/types';
import { SCREENS } from '../screens';
import { translations } from '../i18n';
import { hints } from '../hints';

const SRC = path.resolve(process.cwd(), 'src');
const tsx = (dir: string): string[] => fs.readdirSync(dir).flatMap((f) => {
  const p = path.join(dir, f);
  if (fs.statSync(p).isDirectory()) return f === 'test' ? [] : tsx(p);
  return p.endsWith('.tsx') ? [p] : [];
});
const texts = (l: L) => [l.fr, l.nl];
const allTexts = (tp: (typeof TOPICS)[number]): L[] => [tp.purpose, ...tp.layout,
  ...tp.procedures.flatMap((p) => [p.title, p.when, p.result, ...p.steps, ...(p.errors || []).flatMap((e) => [e.problem, e.solution])]),
  ...tp.faq.flatMap((f) => [f.q, f.a])];

describe('aide par écran', () => {
  it('chaque route du menu a sa fiche', () => {
    const app = fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf8');
    const routes = [...app.matchAll(/<Route path="([a-z][a-z/-]*)"/g)].map((m) => `/${m[1]}`);
    expect(routes.length).toBeGreaterThan(10);
    for (const r of routes) expect(topicForPath(r), r).toBeTruthy();
  });

  it('fiches et écrans alignés : mêmes identifiants, mêmes adresses, une fiche par écran', () => {
    expect(TOPICS.map((t) => t.id).sort()).toEqual(SCREENS.map((s) => s.id).sort());
    for (const s of SCREENS) expect(topicForPath(s.path)?.id, s.path).toBe(s.id);
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
  });

  it('chaque fiche : titre traduit, au moins deux procédures de deux étapes, FR et NL non vides et différents, clés connues, renvois définis', () => {
    for (const tp of TOPICS) {
      expect(translations[tp.titleKey], tp.id).toBeTruthy();
      expect(tp.roles.length, tp.id).toBeGreaterThan(0);
      for (const r of tp.roles) expect(ROLES.includes(r), `${tp.id} : ${r}`).toBe(true);
      expect(tp.layout.length, tp.id).toBeGreaterThan(0);
      expect(tp.procedures.length, tp.id).toBeGreaterThanOrEqual(2);
      for (const p of tp.procedures) expect(p.steps.length, `${tp.id} : ${p.title.fr}`).toBeGreaterThanOrEqual(2);
      for (const l of allTexts(tp)) {
        for (const s of texts(l)) {
          expect(s.trim(), tp.id).toBeTruthy();
          for (const m of s.matchAll(/\{\{([a-z0-9_.]+)\}\}/g)) expect(translations[m[1]], `${tp.id} : ${m[1]}`).toBeTruthy();
        }
        expect(l.nl, `${tp.id} : texte néerlandais identique au français`).not.toBe(l.fr);
      }
      for (const s of tp.seeAlso) expect(TOPICS.some((x) => x.id === s), `${tp.id} → ${s}`).toBe(true);
    }
  });

  it('rédaction : aucune abréviation, aucune personne nommée (ni titre de civilité suivi d\'un nom, ni adresse électronique)', () => {
    for (const tp of TOPICS) for (const l of allTexts(tp)) for (const s of texts(l)) {
      expect(s, `${tp.id} : ${s.slice(0, 50)}`).not.toMatch(/\betc\b|\bex\.|\bp\. ?ex|\bn°|\bcf\.|\bi\.e\./i);
      expect(s, `${tp.id} : personne nommée`).not.toMatch(/\b(Monsieur|Madame|Mme|Mevrouw|Mijnheer)\s+[A-ZÉ]|@(?!exemple|voorbeeld)[a-z0-9-]+\./);
    }
  });

  it('parcours par rôle : chaque rôle a un parcours, ses fiches existent et ne se répètent pas', () => {
    for (const r of ROLES) {
      expect(PATHS[r].length, r).toBeGreaterThan(0);
      expect(new Set(PATHS[r]).size, r).toBe(PATHS[r].length);
      for (const id of PATHS[r]) expect(TOPICS.some((t) => t.id === id), `${r} → ${id}`).toBe(true);
    }
  });

  it('les fiches de chaque parcours sont destinées à ce rôle', () => {
    for (const r of ROLES) for (const id of PATHS[r]) {
      const tp = TOPICS.find((t) => t.id === id)!;
      expect(tp.roles.includes(r), `${r} lit la fiche ${id}`).toBe(true);
    }
  });

  it('repères : chaque fiche a une capture d\'ensemble, ses repères [[n]] vont de 1 au nombre de repères de la capture, chaque capture est utilisée', () => {
    for (const tp of TOPICS) {
      const shots = new Map(tp.shots.map((s) => [s.id, s]));
      expect(tp.overviewShot, `${tp.id} : capture d'ensemble`).toBeTruthy();
      const over = shots.get(tp.overviewShot as string);
      expect(over, `${tp.id} : ${tp.overviewShot}`).toBeTruthy();
      const used = new Set<string>([tp.overviewShot as string]);
      for (const p of tp.procedures) for (const id of p.shots || []) { expect(shots.has(id), `${tp.id} : ${id}`).toBe(true); used.add(id); }
      for (const s of tp.shots) expect(used.has(s.id), `${tp.id} : capture ${s.id} jamais utilisée`).toBe(true);
      const nums = [...new Set(tp.layout.flatMap((l) => [...l.fr.matchAll(/\[\[(\d+)\]\]/g)].map((m) => Number(m[1]))))].sort((a, b) => a - b);
      expect(nums, `${tp.id} : repères du texte`).toEqual((over?.marks || []).map((_, i) => i + 1));
      for (const l of tp.layout) expect([...l.fr.matchAll(/\[\[(\d+)\]\]/g)].map((m) => m[1]), `${tp.id} : repères FR et NL différents`).toEqual([...l.nl.matchAll(/\[\[(\d+)\]\]/g)].map((m) => m[1]));
      for (const s of tp.shots) { expect(s.path.startsWith('/'), s.id).toBe(true); expect(s.marks?.length ?? 0, `${tp.id} : ${s.id} sans repère`).toBeGreaterThan(0); }
    }
  });

  it('chaque capture de procédure illustre la bonne procédure (la capture de la création d\'un compte était sur une autre procédure en 0.2.8)', () => {
    const EXPECTED: Record<string, string[]> = {
      'users-create': ['Créer un compte'], 'contacts-create': ['Créer un contact'], 'tickets-report': ['Signaler un problème ou poser une question'],
      'register-fiche': ['Corriger un courrier enregistré', 'Annuler un enregistrement'],
      'bannettes-attribution': ['Attribuer un courrier'],
    };
    const seen: Record<string, string[]> = {};
    for (const tp of TOPICS) for (const p of tp.procedures) for (const id of p.shots || []) (seen[id] ||= []).push(p.title.fr);
    expect(seen).toEqual(EXPECTED);
  });

  it('identifiants de capture uniques et légendes FR et NL', () => {
    const ids = TOPICS.flatMap((tp) => tp.shots.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of TOPICS.flatMap((tp) => tp.shots)) for (const c of texts(s.caption)) expect(c.trim(), s.id).toBeTruthy();
  });
});

describe('captures présentes (npm run help:check, après npm run help:capture, version 0.2.8)', () => {
  it.runIf(process.env.HELP_STRICT === '1')('chaque capture existe en FR et en NL', () => {
    for (const s of TOPICS.flatMap((tp) => tp.shots)) for (const l of ['fr', 'nl']) {
      expect(fs.existsSync(path.resolve(process.cwd(), 'public', 'help', l, `${s.id}.jpg`)), `${l}/${s.id}.jpg`).toBe(true);
    }
  });
});

describe('présentation de l\'aide', () => {
  it('les listes des fiches ont une marge à gauche : les puces ne collent pas au bord (défaut constaté à la recette de la 0.2.7)', () => {
    const css = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
    expect(css).toMatch(/\.help-topic ul, \.help-topic ol \{[^}]*padding-left: 2\d+px/);
  });

  it('titres de procédure et questions passent par l\'affichage qui remplace les clés par les libellés (défaut constaté à la recette de la 0.2.7)', () => {
    const view = fs.readFileSync(path.join(SRC, 'help', 'TopicView.tsx'), 'utf8');
    expect(view).toMatch(/label: <RichText text=\{tx\(p\.title\)\} \/>/);
    expect(view).toMatch(/label: <RichText text=\{tx\(f\.q\)\} \/>/);
  });
});

describe('sécurité du texte d\'aide', () => {
  it('aucun HTML interprété : le texte des fiches passe par React, jamais par dangerouslySetInnerHTML ni innerHTML', () => {
    for (const f of tsx(SRC)) expect(fs.readFileSync(f, 'utf8'), path.basename(f)).not.toMatch(/dangerouslySetInnerHTML|\.innerHTML\s*=/);
  });

  it('un texte d\'aide contenant du HTML s\'affiche tel quel, sans balise interprétée', () => {
    const risky = TOPICS.flatMap((tp) => allTexts(tp).flatMap(texts)).filter((s) => /<[a-z/]/i.test(s));
    expect(risky).toEqual([]);
  });
});

describe('explication de chaque champ', () => {
  it('tout Form.Item nommé et tout GroupItem porte une infobulle', () => {
    for (const f of tsx(SRC)) {
      const src = fs.readFileSync(f, 'utf8');
      // GroupItem.tsx est l'enveloppe qui reçoit l'infobulle de ses appelants : elle est contrôlée à leur appel.
      if (!f.endsWith('GroupItem.tsx')) for (const m of src.matchAll(/<Form\.Item\b[^>]*\bname=[^>]*>/g)) expect(m[0], `${path.basename(f)} : ${m[0].slice(0, 80)}`).toMatch(/tooltip=/);
      for (const m of src.matchAll(/<GroupItem\b[^>]*>/g)) expect(m[0], `${path.basename(f)} : ${m[0].slice(0, 80)}`).toMatch(/tooltip=/);
    }
  });

  it('aucun titre de champ en élément label sans champ associé : plus de htmlFor neutralisé, les groupes passent par GroupItem', () => {
    for (const f of tsx(SRC)) expect(fs.readFileSync(f, 'utf8'), path.basename(f)).not.toMatch(/NO_FOR|htmlFor: undefined/);
    const groups = tsx(SRC).reduce((n, f) => n + (fs.readFileSync(f, 'utf8').match(/<GroupItem\b/g) || []).length, 0);
    expect(groups).toBeGreaterThanOrEqual(20);
  });

  it('chaque clé appelée existe ; chaque explication fait 12 caractères au moins en FR et en NL', () => {
    for (const f of tsx(SRC)) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/\bhint\('([a-z0-9_.]+)'\)/g)) expect(hints[m[1]], `${path.basename(f)} : ${m[1]}`).toBeTruthy();
    }
    for (const [k, v] of Object.entries(hints)) { expect(v.fr.length, k).toBeGreaterThanOrEqual(12); expect(v.nl.length, k).toBeGreaterThanOrEqual(12); }
  });

  it('aucune explication ne commence par « Le champ » et aucune n\'est inutilisée', () => {
    const used = new Set<string>();
    for (const f of tsx(SRC)) for (const m of fs.readFileSync(f, 'utf8').matchAll(/\bhint\('([a-z0-9_.]+)'\)/g)) used.add(m[1]);
    for (const [k, v] of Object.entries(hints)) {
      expect(v.fr, k).not.toMatch(/^Le champ\b/);
      expect(v.nl, k).not.toMatch(/^Het veld\b/);
      expect(v.nl, `${k} : texte néerlandais identique au français`).not.toBe(v.fr);
      expect(used.has(k), `${k} : explication jamais appelée`).toBe(true);
    }
  });

  it('aucun champ de saisie sans identifiant ni nom, hors Form.Item nommé (remarque de Chrome constatée en 0.2.8)', () => {
    for (const f of tsx(SRC)) {
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => {
        for (const m of line.matchAll(/<Input(?:\.TextArea|\.Password|\.Search)?(?=[\s/>])/g)) {
          const near = lines.slice(Math.max(0, i - 3), i + 1).join(' ');
          const named = /\b(name|id)=/.test(line.slice(m.index)) || /<Form\.Item\b[^>]*\bname=/.test(near) || /<GroupItem\b/.test(near);
          expect(named, `${path.basename(f)}:${i + 1} : ${line.trim().slice(0, 90)}`).toBe(true);
        }
      });
    }
  });

  it('aucun champ de saisie sans attribut d\'autocomplétion (remarque des outils de développement de Chrome)', () => {
    for (const f of tsx(SRC)) {
      for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
        for (const m of line.matchAll(/<Input(?:\.TextArea|\.Password)?(?=[\s/>])/g)) {
          expect(line.slice(m.index), `${path.basename(f)} : ${line.trim().slice(0, 80)}`).toMatch(/autoComplete=/);
        }
      }
    }
  });
});

describe('captures : fichiers livrés dans l\'archive', () => {
  const dir = (l: string) => path.resolve(process.cwd(), 'public', 'help', l);
  it('chaque capture existe en FR et en NL, est une image JPEG et ne dépasse pas 400 Ko', () => {
    for (const s of TOPICS.flatMap((tp) => tp.shots)) for (const l of ['fr', 'nl']) {
      const f = path.join(dir(l), `${s.id}.jpg`);
      expect(fs.existsSync(f), `${l}/${s.id}.jpg absent : npm run help:capture`).toBe(true);
      const b = fs.readFileSync(f);
      expect([b[0], b[1], b[2]], `${l}/${s.id}.jpg n'est pas une image JPEG`).toEqual([0xff, 0xd8, 0xff]);
      expect(b.length, `${l}/${s.id}.jpg`).toBeLessThan(400 * 1024);
    }
  });

  it('aucune capture sans fiche : les dossiers FR et NL ne contiennent que les images décrites', () => {
    const ids = new Set(TOPICS.flatMap((tp) => tp.shots.map((s) => `${s.id}.jpg`)));
    for (const l of ['fr', 'nl']) for (const f of fs.readdirSync(dir(l))) expect(ids.has(f), `${l}/${f}`).toBe(true);
  });
});
