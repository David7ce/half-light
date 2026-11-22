/**
 * Touch state shared by the DOM pad and the scene. Kept outside Phaser so the
 * buttons work before the canvas has focus, which is how phones actually use
 * this: tap SHIFT without clicking the game first.
 *
 * Movement is a held state; jump and shift are one-shot queues. A tap that
 * lasts less than one frame must still produce exactly one jump or shift, so
 * the buttons and the keyboard both queue an edge instead of polling `isDown`.
 */
export interface TouchState {
  left: boolean;
  right: boolean;
}

export const touch: TouchState = { left: false, right: false };

let shiftQueued = false;
let jumpQueued = false;

export function consumeShift(): boolean {
  if (!shiftQueued) return false;
  shiftQueued = false;
  return true;
}

export function consumeJump(): boolean {
  if (!jumpQueued) return false;
  jumpQueued = false;
  return true;
}

export function wireTouchPad(root: HTMLElement): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-touch]');
  for (const button of buttons) {
    const key = button.dataset.touch as 'left' | 'right' | 'jump' | 'shift';
    const down = (event: PointerEvent) => {
      event.preventDefault();
      if (key === 'left' || key === 'right') touch[key] = true;
      else if (key === 'jump') jumpQueued = true;
      else shiftQueued = true;
      button.setPointerCapture?.(event.pointerId);
    };
    const up = () => {
      if (key === 'left' || key === 'right') touch[key] = false;
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('pointerleave', up);
  }
}
