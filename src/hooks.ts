import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { animate } from 'motion';

export function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    moved: false,
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    startScroll: 0,
    lastScroll: 0,
    lastAt: 0,
    velocity: 0,
  });
  const motion = useRef({ frame: 0, clickTimer: 0, suppressClick: false, reduced: false });

  const clearClickSuppression = () => {
    window.clearTimeout(motion.current.clickTimer);
    motion.current.clickTimer = 0;
    motion.current.suppressClick = false;
  };
  const stopMotion = () => {
    cancelAnimationFrame(motion.current.frame);
    motion.current.frame = 0;
    ref.current?.classList.remove('is-coasting');
  };
  const releaseCapture = (element = ref.current) => {
    const pointerId = drag.current.pointerId;
    if (element && pointerId !== null && element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
    drag.current.pointerId = null;
  };
  const cancelDrag = () => {
    drag.current.active = false;
    drag.current.moved = false;
    releaseCapture();
    ref.current?.classList.remove('is-dragging');
  };
  const nearestSnap = (element: HTMLDivElement) => {
    const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
    const bounds = element.getBoundingClientRect();
    const padding = Number.parseFloat(getComputedStyle(element).scrollPaddingLeft) || 0;
    const positions = [0, maximum];
    Array.from(element.children).forEach(child => {
      if (!(child instanceof HTMLElement)) return;
      const alignment = getComputedStyle(child).scrollSnapAlign;
      if (!alignment || alignment === 'none') return;
      const position = child.getBoundingClientRect().left - bounds.left - element.clientLeft + element.scrollLeft - padding;
      positions.push(Math.min(maximum, Math.max(0, position)));
    });
    return positions.reduce((nearest, position) =>
      Math.abs(position - element.scrollLeft) < Math.abs(nearest - element.scrollLeft) ? position : nearest,
    );
  };
  const settle = (element: HTMLDivElement, initialVelocity: number) => {
    // Keep native snap disabled until both the coast and the precise final snap finish.
    element.classList.add('is-coasting');
    element.classList.remove('is-dragging');
    const finish = () => {
      motion.current.frame = 0;
      element.classList.remove('is-coasting');
    };
    const snap = () => {
      const from = element.scrollLeft;
      const target = nearestSnap(element);
      if (motion.current.reduced || Math.abs(target - from) < 1) {
        element.scrollLeft = target;
        finish();
        return;
      }
      const started = performance.now();
      const duration = Math.min(240, Math.max(170, Math.abs(target - from) * 0.65));
      const step = (now: number) => {
        if (!element.isConnected) { finish(); return; }
        const progress = Math.min(1, (now - started) / duration);
        element.scrollLeft = from + (target - from) * (1 - (1 - progress) ** 3);
        if (progress < 1) motion.current.frame = requestAnimationFrame(step);
        else { element.scrollLeft = target; finish(); }
      };
      motion.current.frame = requestAnimationFrame(step);
    };
    if (motion.current.reduced || Math.abs(initialVelocity) < 0.04) {
      snap();
      return;
    }
    let velocity = Math.min(2.1, Math.max(-2.1, initialVelocity));
    let position = element.scrollLeft;
    let previous = performance.now();
    const started = previous;
    const coast = (now: number) => {
      if (!element.isConnected) { finish(); return; }
      const elapsed = Math.min(32, Math.max(0, now - previous));
      previous = now;
      const decay = Math.exp(-elapsed / 110);
      const next = position + velocity * 110 * (1 - decay);
      const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
      position = Math.min(maximum, Math.max(0, next));
      element.scrollLeft = position;
      velocity *= decay;
      if (position !== next || Math.abs(velocity) < 0.04 || now - started > 425) snap();
      else motion.current.frame = requestAnimationFrame(coast);
    };
    motion.current.frame = requestAnimationFrame(coast);
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    motion.current.reduced = preference.matches;
    const interrupt = () => { stopMotion(); cancelDrag(); clearClickSuppression(); };
    const onFocus = () => { stopMotion(); clearClickSuppression(); };
    const onPreference = () => {
      motion.current.reduced = preference.matches;
      if (!preference.matches) return;
      const wasMoving = drag.current.moved || motion.current.frame !== 0;
      interrupt();
      if (wasMoving) element.scrollLeft = nearestSnap(element);
    };
    const onNativeDrag = (event: DragEvent) => event.preventDefault();
    const onLostCapture = (event: PointerEvent) => {
      if (drag.current.active && drag.current.pointerId === event.pointerId) { stopMotion(); cancelDrag(); }
    };
    element.addEventListener('wheel', interrupt, { passive: true });
    element.addEventListener('keydown', interrupt);
    element.addEventListener('focusin', onFocus);
    element.addEventListener('dragstart', onNativeDrag);
    element.addEventListener('lostpointercapture', onLostCapture);
    preference.addEventListener('change', onPreference);
    return () => {
      element.removeEventListener('wheel', interrupt);
      element.removeEventListener('keydown', interrupt);
      element.removeEventListener('focusin', onFocus);
      element.removeEventListener('dragstart', onNativeDrag);
      element.removeEventListener('lostpointercapture', onLostCapture);
      preference.removeEventListener('change', onPreference);
      // React may already have cleared the ref during unmount.
      releaseCapture(element);
      interrupt();
      element.classList.remove('is-dragging', 'is-coasting');
    };
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    stopMotion();
    cancelDrag();
    clearClickSuppression();
    // Touch and pen keep the browser's native scrolling and momentum.
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const element = ref.current;
    if (!element || element.scrollWidth - element.clientWidth < 1) return;
    drag.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScroll: element.scrollLeft,
      lastScroll: element.scrollLeft,
      lastAt: performance.now(),
      velocity: 0,
    };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    const state = drag.current;
    if (!element || !state.active || state.pointerId !== event.pointerId) return;
    const delta = event.clientX - state.startX;
    if (!state.moved) {
      if (Math.abs(delta) <= 6 || Math.abs(delta) <= Math.abs(event.clientY - state.startY)) return;
      state.moved = true;
      element.classList.add('is-dragging');
      element.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    const now = performance.now();
    element.scrollLeft = Math.min(Math.max(0, element.scrollWidth - element.clientWidth), Math.max(0, state.startScroll - delta));
    const elapsed = now - state.lastAt;
    const velocity = (element.scrollLeft - state.lastScroll) / Math.max(8, elapsed);
    state.velocity = elapsed > 80 || velocity * state.velocity < 0 ? velocity : state.velocity * 0.3 + velocity * 0.7;
    state.lastScroll = element.scrollLeft;
    state.lastAt = now;
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    const state = drag.current;
    if (!element || !state.active || state.pointerId !== event.pointerId) return;
    const moved = state.moved;
    const velocity = performance.now() - state.lastAt > 80 ? 0 : state.velocity;
    state.active = false;
    state.moved = false;
    releaseCapture();
    if (!moved) { element.classList.remove('is-dragging'); return; }
    // Browser click follows pointerup in the same task. Never suppress a later click.
    motion.current.suppressClick = true;
    motion.current.clickTimer = window.setTimeout(clearClickSuppression, 0);
    settle(element, velocity);
  };
  const onPointerCancel = () => { stopMotion(); cancelDrag(); clearClickSuppression(); };
  const onPointerLeave = () => {
    // Captured drags continue beyond the carousel and finish at the actual release.
    if (drag.current.active && !drag.current.moved) cancelDrag();
  };
  return { ref, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerLeave,
    onClickCapture: (event: React.MouseEvent<HTMLDivElement>) => {
      if (motion.current.suppressClick && event.detail > 0) {
        event.preventDefault();
        event.stopPropagation();
      }
      clearClickSuppression();
    },
  };
}

export function useReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const originals = new Map(elements.map(element => [element, {
      opacity: element.style.opacity,
      transform: element.style.transform,
      willChange: element.style.willChange,
    }]));
    const animations = new Map<HTMLElement, { stop: () => void }>();
    let disposed = false;
    let observer: IntersectionObserver | undefined;

    const restore = (element: HTMLElement) => {
      const original = originals.get(element);
      if (!original) return;
      element.style.opacity = original.opacity;
      element.style.transform = original.transform;
      element.style.willChange = original.willChange;
    };
    const showElement = (element: HTMLElement) => {
      observer?.unobserve(element);
      const animation = animations.get(element);
      animations.delete(element);
      animation?.stop();
      restore(element);
      element.classList.add('is-visible');
    };
    const showImmediately = () => {
      observer?.disconnect();
      elements.forEach(showElement);
    };

    if (motionPreference.matches || !('IntersectionObserver' in window)) {
      showImmediately();
    } else {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || disposed) return;
          const element = entry.target as HTMLElement;
          observer?.unobserve(element);
          // A queued observer entry must not animate content already revealed by focus.
          if (element.classList.contains('is-visible')) return;
          const requestedDelay = Number(element.dataset.revealDelay ?? 0);
          const delay = Number.isFinite(requestedDelay) ? Math.max(0, Math.min(requestedDelay, 1)) : 0;
          element.style.willChange = 'opacity, transform';
          const animation = animate(element, { opacity: [0, 1], y: [12, 0] }, {
            duration: 0.6,
            delay,
            ease: [0.22, 1, 0.36, 1],
          });
          animations.set(element, animation);
          void animation.then(() => {
            if (disposed || animations.get(element) !== animation) return;
            animations.delete(element);
            restore(element);
            element.classList.add('is-visible');
          });
        });
      }, { threshold: 0.08 });
      elements.forEach(element => {
        // Never hide an element that has already completed its entrance.
        if (element.classList.contains('is-visible')) return;
        element.style.opacity = '0';
        element.style.transform = 'translateY(12px)';
        observer?.observe(element);
      });
    }

    const onPreferenceChange = () => {
      // A preference change takes effect immediately; revealed content stays visible.
      if (motionPreference.matches) showImmediately();
    };
    const revealFocusedAncestors = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return;
      let ancestor = target.closest<HTMLElement>('[data-reveal]');
      while (ancestor) {
        if (originals.has(ancestor) && !ancestor.classList.contains('is-visible')) showElement(ancestor);
        ancestor = ancestor.parentElement?.closest<HTMLElement>('[data-reveal]') ?? null;
      }
    };
    const onFocusIn = (event: FocusEvent) => revealFocusedAncestors(event.target);
    motionPreference.addEventListener('change', onPreferenceChange);
    document.addEventListener('focusin', onFocusIn);
    revealFocusedAncestors(document.activeElement);
    return () => {
      disposed = true;
      observer?.disconnect();
      motionPreference.removeEventListener('change', onPreferenceChange);
      document.removeEventListener('focusin', onFocusIn);
      animations.forEach(animation => animation.stop());
      animations.clear();
      // Restore all temporary styles for StrictMode remounts and route changes.
      elements.forEach(restore);
    };
  }, []);
}
