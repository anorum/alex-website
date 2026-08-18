/** True while the FF7 nav menu overlays the screen. It owns the keyboard
 *  whenever it is open, so game and window key handlers stand down. */
export function ff7MenuIsOpen(): boolean {
  const nav = document.getElementById('ff7-nav');
  return !!nav && !nav.classList.contains('hidden');
}
