import { useEffect, useRef } from 'react';
import './GarageAnimatedBackground.css';

type StudioNavigator = Navigator & {
  deviceMemory?: number;
  connection?: EventTarget & { saveData?: boolean };
};

/** One decorative studio environment; never an overlay on the site's content. */
export default function GarageAnimatedBackground() {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const background = backgroundRef.current;
    if (!background) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const device = navigator as StudioNavigator;
    let frame = 0;
    let listening = false;

    function resetParallax() {
      background!.style.setProperty('--studio-scroll-near', '0px');
      background!.style.setProperty('--studio-scroll-far', '0px');
      background!.style.setProperty('--studio-scroll-light', '0px');
    }
    function updateParallax() {
      const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / maximum));
      const strength = window.innerWidth <= 767 ? .6 : 1;
      background!.style.setProperty('--studio-scroll-near', `${(progress * 8 * strength).toFixed(2)}px`);
      background!.style.setProperty('--studio-scroll-far', `${(-progress * 4 * strength).toFixed(2)}px`);
      background!.style.setProperty('--studio-scroll-light', `${(progress * 3 * strength).toFixed(2)}px`);
    }
    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => { frame = 0; updateParallax(); });
    }
    function stopScroll() {
      window.cancelAnimationFrame(frame); frame = 0;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      listening = false;
    }
    function syncPolicy() {
      const limited = (typeof device.deviceMemory === 'number' && device.deviceMemory <= 4)
        || (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4)
        || device.connection?.saveData === true;
      const reduced = preference.matches;
      const visible = document.visibilityState === 'visible';
      background!.dataset.quality = limited ? 'light' : 'full';
      background!.dataset.motion = reduced ? 'reduced' : visible ? 'running' : 'paused';
      if (!reduced && !limited && visible) {
        if (!listening) {
          window.addEventListener('scroll', onScroll, { passive: true });
          window.addEventListener('resize', onScroll, { passive: true });
          listening = true;
        }
        updateParallax();
      } else {
        stopScroll();
        if (reduced || limited) resetParallax();
      }
    }

    syncPolicy();
    preference.addEventListener('change', syncPolicy);
    document.addEventListener('visibilitychange', syncPolicy);
    device.connection?.addEventListener('change', syncPolicy);
    return () => {
      stopScroll();
      preference.removeEventListener('change', syncPolicy);
      document.removeEventListener('visibilitychange', syncPolicy);
      device.connection?.removeEventListener('change', syncPolicy);
    };
  }, []);

  return <div ref={backgroundRef} className="garage-animated-background" aria-hidden="true" inert data-quality="full" data-motion="paused">
    <div className="garage-studio-depth garage-studio-depth--near"><div className="garage-studio-layer garage-studio-atmosphere--near" /></div>
    <div className="garage-studio-depth garage-studio-depth--far"><div className="garage-studio-layer garage-studio-atmosphere--far" /></div>
    <div className="garage-studio-reflections">
      <div className="garage-studio-layer garage-studio-red--primary" />
      <div className="garage-studio-layer garage-studio-red--secondary" />
      <div className="garage-studio-layer garage-studio-metal--primary" />
      <div className="garage-studio-layer garage-studio-metal--secondary" />
    </div>
  </div>;
}
