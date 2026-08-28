const PROGRESS_SELECTOR = '.next-step, .proof-complete, .check-result, .error';

const seenStages = new WeakMap<HTMLElement, string>();
let pendingTarget: HTMLElement | null = null;
let pendingFrame = 0;

function isMobileProgressMode(): boolean {
  return (
    window.matchMedia('(max-width: 700px)').matches &&
    window.matchMedia('(pointer: coarse)').matches
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function stageSignature(target: HTMLElement): string {
  const heading = target.querySelector('strong, h3')?.textContent?.trim();
  const fallback = target.textContent?.trim().slice(0, 120) ?? '';
  return `${target.className}|${heading || fallback}`;
}

function isMeaningfullyVisible(target: HTMLElement): boolean {
  const rect = target.getBoundingClientRect();
  const topInset = 12;
  const bottomInset = 20;
  return rect.top >= topInset && rect.bottom <= window.innerHeight - bottomInset;
}

function queueProgress(target: HTMLElement): void {
  if (!isMobileProgressMode()) return;

  const signature = stageSignature(target);
  if (seenStages.get(target) === signature) return;
  seenStages.set(target, signature);

  pendingTarget = target;
  if (pendingFrame) return;

  pendingFrame = window.requestAnimationFrame(() => {
    pendingFrame = 0;

    const current = pendingTarget;
    pendingTarget = null;
    if (!current?.isConnected) return;

    // Programmatic focus lets screen-reader users hear the new stage while
    // keeping it out of the normal Tab order.
    current.tabIndex = -1;
    current.focus({ preventScroll: true });

    if (!isMeaningfullyVisible(current)) {
      current.scrollIntoView({
        block: 'nearest',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }
  });
}

function collectProgressTargets(node: Node, targets: Set<HTMLElement>): void {
  const element =
    node instanceof HTMLElement
      ? node
      : node.parentElement instanceof HTMLElement
        ? node.parentElement
        : null;

  if (!element) return;

  if (element.matches(PROGRESS_SELECTOR)) {
    targets.add(element);
  }

  const closest = element.closest<HTMLElement>(PROGRESS_SELECTOR);
  if (closest) {
    targets.add(closest);
  }

  element.querySelectorAll<HTMLElement>(PROGRESS_SELECTOR).forEach((target) => {
    targets.add(target);
  });
}

const observer = new MutationObserver((mutations) => {
  if (!isMobileProgressMode()) return;

  const targets = new Set<HTMLElement>();

  for (const mutation of mutations) {
    collectProgressTargets(mutation.target, targets);
    mutation.addedNodes.forEach((node) => collectProgressTargets(node, targets));
  }

  // The last changed progress target is usually the next actionable or result
  // block. queueProgress coalesces same-frame mutations into a single move.
  targets.forEach(queueProgress);
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
});
