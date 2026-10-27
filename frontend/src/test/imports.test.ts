/**
 * Imports des langues d'Ant Design et de dayjs.
 * Défaut de la 0.2.3 : avec Vite 8, `import fr from 'antd/locale/fr_FR'` (fichier CommonJS qui renvoie vers lib/) donnait au
 * ConfigProvider l'objet entier du module au lieu de la langue : le sélecteur de date s'affichait en anglais, au format
 * mois/jour, avec la semaine commençant le dimanche. Les tests tournent sous Node, qui lit ce fichier sans erreur : ils ne
 * voient pas ce défaut. Ce test interdit donc la cause : toute langue d'Ant Design vient de `antd/es/locale/`.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(process.cwd(), 'src');
const sources = (dir: string): string[] => fs.readdirSync(dir).flatMap((f) => {
  const p = path.join(dir, f);
  if (fs.statSync(p).isDirectory()) return f === 'test' ? [] : sources(p);
  return /\.(ts|tsx)$/.test(f) ? [p] : [];
});

describe('imports des langues', () => {
  it('aucune langue d\'Ant Design n\'est importée par un fichier CommonJS (antd/locale, antd/lib)', () => {
    const files = sources(SRC);
    expect(files.length).toBeGreaterThan(20);
    const fautifs = files.filter((f) => /from\s+['"]antd\/(locale|lib)\//.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(SRC, f));
    expect(fautifs).toEqual([]);
  });

  it('App.tsx importe les langues française et néerlandaise d\'Ant Design depuis antd/es/locale', () => {
    const app = fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf8');
    expect(app).toMatch(/from\s+'antd\/es\/locale\/fr_FR'/);
    expect(app).toMatch(/from\s+'antd\/es\/locale\/nl_NL'/);
  });
});
