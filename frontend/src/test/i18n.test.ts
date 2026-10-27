/** Parité FR/NL et absence de texte en dur dans les écrans (patron SAGA i18n-parity.test.ts, PILOT i18n-audit). */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { translations, intents } from '../i18n';
import { answer } from '../components/Chatbot';

const SRC = path.resolve(process.cwd(), 'src');
const tsx = (dir: string): string[] => fs.readdirSync(dir).flatMap((f) => {
  const p = path.join(dir, f);
  if (fs.statSync(p).isDirectory()) return f === 'test' ? [] : tsx(p);
  return p.endsWith('.tsx') ? [p] : [];
});

describe('traductions', () => {
  it('chaque clé a un FR et un NL non vides', () => {
    for (const [k, v] of Object.entries(translations)) {
      expect(v.fr?.trim(), `${k} fr`).toBeTruthy();
      expect(v.nl?.trim(), `${k} nl`).toBeTruthy();
    }
  });

  it('chaque clé appelée par t() existe', () => {
    for (const f of tsx(SRC)) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\('([a-z0-9_.]+)'\)/g)) expect(translations[m[1]], `${path.basename(f)} : ${m[1]}`).toBeTruthy();
    }
  });

  it('aucun texte accentué en dur dans le JSX des écrans', () => {
    for (const f of tsx(SRC)) {
      const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      const hits = [...src.matchAll(/>\s*([^<>{}]*[éèêàçùôîÉÈ][^<>{}]*)\s*</g)].map((m) => m[1].trim()).filter(Boolean);
      expect(hits, path.basename(f)).toEqual([]);
    }
  });

  it('les intentions du chatbot renvoient à des clés existantes', () => {
    for (const i of intents) expect(translations[i.answer]).toBeTruthy();
    expect(answer('je veux enregistrer un courrier').route).toBe('/enregistrer');
    expect(answer('ik wil een brief registreren').route).toBe('/enregistrer');
    expect(answer('comment supprimer un courrier enregistré par erreur').key).toBe('chat.intent.cancel');
    expect(answer('retrouver le numéro AC-2026-000004').route).toBe('/registre');
    expect(answer('wachtwoord wijzigen').key).toBe('chat.intent.password');
    expect(answer('où déposer un scan ?').route).toBe('/a-enregistrer');
    expect(answer('waar leg ik een bestand neer').route).toBe('/a-enregistrer');
    expect(answer('qui a ouvert ce courrier').route).toBe('/consultations');
    expect(answer('zzz').key).toBe('chat.unknown');
  });
});
