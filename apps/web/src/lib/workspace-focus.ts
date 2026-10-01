/** Keep selected details reachable when the workspace changes to a stacked layout. */
export function focusWorkspacePanel(id: string) {
  if (!window.matchMedia('(max-width: 1100px)').matches) return;
  window.requestAnimationFrame(() => {
    const panel = document.getElementById(id);
    if (!panel) return;
    panel.focus({ preventScroll: true });
    panel.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    });
  });
}
