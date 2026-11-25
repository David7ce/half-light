import Phaser from 'phaser';

/**
 * Keyboard plus the on-screen pad. Jump and astral are edges (a tap shorter
 * than a frame still counts); movement is a held state.
 */
export type Action = 'jump' | 'astral' | 'restart' | 'pause' | 'mute' | 'interact' | 'quit';

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
  private readonly space: Phaser.Input.Keyboard.Key;
  private readonly shift: Phaser.Input.Keyboard.Key;
  private readonly e: Phaser.Input.Keyboard.Key;

  private readonly edges = new Set<Action>();
  private readonly pad = { left: false, right: false, jump: false, astral: false };
  private readonly dispose: Array<() => void> = [];

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('a keyboard is required');

    this.up = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.left = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.right = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.a = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.d = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
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
    listen(this.space, 'jump');
    listen(this.up, 'jump');
    listen(this.e, 'interact');
    listen(this.shift, 'astral');
    listen(keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R), 'restart');
    listen(keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC), 'pause');
    listen(keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M), 'mute');
    listen(keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T), 'quit');

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

  get moveX(): number {
    const left = this.left.isDown || this.a.isDown || this.pad.left;
    const right = this.right.isDown || this.d.isDown || this.pad.right;
    return (right ? 1 : 0) - (left ? 1 : 0);
  }

  get jumpHeld(): boolean {
    return this.space.isDown || this.up.isDown || this.pad.jump;
  }

  /** Holding SHIFT (or the pad button) projects; letting go comes back. */
  get astralHeld(): boolean {
    return this.shift.isDown || this.pad.astral;
  }

  consume(action: Action): boolean {
    if (!this.edges.has(action)) return false;
    this.edges.delete(action);
    return true;
  }

  /** Drops edges nobody read, so a press does not fire in the next scene. */
  flush(): void {
    this.edges.clear();
  }

  destroy(): void {
    for (const off of this.dispose) off();
    this.dispose.length = 0;
  }
}
