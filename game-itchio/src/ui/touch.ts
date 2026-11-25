import type { PadEvent } from '../core/input';

/**
 * The on-screen pad. It only reports presses; the game keeps the state, so a
 * phone and a keyboard go through exactly the same path.
 */
export function wireTouchPad(root: HTMLElement): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>('button[data-touch]');

  for (const button of buttons) {
    const control = button.dataset.touch as PadEvent['control'] | undefined;
    if (!control) continue;

    const send = (down: boolean) => {
      button.classList.toggle('is-down', down);
      window.dispatchEvent(new CustomEvent<PadEvent>('gi:pad', { detail: { control, down } }));
    };

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      send(true);
    });
    button.addEventListener('pointerup', () => send(false));
    button.addEventListener('pointercancel', () => send(false));
    button.addEventListener('lostpointercapture', () => send(false));
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  }
}
