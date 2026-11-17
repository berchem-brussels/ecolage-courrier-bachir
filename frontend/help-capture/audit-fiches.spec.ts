/**
 * Audit « fiche contre écran réel » : pour chaque fiche, les libellés cités dans la liste des zones ({{clé}}) doivent exister à
 * l'écran de la fiche ; ceux des étapes sont cherchés à l'écran, puis signalés « non vus » s'ils sont dans une fenêtre.
 * Cible : l'instance de démonstration (npm run help:demo). Résultat : audit-fiches.txt, et le test échoue si une zone cite un
 * libellé absent de l'écran (hors liste des absences connues, avec leur raison).
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOPICS } from '../src/help';
import { translations } from '../src/i18n';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const keys = (s: string) => [...s.matchAll(/\{\{([a-z0-9_.]+)\}\}/g)].map((m) => m[1]);

/** Libellés cités par une zone mais absents de l'écran de démonstration pour une raison connue. */
const KNOWN_ABSENT: Record<string, string> = {
  'registration:mail.session.last': 'bloc visible après le deuxième enregistrement de la séance',
  'users:users.new': 'titre de la fenêtre de création, pas du texte de la page',
  'users:users.microsoft_linked': 'étiquette visible après la première connexion Microsoft du compte',
  'services:common.nl.validate': 'étiquette visible seulement pour un nom néerlandais à valider',
  'services:common.nl.missing': 'étiquette visible seulement pour un nom néerlandais manquant',
  'types:common.inactive': 'étiquette visible seulement pour un type désactivé',
  'entities:entity.edit': 'titre de la fenêtre ouverte par un clic sur une ligne des entités',
  'entities:register.edit': 'titre de la fenêtre ouverte par un clic sur une ligne des registres',
  'entities:register.issued': 'texte de la fenêtre du registre, affiché quand des numéros ont déjà été donnés',
  'bannettes:box.mon_service': 'onglet des agents et responsables : le compte de démonstration tient le registre',
  'bannettes:box.moi': 'onglet des agents et responsables : le compte de démonstration tient le registre',
  'bannettes:box.en_copie': 'onglet des agents et responsables : le compte de démonstration tient le registre',
  'bannettes:box.clos': 'onglet des agents et responsables : le compte de démonstration tient le registre',
  'accessibility:layout.skip': 'lien visible seulement au focus clavier',
};

test('fiches contre écrans réels', async ({ page }) => {
  await page.goto('/login?local=1');
  await page.fill('#email', process.env.HELP_USER || '');
  await page.fill('#password', process.env.HELP_PASSWORD || '');
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  const out: string[] = [];
  const bad: string[] = [];
  for (const tp of TOPICS) {
    await page.goto(tp.path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    const seen = await page.evaluate(() => {
      const main = document.body;
      const parts = [main.innerText || ''];
      main.querySelectorAll('[aria-label],[placeholder],[title]').forEach((e) => parts.push(e.getAttribute('aria-label') || '', e.getAttribute('placeholder') || '', e.getAttribute('title') || ''));
      return parts.join('\n');
    });
    const has = (k: string) => seen.includes(translations[k]?.fr || `??${k}`);
    const zones = [...new Set(tp.layout.flatMap((l) => keys(l.fr)))];
    const steps = [...new Set(tp.procedures.flatMap((p) => p.steps.flatMap((s) => keys(s.fr))))].filter((k) => !zones.includes(k));
    const missZone = zones.filter((k) => !has(k) && !KNOWN_ABSENT[`${tp.id}:${k}`]);
    const missStep = steps.filter((k) => !has(k));
    out.push(`${tp.id} (${tp.path}) : zones absentes : ${missZone.map((k) => `${k}=« ${translations[k]?.fr} »`).join(' ; ') || 'aucune'} ; étapes non vues à l'écran : ${missStep.map((k) => `${k}=« ${translations[k]?.fr} »`).join(' ; ') || 'aucune'}`);
    for (const k of missZone) bad.push(`${tp.id} : « ${translations[k]?.fr} » (${k})`);
  }
  fs.writeFileSync(path.join(HERE, '..', 'audit-fiches.txt'), out.join('\n') + '\n');
  console.log(out.join('\n'));
  expect(bad, `zones citant un libellé absent de l'écran : ${bad.join(' ; ')}`).toEqual([]);
});
