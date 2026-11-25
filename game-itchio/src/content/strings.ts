/**
 * All UI copy lives here, in both languages. Adding a string means adding it to
 * ES and EN; TypeScript refuses the build if EN misses one.
 */
import type { Lang } from '../types';

const ES = {
  'title.subtitle': 'Proyección astral',
  'title.tagline': 'La torre se paró a medianoche. Sal de tu cuerpo para subir.',
  'title.new': 'NUEVA PARTIDA',
  'title.continue': 'CONTINUAR',
  'title.erase': 'BORRAR PARTIDA',
  'title.choose': 'ELIGE CUERPO',
  'title.enter': 'ENTRAR',
  'title.jam': 'Game Off 2026 · tema SHIFT',
  'title.controls':
    '← → o A D moverse · ESPACIO saltar · SHIFT proyección astral · R reiniciar · ESC pausa · M silencio',
  'title.tip':
    'En el astral el tiempo se ralentiza y las paredes dejan de existir. La barra azul es lo que cuesta.',
  'title.saved': 'Partida: capítulo {chapter} · {name}',
  'title.lang': 'IDIOMA',

  'hud.chapter': 'CAPÍTULO {n} · {name}',
  'hud.shards': 'ESQUIRLAS {n}/9',
  'hud.astral': 'ASTRAL',
  'hud.energy': 'ENERGÍA',
  'hud.hp': 'VIDA',
  'hud.locked': 'AGOTADA',
  'hud.hint': 'SHIFT',

  'toast.saved': 'Zona de guardado',
  'toast.energy': '+ energía',
  'toast.health': '+ vida',
  'toast.shard': 'Esquirla {n}/9',
  'toast.empty': 'Sin energía astral',
  'toast.respawn': 'Vuelves al último guardado',
  'toast.level': '{name}',
  'toast.astral': 'Proyección astral',
  'toast.material': 'Cuerpo material',
  'toast.shardBonus': 'Las esquirlas te sostienen',

  'pause.title': 'PAUSA',
  'pause.resume': 'Continuar',
  'pause.restart': 'Reiniciar zona',
  'pause.mute': 'Silencio: {state}',
  'pause.quit': 'Volver al título',
  'pause.on': 'sí',
  'pause.off': 'no',

  'story.chapter': 'CAPÍTULO {n}',
  'story.next': 'CONTINUAR',
  'story.ending': 'FIN DEL PROTOTIPO',
  'story.thanks':
    'Gracias por jugar. Lo siguiente: más capítulos, más aliados y una torre entera que recordar.',

  'dialogue.more': 'ESPACIO / clic para seguir',
  'dialogue.close': 'ESPACIO / clic para cerrar',

  'level.intro': '{name}',
  'door.locked': 'La puerta no responde todavía',

  'touch.left': '◀',
  'touch.right': '▶',
  'touch.jump': 'SALTO',
  'touch.astral': 'ASTRAL',
} as const;

const EN: Record<keyof typeof ES, string> = {
  'title.subtitle': 'Astral projection',
  'title.tagline': 'The tower stopped at midnight. Leave your body to climb it.',
  'title.new': 'NEW GAME',
  'title.continue': 'CONTINUE',
  'title.erase': 'ERASE SAVE',
  'title.choose': 'CHOOSE A BODY',
  'title.enter': 'ENTER',
  'title.jam': 'Game Off 2026 · theme SHIFT',
  'title.controls':
    '← → or A D move · SPACE jump · SHIFT astral projection · R restart · ESC pause · M mute',
  'title.tip':
    'In the astral the world slows down and walls stop being walls. The blue bar is what it costs.',
  'title.saved': 'Save: chapter {chapter} · {name}',
  'title.lang': 'LANGUAGE',

  'hud.chapter': 'CHAPTER {n} · {name}',
  'hud.shards': 'SHARDS {n}/9',
  'hud.astral': 'ASTRAL',
  'hud.energy': 'ENERGY',
  'hud.hp': 'LIFE',
  'hud.locked': 'SPENT',
  'hud.hint': 'SHIFT',

  'toast.saved': 'Save point',
  'toast.energy': '+ energy',
  'toast.health': '+ life',
  'toast.shard': 'Shard {n}/9',
  'toast.empty': 'Out of astral energy',
  'toast.respawn': 'Back to the last save',
  'toast.level': '{name}',
  'toast.astral': 'Astral projection',
  'toast.material': 'Material body',
  'toast.shardBonus': 'The shards hold you up',

  'pause.title': 'PAUSED',
  'pause.resume': 'Resume',
  'pause.restart': 'Restart room',
  'pause.mute': 'Mute: {state}',
  'pause.quit': 'Back to title',
  'pause.on': 'on',
  'pause.off': 'off',

  'story.chapter': 'CHAPTER {n}',
  'story.next': 'CONTINUE',
  'story.ending': 'END OF THE PROTOTYPE',
  'story.thanks':
    'Thanks for playing. Next: more chapters, more allies, and a whole tower to remember.',

  'dialogue.more': 'SPACE / click to continue',
  'dialogue.close': 'SPACE / click to close',

  'level.intro': '{name}',
  'door.locked': 'The door is not ready yet',

  'touch.left': '◀',
  'touch.right': '▶',
  'touch.jump': 'JUMP',
  'touch.astral': 'ASTRAL',
};

export type StringKey = keyof typeof ES;

const TABLES: Record<Lang, Record<StringKey, string>> = { es: ES, en: EN };

export function t(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  const template = TABLES[lang][key] ?? ES[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole
  );
}

export function lines(lang: Lang, set: { es: string[]; en: string[] }): string[] {
  return set[lang].length > 0 ? set[lang] : set.es;
}
