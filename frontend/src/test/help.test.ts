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

  it('rédaction : aucune abréviation, aucune personne nommée', () => {
    for (const tp of TOPICS) for (const l of allTexts(tp)) for (const s of texts(l)) {
      expect(s, `${tp.id} : ${s.slice(0, 50)}`).not.toMatch(/\betc\b|\bex\.|\bp\. ?ex|\bn°|\bcf\.|\bi\.e\./i);
      expect(s, `${tp.id}`).not.toMatch(/Schmitz|Ziegler|El Madani|Bachir|Renaud|Julie/);
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
  it('tout Form.Item nommé porte une infobulle', () => {
    for (const f of tsx(SRC)) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/<Form\.Item\b[^>]*\bname=[^>]*>/g)) expect(m[0], `${path.basename(f)} : ${m[0].slice(0, 80)}`).toMatch(/tooltip=/);
    }
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
