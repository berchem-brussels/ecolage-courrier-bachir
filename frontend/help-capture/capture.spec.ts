/**
 * Captures annotées de l'aide, en français et en néerlandais, produites depuis l'application avec les données de démonstration
 * (standard v3.3, section 13.1). Jamais de capture à la main. Variables : HELP_BASE_URL, HELP_USER, HELP_PASSWORD (compte de
 * démonstration), HELP_ONLY (identifiants séparés par des virgules), HELP_LANGS (fr, nl ou fr,nl).
 * Résultat : public/help/<langue>/<id>.jpg et un rapport report-<langue>.txt ; le test échoue si une capture échoue ou si un repère
 * est introuvable. Un bouton se vise par sa clé de traduction, jamais par son rang.
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOPICS } from '../src/help';
import { translations } from '../src/i18n';

const LANGS = (process.env.HELP_LANGS || 'fr,nl').split(',') as ('fr' | 'nl')[];
const ONLY = process.env.HELP_ONLY ? new Set(process.env.HELP_ONLY.split(',')) : null;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', 'public', 'help');

async function setLang(page: Page, lang: string) {
  await page.evaluate(async (l) => {
    const me = await (await fetch('/api/auth/me')).json();
    await fetch('/api/auth/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.data.csrf_token }, body: JSON.stringify({ preferred_lang: l }) });
  }, lang);
}

async function mark(page: Page, sel: string, n: number, label?: string) {
  await page.evaluate(({ sel, n, label }) => {
    const all = [...document.querySelectorAll(sel)] as HTMLElement[];
    const el = (label ? all.find((e) => (e.innerText || '').includes(label) || (e.getAttribute('aria-label') || '').includes(label)) : all[0]) || null;
    if (!el) throw new Error(`repère introuvable : ${sel}`);
    const r = el.getBoundingClientRect();
    const box = document.createElement('div');
    box.className = 'help-capture-mark';
    Object.assign(box.style, { position: 'fixed', left: `${r.left - 3}px`, top: `${r.top - 3}px`, width: `${r.width + 6}px`, height: `${r.height + 6}px`, border: '3px solid #cf1322', borderRadius: '6px', zIndex: '99999', pointerEvents: 'none' });
    const badge = document.createElement('div');
    badge.textContent = String(n);
    Object.assign(badge.style, { position: 'absolute', left: '-14px', top: '-14px', width: '24px', height: '24px', borderRadius: '12px', background: '#cf1322', color: '#fff', font: '600 13px Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    box.appendChild(badge);
    document.body.appendChild(box);
  }, { sel, n, label });
}

test('captures de l’aide', async ({ page }) => {
  await page.goto('/login?local=1');
  await page.fill('#email', process.env.HELP_USER || '');
  await page.fill('#password', process.env.HELP_PASSWORD || '');
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  const failures: string[] = [];
  for (const lang of LANGS) {
    const report: string[] = [];
    await setLang(page, lang);
    fs.mkdirSync(path.join(OUT, lang), { recursive: true });
    for (const shot of TOPICS.flatMap((t) => t.shots)) {
      if (ONLY && !ONLY.has(shot.id)) continue;
      try {
        await page.goto(shot.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);
        for (const a of shot.actions || []) {
          if (a.wait) await page.waitForTimeout(a.wait);
          if (a.clickSel) await page.click(a.clickSel);
          if (a.click) await page.getByRole('button', { name: translations[a.click]?.[lang] || a.click }).first().click();
          if (a.fill) await page.fill(a.fill.sel, a.fill.value);
        }
        // La zone découpée et les repères sont mesurés au même instant : la fenêtre ou le tiroir ne bouge plus entre les deux.
        await page.waitForTimeout(shot.clip ? 400 : 0);
        const clip = shot.clip === 'modal' ? '.ant-modal-content' : shot.clip === 'drawer' ? '.ant-drawer-content-wrapper' : null;
        const file = path.join(OUT, lang, `${shot.id}.jpg`);
        const box = clip ? await page.locator(clip).first().boundingBox() : null;
        if (clip && !box) throw new Error(`zone introuvable : ${clip}`);
        if (box) {
          for (const [i, m] of (shot.marks || []).entries()) await mark(page, m.sel, i + 1, m.text ? translations[m.text]?.[lang] : undefined);
          await page.screenshot({ path: file, type: 'jpeg', quality: 72, clip: box });
        } else {
          for (const [i, m] of (shot.marks || []).entries()) await mark(page, m.sel, i + 1, m.text ? translations[m.text]?.[lang] : undefined);
          await page.screenshot({ path: file, type: 'jpeg', quality: 72 });
        }
        report.push(`OK ${shot.id}`);
      } catch (e) {
        report.push(`FAIL ${shot.id} ${(e as Error).message.split('\n')[0]}`);
        failures.push(`${lang}/${shot.id}`);
      } finally {
        await page.evaluate(() => document.querySelectorAll('.help-capture-mark').forEach((n) => n.remove()));
        await page.keyboard.press('Escape');
      }
    }
    fs.writeFileSync(path.join(OUT, `report-${lang}.txt`), report.join('\n') + '\n');
  }
  await setLang(page, 'fr');
  expect(failures, `captures en échec : ${failures.join(', ')}`).toEqual([]);
});
