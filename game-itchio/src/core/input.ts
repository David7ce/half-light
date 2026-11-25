import Phaser from 'phaser';
import type { PadButtons } from './gamepad';

/**
 * Keyboard, on-screen pad and gamepad, behind the same tiny interface. Jump is
 * an edge (a tap shorter than a frame still counts); movement is held.
 *
 * WASD and the arrows both move; W also jumps. Menus read the `nav*` edges, so
 * the same keys navigate the title, the pause menu and the story cards.
 */
export type Action =
  | 'jump'
  | 'astral'
  | 'restart'
  | 'pause'
  | 'mute'
  | 'interact'
  | 'quit'
  | 'navUp'
  | 'navDown'
  | 'navLeft'
  | 'navRight'
  | 'navConfirm'
  | 'back';

export interface PadEvent {
  control: 'left' | 'right' | 'jump' | 'astral';
  down: boolean;
}

export class Input {
  private readonly up: Phaser.Input.Keyboard.Key;
  private readonly left: Phaser.Input.Keyboard.Key;
  private readonly right: Phaser.Input.Keyboard.Key;
  private readonly a: Phaser.Input.Keyboard.Key;
  private readonly d: Phaser.Input.Keyboard.Key;
  private readonly w: Phaser.Input.Keyboard.Key;
  private readonly space: Phaser.Input.Keyboard.Key;
  private readonly shift: Phaser.Input.Keyboard.Key;
  private readonly e: Phaser.Input.Keyboard.Key;

  private readonly edges = new Set<Action>();
  private readonly pad = { left: false, right: false, jump: false, astral: false };
  private readonly dispose: Array<() => void> = [];

  private gpMove = 0;
  private gpJump = false;
  private gpAstral = false;
  private readonly gpPrev: PadButtons = {
    jump: false,
    astral: false,
    pause: false,
    back: false,
    up: false,
    down: false,
    left: false,
    right: false,
  };

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('a keyboard is required');

    this.up = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.left = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.right = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.a = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.d = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.w = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.space = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shift = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.e = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ]);

    const listen = (key: Phaser.Input.Keyboard.Key, action: Action) => {
      const handler = () => this.edges.add(action);
      key.on('down', handler);
      this.dispose.push(() => key.off('down', handler));
    };
    const addKey = (code: number) => keyboard.addKey(code);

    listen(this.space, 'jump');
    listen(this.up, 'jump');
    listen(this.w, 'jump');
    listen(this.shift, 'astral');
    listen(this.e, 'interact');
    listen(addKey(Phaser.Input.Keyboard.KeyCodes.R), 'restart');
    listen(addKey(Phaser.Input.Keyboard.KeyCodes.ESC), 'pause');
    listen(addKey(Phaser.Input.Keyboard.KeyCodes.ESC), 'back');
    listen(addKey(Phaser.Input.Keyboard.KeyCodes.M), 'mute');
    listen(addKey(Phaser.Input.Keyboard.KeyCodes.T), 'quit');

    listen(this.up, 'navUp');
    listen(this.w, 'navUp');
    listen(addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), 'navDown');
    listen(addKey(Phaser.Input.Keyboard.KeyCodes.S), 'navDown');
    listen(this.left, 'navLeft');
    listen(this.a, 'navLeft');
    listen(this.right, 'navRight');
    listen(this.d, 'navRight');
    listen(this.space, 'navConfirm');
    listen(addKey(Phaser.Input.Keyboard.KeyCodes.ENTER), 'navConfirm');

    const onPad = (event: Event) => {
      const detail = (event as CustomEvent<PadEvent>).detail;
      if (!detail) return;
      this.pad[detail.control] = detail.down;
      if (detail.control === 'jump' && detail.down) this.edges.add('jump');
      if (detail.control === 'astral' && detail.down) this.edges.add('astral');
    };
    window.addEventListener('gi:pad', onPad);
    this.dispose.push(() => window.removeEventListener('gi:pad', onPad));
  }

  /** Called once per frame by the scene, before reading anything. */
  poll(pad: PadButtons): void {
    this.gpMove = (pad.right ? 1 : 0) - (pad.left ? 1 : 0);
    this.gpJump = pad.jump;
    this.gpAstral = pad.astral;

    const edge = (now: boolean, was: boolean, action: Action) => {
      if (now && !was) this.edges.add(action);
    };
    edge(pad.jump, this.gpPrev.jump, 'jump');
    edge(pad.jump, this.gpPrev.jump, 'navConfirm');
    edge(pad.up, this.gpPrev.up, 'navUp');
    edge(pad.down, this.gpPrev.down, 'navDown');
    edge(pad.left, this.gpPrev.left, 'navLeft');
    edge(pad.right, this.gpPrev.right, 'navRight');
    edge(pad.pause, this.gpPrev.pause, 'pause');
    edge(pad.back, this.gpPrev.back, 'back');
    Object.assign(this.gpPrev, pad);
  }

  get moveX(): number {
    const left = this.left.isDown || this.a.isDown || this.pad.left;
    const right = this.right.isDown || this.d.isDown || this.pad.right;
    return Phaser.Math.Clamp((right ? 1 : 0) - (left ? 1 : 0) + this.gpMove, -1, 1);
  }

  get jumpHeld(): boolean {
    return this.space.isDown || this.up.isDown || this.w.isDown || this.pad.jump || this.gpJump;
  }

  /** Holding SHIFT (or the pad button) projects; letting go comes back. */
  get astralHeld(): boolean {
    return this.shift.isDown || this.pad.astral || this.gpAstral;
  }

  consume(action: Action): boolean {
    if (!this.edges.has(action)) return false;
    this.edges.delete(action);
    return true;
  }

  /** Drops edges nobody read, so a press does not fire in the next menu. */
  flush(): void {
    this.edges.clear();
  }

  destroy(): void {
    for (const off of this.dispose) off();
    this.dispose.length = 0;
  }
}
