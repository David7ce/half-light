import type { CharacterDef } from '../types';

/**
 * Three bodies, one story. The stats are multipliers over the base tuning in
 * `config.ts`; adding a fourth character means one entry here and nothing else.
 */
export const CHARACTERS: readonly CharacterDef[] = [
  {
    id: 'iris',
    name: 'Iris',
    title: { es: 'La cartógrafa', en: 'The cartographer' },
    blurb: {
      es: 'Equilibrada. Aguanta tres golpes y aprende rápido.',
      en: 'Balanced. Takes three hits and learns fast.',
    },
    palette: {
      skin: '#e7b98f',
      hair: '#3b2a4a',
      hairLight: '#6b4a86',
      hairDark: '#241a30',
      cloth: '#4f7fa8',
      clothDark: '#2f4d68',
      trim: '#e0c07a',
      eye: '#141020',
    },
    stats: { speed: 1, jump: 1, maxHp: 3, maxEnergy: 120, drain: 1, regen: 1 },
  },
  {
    id: 'nao',
    name: 'Nao',
    title: {
      es: 'El funámbulo',
      en: 'The tightrope walker',
    },
    blurb: {
      es: 'Ligera y rápida. Dos golpes, mucha altura.',
      en: 'Light and quick. Two hits, plenty of height.',
    },
    palette: {
      skin: '#c98d63',
      hair: '#d9d2c4',
      hairLight: '#f4efe4',
      hairDark: '#9a9285',
      cloth: '#b05a6a',
      clothDark: '#713a47',
      trim: '#f2d8a0',
      eye: '#141020',
    },
    stats: { speed: 1.12, jump: 1.06, maxHp: 2, maxEnergy: 100, drain: 1.15, regen: 1.05 },
  },
  {
    id: 'vero',
    name: 'Vero',
    title: { es: 'La ancla', en: 'The anchor' },
    blurb: {
      es: 'Lenta y pesada. Cuatro golpes y la proyección le cuesta menos.',
      en: 'Slow and heavy. Four hits, and projecting costs less.',
    },
    palette: {
      skin: '#8f6247',
      hair: '#1f2a26',
      hairLight: '#3d534b',
      hairDark: '#101714',
      cloth: '#6b7048',
      clothDark: '#434728',
      trim: '#c9a15c',
      eye: '#f2e6c8',
    },
    stats: { speed: 0.92, jump: 1, maxHp: 4, maxEnergy: 150, drain: 0.8, regen: 0.85 },
  },
];

export function characterById(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
