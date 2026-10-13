import { useEffect, useRef } from 'react';
import { animate } from 'motion/mini';

const information = ['LAVAGEM DETALHADA', 'POLIMENTO TÉCNICO', 'VITRIFICAÇÃO 7H E 9H', 'HIGIENIZAÇÃO INTERNA', 'PELÍCULAS AUTOMOTIVAS', 'CUIDADOS PARA MOTOS', 'PRODUTOS AUTOMOTIVOS', 'CAMPINA GRANDE–PB'];

export default function InfoMarquee() {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = viewport.current;
    const element = track.current;
    if (!container || !element) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation: ReturnType<typeof animate> | undefined;
    let visible = false;
    let disposed = false;
    let fontsReady = document.fonts.status === 'loaded';
    let loopDistance = 0;
    let initialDistance = 0;
    let hoverFactor = container.matches(':hover') ? 0.35 : 1;
    let targetFactor = hoverFactor;
    let rampFrame: number | undefined;
    const previousTransform = element.style.transform;
    const previousWillChange = element.style.willChange;

    const canPlay = () => visible && document.visibilityState === 'visible'
      && !preference.matches;

    const stopRamp = () => {
      if (rampFrame !== undefined) window.cancelAnimationFrame(rampFrame);
      rampFrame = undefined;
    };

    const applySpeed = () => {
      if (animation && loopDistance > 0) {
        // Resizing changes the distance, not the animation or its current time.
        animation.speed = initialDistance / loopDistance * hoverFactor;
      }
    };

    const rampSpeed = (target: number) => {
      if (targetFactor === target && rampFrame !== undefined) return;
      stopRamp();
      targetFactor = target;
      if (!animation || !canPlay() || Math.abs(hoverFactor - target) < 0.001) return;

      const from = hoverFactor;
      const startedAt = performance.now();
      const tick = (time: number) => {
        const progress = Math.min(1, (time - startedAt) / 600);
        // Ease the playback rate itself while retaining the same WAAPI timeline.
        const eased = progress * progress * (3 - 2 * progress);
        hoverFactor = from + (target - from) * eased;
        applySpeed();
        rampFrame = progress < 1 ? window.requestAnimationFrame(tick) : undefined;
      };
      rampFrame = window.requestAnimationFrame(tick);
    };

    const updatePlayback = () => {
      if (preference.matches) {
        stopRamp();
        animation?.cancel();
        animation = undefined;
        element.style.transform = 'none';
        element.style.willChange = previousWillChange;
        hoverFactor = targetFactor;
        return;
      }
      if (!fontsReady || loopDistance <= 0) return;
      if (!animation) {
        // Matching groups meet exactly at -50%, including after font/layout changes.
        initialDistance = loopDistance;
        element.style.willChange = 'transform';
        animation = animate(element, {
          transform: ['translate3d(0, 0, 0)', 'translate3d(-50%, 0, 0)'],
        }, {
          duration: initialDistance / 32, ease: 'linear', repeat: Infinity, autoplay: false,
        });
        applySpeed();
      }
      if (canPlay()) {
        if (animation.state !== 'running') animation.play();
        rampSpeed(targetFactor);
      } else {
        stopRamp();
        animation.pause();
      }
    };

    const measure = () => {
      if (disposed) return;
      loopDistance = element.getBoundingClientRect().width / 2;
      applySpeed();
      updatePlayback();
    };
    const enter = () => rampSpeed(0.35);
    const leave = () => rampSpeed(1);
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      updatePlayback();
    });
    const resizeObserver = new ResizeObserver(measure);
    observer.observe(container);
    resizeObserver.observe(element);
    container.addEventListener('mouseenter', enter);
    container.addEventListener('mouseleave', leave);
    preference.addEventListener('change', measure);
    document.addEventListener('visibilitychange', updatePlayback);
    document.fonts.addEventListener('loadingdone', measure);
    void document.fonts.ready.then(() => {
      if (disposed) return;
      fontsReady = true;
      measure();
    });
    measure();

    return () => {
      disposed = true;
      stopRamp();
      observer.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('mouseenter', enter);
      container.removeEventListener('mouseleave', leave);
      preference.removeEventListener('change', measure);
      document.removeEventListener('visibilitychange', updatePlayback);
      document.fonts.removeEventListener('loadingdone', measure);
      animation?.cancel();
      element.style.transform = previousTransform;
      element.style.willChange = previousWillChange;
    };
  }, []);

  return <div className="info-marquee-wrapper"><div className="info-marquee" ref={viewport} aria-label="Garage One, serviços e localização">
    <div className="info-marquee-track" ref={track}>
      {[0, 1].map(copy => <ul className="info-marquee-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
        {information.map(item => <li className="info-marquee-item" key={item}>{item}<span className="info-marquee-divider" aria-hidden="true">|</span></li>)}
      </ul>)}
    </div>
  </div></div>;
}
