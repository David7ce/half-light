/**
 * The game is data: chapters hold story, a music theme and their levels; a level
 * is an ASCII map plus a handful of objects. A new chapter is one more object in
 * this array and no scene changes.
 *
 * Tiles: `.` empty · `#` ground · `W` wall (material only) · `=` ledge (both
 * worlds) · `~` astral slab (astral only) · `^` spikes · `P` spawn · `D` door ·
 * `S` save altar · `p`/`+` energy/health potion · `*` shard · `e` walker ·
 * `w` wisp · `n` ally.
 */
import type { ChapterDef, LevelDef, Localized } from '../types';
import { parseTemplate } from './level';

const map = parseTemplate;
const name = (es: string, en: string): Localized => ({ es, en });

export const CHAPTERS: readonly ChapterDef[] = [
  {
    id: 'threshold',
    name: name('El umbral', 'The threshold'),
    subtitle: name('donde el cuerpo deja de mandar', 'where the body stops deciding'),
    story: {
      es: [
        'La torre se paró a medianoche y nadie dentro ha vuelto a soñar.',
        'Tu cuerpo no puede cruzar sus muros. Tu sombra, sí.',
        'Mantén SHIFT para proyectarte: el tiempo se ralentiza y el mundo se vuelve astral.',
      ],
      en: [
        'The tower stopped at midnight and nobody inside has dreamed since.',
        'Your body cannot cross its walls. Your shadow can.',
        'Hold SHIFT to project: time slows down and the world turns astral.',
      ],
    },
    outro: {
      es: [
        'La primera puerta cede.',
        'Arriba, algo de latón gira sin descanso y cuenta un tiempo que ya no existe.',
      ],
      en: [
        'The first door gives way.',
        'Above, something brass turns without rest, counting a time that no longer is.',
      ],
    },
    theme: 'threshold',
    levels: [
      {
        id: '1-1',
        name: name('El muro que no estaba', 'The wall that was not there'),
        map: map(`
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .................WW
          .................WW
          .................WW........~~~.~~
          ...P....S........WW.*.p.............^^.............D
          ###########################~~~.~~#####################
          ###########################......#####################
          ###########################......#####################
          ###########################......#####################
        `),
        objects: [],
      },
      {
        id: '1-2',
        name: name('El mecanismo dormido', 'The sleeping mechanism'),
        map: map(`
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .
          ............................................*
          .
          ...........................................===
          ..P........S............p..e........................D
          ##############.........###########............##########
          ##############.........###########............##########
          ##############.........###########............##########
          ##############.........###########............##########
        `),
        objects: [
          { type: 'mover', tx: 14, ty: 14, axis: 'x', distance: 7, period: 7, length: 3 },
        ],
      },
    ],
  },
  {
    id: 'wheels',
    name: name('Las ruedas', 'The wheels'),
    subtitle: name('el tiempo que la torre perdió', 'the time the tower lost'),
    story: {
      es: [
        'Las ruedas de latón miden el tiempo que la torre perdió.',
        'Los que se quedaron aquí no ven tu cuerpo, pero sí tu luz.',
        'Las pociones sostienen la proyección. Las esquirlas, la memoria.',
      ],
      en: [
        'The brass wheels measure the time the tower lost.',
        'Those who stayed here cannot see your body, but they see your light.',
        'Potions hold the projection up. Shards, your memory.',
      ],
    },
    outro: {
      es: [
        'El mecanismo se detiene por primera vez en años.',
        'La torre respira, y tú también.',
      ],
      en: ['The mechanism stops for the first time in years.', 'The tower breathes, and so do you.'],
    },
    theme: 'wheels',
    levels: [
      {
        id: '2-1',
        name: name('Dos vueltas', 'Two turns'),
        map: map(`
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .
          ..........................................w
          ................................*
          .
          ..P.....S.............+..e............................D
          ###########..........#######..........#########.....####
          ###########..........#######..........#########.....####
          ###########..........#######..........#########.....####
          ###########..........#######..........#########.....####
        `),
        objects: [
          { type: 'spinner', tx: 15, ty: 13, radius: 2.6, pads: 4, period: 7 },
          { type: 'spinner', tx: 32, ty: 13, radius: 2.6, pads: 4, period: -8 },
          { type: 'mover', tx: 47, ty: 15, axis: 'x', distance: 4, period: 5, length: 2 },
        ],
      },
      {
        id: '2-2',
        name: name('El pozo', 'The well'),
        map: map(`
          .
          .
          .
          .
          ..................................................D
          ........................................===============
          ........................WW......w....*
          ........................WW........====
          .....................S..WW....+
          ....................====WW.=====
          ................*
          ...............p
          .............====
          .
          .
          ......====
          ..P
          ##############
          ##############
          ##############
        `),
        objects: [],
      },
    ],
  },
  {
    id: 'tower',
    name: name('La torre astral', 'The astral tower'),
    subtitle: name('lo que dejaron encendido los demás', 'what the others left burning'),
    story: {
      es: [
        'En lo alto, la puerta astral espera a quien recuerde su nombre.',
        'No estás solo: otros proyectores dejaron faroles encendidos en la escalera.',
        'Los faroles hablan, y el suyo también.',
      ],
      en: [
        'At the top, the astral door waits for whoever remembers its name.',
        'You are not alone: other projectors left lamps burning on the stair.',
        'The lamps talk, and yours does too.',
      ],
    },
    outro: {
      es: ['La puerta se abre hacia dentro.', 'Y amanece.'],
      en: ['The door opens inwards.', 'And the sun comes up.'],
    },
    theme: 'tower',
    levels: [
      {
        id: '3-1',
        name: name('Faroles en la escalera', 'Lamps on the stair'),
        map: map(`
          .
          .
          .
          .
          ...............................................+*...D
          ..............................................==========
          .................................w.......n
          .......................................=====
          ..................................==WW
          ....................................WW
          ..............................====..WW
          .
          ..........*
          ......................w
          .
          ..P...n............S..p
          #########..........#######
          #########..........#######
          #########..........#######
          #########..........#######
        `),
        objects: [
          { type: 'spinner', tx: 13, ty: 13, radius: 2.6, pads: 4, period: 7 },
          { type: 'mover', tx: 27, ty: 15, axis: 'y', distance: 4, period: 6, length: 3 },
          {
            type: 'ally',
            tx: 6,
            ty: 15,
            name: 'Lumen',
            gift: 30,
            lines: {
              es: [
                'No cierres los ojos: proyéctate.',
                'La barra azul es tu aliento. Si se vacía, vuelves al cuerpo de golpe.',
              ],
              en: [
                'Do not close your eyes. Project.',
                'The blue bar is your breath. If it empties, you come back to your body at once.',
              ],
            },
          },
          {
            type: 'ally',
            tx: 41,
            ty: 6,
            name: 'Oria',
            gift: 45,
            lines: {
              es: [
                'Te vi pasar por mi pared. Nadie lo había hecho en años.',
                'La puerta del final no se abre con llaves. Se abre con lo que recuerdes.',
              ],
              en: [
                'I saw you pass through my wall. Nobody had done that in years.',
                'The last door does not open with keys. It opens with what you remember.',
              ],
            },
          },
        ],
      },
      {
        id: '3-2',
        name: name('La puerta', 'The door'),
        map: map(`
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .
          .............................................*
          .
          .
          ............*
          .......................................w
          ..P......S........p.e..............+..n..............D
          ###########~~~.~~########........########........######
          ###########......########........########........######
          ###########......########........########........######
          ###########......########........########........######
        `),
        objects: [
          { type: 'spinner', tx: 29, ty: 13, radius: 2.4, pads: 4, period: 6 },
          { type: 'mover', tx: 42, ty: 15, axis: 'x', distance: 5, period: 4.5, length: 2 },
          {
            type: 'ally',
            tx: 38,
            ty: 15,
            name: 'Sella',
            gift: 40,
            lines: {
              es: [
                'La puerta cuenta las esquirlas que llevas, no las que te faltan.',
                'Cuando entres, no mires atrás: el cuerpo se queda, la sombra sube.',
              ],
              en: [
                'The door counts the shards you carry, not the ones you miss.',
                'When you go in, do not look back: the body stays, the shadow rises.',
              ],
            },
          },
        ],
      },
    ],
  },
];

export const ENDING = {
  es: [
    'La torre vuelve a dar la hora.',
    'Tu cuerpo, por fin, pesa; tu sombra, por fin, descansa.',
    'Amanece sobre el umbral.',
  ],
  en: [
    'The tower strikes the hour again.',
    'Your body, at last, has weight; your shadow, at last, rests.',
    'The sun comes up over the threshold.',
  ],
};

export function levels(): LevelDef[] {
  return CHAPTERS.flatMap((chapter) => chapter.levels);
}

export function totalShards(): number {
  let total = 0;
  for (const level of levels()) {
    for (const row of level.map) total += [...row].filter((char) => char === '*').length;
  }
  return total;
}
