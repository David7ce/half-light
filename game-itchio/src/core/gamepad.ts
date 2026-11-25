/**
 * One reader for every pad. Browsers expose gamepads only through polling, so
 * `update()` is called once per frame and the edge detection lives here, next to
 * the button map. Standard layout: A/✕ jump, B/○ astral, Start pause, D-pad or
 * left stick to move and navigate.
 */
export interface PadButtons {
  jump: boolean;
  astral: boolean;
  pause: boolean;
  back: boolean;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

function empty(): PadButtons {
  return {
    jump: false,
    astral: false,
    pause: false,
    back: false,
    up: false,
    down: false,
    left: false,
    right: false,
  };
}

export class GamepadReader {
  state: PadButtons = empty();
  pressed: PadButtons = empty();
  connected = false;
  private prev: PadButtons = empty();

  update(): void {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const pads = nav?.getGamepads?.() ?? [];
    const next = empty();
    let pad: Gamepad | null = null;
    for (const candidate of pads) {
      if (candidate && candidate.connected) {
        pad = candidate;
        break;
      }
    }
    this.connected = pad !== null;

    if (pad) {
      const button = (index: number) => pad!.buttons[index]?.pressed === true;
      const axisX = pad.axes[0] ?? 0;
      const axisY = pad.axes[1] ?? 0;
      const dead = 0.3;
      next.left = axisX < -dead || button(14);
      next.right = axisX > dead || button(15);
      next.up = axisY < -dead || button(12);
      next.down = axisY > dead || button(13);
      next.jump = button(0);
      next.astral = button(1) || button(4) || button(5) || button(6) || button(7);
      next.pause = button(9);
      next.back = button(1) || button(8);
    }

    for (const key of Object.keys(next) as Array<keyof PadButtons>) {
      this.pressed[key] = next[key] && !this.prev[key];
    }
    this.state = next;
    this.prev = { ...next };
  }
}

export const gamepad = new GamepadReader();
