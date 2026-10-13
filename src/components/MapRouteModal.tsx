import { useEffect, useRef } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { animate } from 'motion';
import { X } from 'lucide-react';
import MapRoutePanel from './MapRoutePanel';
import type { Coordinates, DrivingRoute, MapAddress } from './mapServices';
import './MapRouteModal.css';

type Props = { destination: Coordinates; externalUrl: string; onClose: () => void; returnFocusRef: RefObject<HTMLButtonElement | null>; onRouteChange?: (preview?: { route: DrivingRoute; origin: MapAddress }) => void };

export default function MapRouteModal({ destination, externalUrl, onClose, returnFocusRef, onRouteChange }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPointer = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const previousGutter = document.documentElement.style.scrollbarGutter;
    // Preserve an existing scrollbar gap without adding one for overlay scrollbars.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const entrance = preference.matches ? null : animate(dialog,
      { opacity: [0, 1], scale: [.985, 1] }, { duration: .35, ease: [.22, 1, .36, 1] });
    const stopMotion = () => {
      if (!preference.matches) return;
      entrance?.stop(); dialog.style.opacity = '1'; dialog.style.transform = 'none';
    };
    preference.addEventListener('change', stopMotion);
    const focus = window.requestAnimationFrame(() => dialog.querySelector<HTMLInputElement>('#garage-route-origin')?.focus({ preventScroll: true }));
    return () => {
      window.cancelAnimationFrame(focus);
      preference.removeEventListener('change', stopMotion);
      entrance?.stop();
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.scrollbarGutter = previousGutter;
      const target = previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : returnFocusRef.current;
      target?.focus({ preventScroll: true });
    };
  }, [returnFocusRef]);

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')]
      .filter(element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
    const first = focusable[0], last = focusable.at(-1);
    if (!first || !last) { event.preventDefault(); event.currentTarget.focus(); }
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function outside(event: PointerEvent<HTMLDialogElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
  }

  return createPortal(<dialog ref={dialogRef} className="route-dialog" aria-labelledby="garage-route-title" aria-describedby="garage-route-note" onKeyDown={trapFocus}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onPointerDown={event => { backdropPointer.current = outside(event); }}
    onPointerUp={event => { if (backdropPointer.current && outside(event)) onClose(); backdropPointer.current = false; }}>
    <div className="route-dialog-close-bar"><button className="fisheye-glass premium-map-panel-close route-dialog-close" type="button" onClick={onClose} aria-label="Fechar rota"><X size={20} aria-hidden="true" /></button></div>
    <header className="route-dialog-heading"><h2 id="garage-route-title">SEU CAMINHO ATÉ A GARAGE ONE</h2><p id="garage-route-note">Descubra a melhor rota para chegar até nós.</p></header>
    <MapRoutePanel destination={destination} externalUrl={externalUrl} onRouteChange={onRouteChange} />
  </dialog>, document.body);
}
