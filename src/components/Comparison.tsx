import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { animate } from 'motion';
import { services } from '../data';
import './Comparison.css';

const comparisonOptions = [
  { ...services[0], id: 'polimento', before: '/images/comparacao-polimento-antes.webp', after: '/images/comparacao-polimento-depois.webp' },
  { ...services[1], id: 'estofados', before: '/images/comparacao-estofados-antes.webp', after: '/images/comparacao-estofados-depois.webp' },
  { ...services[2], id: 'vitrificacao', before: '/images/comparacao-vitrificacao-antes.webp', after: '/images/comparacao-vitrificacao-depois.webp' },
];

function ComparisonSlide({ option, selected, position, onPosition, onInteract, onGrab, onRelease, onFocus }: {
  option: typeof comparisonOptions[number];
  selected: boolean;
  position: number;
  onPosition: (position: number) => void;
  onInteract: () => void;
  onGrab: () => boolean;
  onRelease: () => void;
  onFocus: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const grabOffset = useRef(0);
  const interruptedMotion = useRef(false);

  function moveDivider(clientX: number) {
    const frame = frameRef.current;
    if (!frame) return;
    const bounds = frame.getBoundingClientRect();
    const next = (clientX - bounds.left - grabOffset.current) / bounds.width * 100;
    onPosition(Math.max(0, Math.min(100, next)));
  }

  function startDivider(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    onInteract();
    interruptedMotion.current = onGrab();
    activePointer.current = event.pointerId;
    event.currentTarget.focus({ preventScroll: true });
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) {
      activePointer.current = null;
      if (interruptedMotion.current) { interruptedMotion.current = false; onRelease(); }
      return;
    }
    grabOffset.current = event.clientX - bounds.left - position / 100 * bounds.width;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragDivider(event: PointerEvent<HTMLDivElement>) {
    if (activePointer.current !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    moveDivider(event.clientX);
  }

  function releaseDivider(event: PointerEvent<HTMLDivElement>) {
    if (activePointer.current !== event.pointerId) return;
    event.stopPropagation();
    activePointer.current = null;
    const resume = interruptedMotion.current;
    interruptedMotion.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (resume) onRelease();
  }

  function adjustDivider(event: KeyboardEvent<HTMLDivElement>) {
    let next = position;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= 1;
    else if (event.key === 'PageUp') next += 10;
    else if (event.key === 'PageDown') next -= 10;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 100;
    else return;
    event.preventDefault();
    event.stopPropagation();
    onInteract();
    onPosition(Math.max(0, Math.min(100, next)));
  }

  return <div ref={frameRef} className="comparison-frame">
    <img
      className="comparison-base"
      src={option.after}
      alt={`Ilustração gerada: depois de ${option.name.toLocaleLowerCase('pt-BR')}`}
      loading="lazy"
      decoding="async"
      draggable="false"
    />
    <div className="comparison-before" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }} aria-hidden="true">
      <img src={option.before} alt="" loading="lazy" decoding="async" draggable="false" />
    </div>
    <span className="comparison-label is-before" aria-hidden="true">Antes</span>
    <span className="comparison-label is-after" aria-hidden="true">Depois</span>
    <div className="comparison-divider" style={{ left: `${position}%` }} aria-hidden="true">
      <span className="comparison-handle"><span /></span>
    </div>
    <div
      className="comparison-control"
      data-comparison-control
      role="slider"
      tabIndex={selected ? 0 : -1}
      aria-label={`Comparar ${option.name}`}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      aria-valuetext={`${Math.round(position)}% antes e ${100 - Math.round(position)}% depois`}
      style={{ left: `${position}%` }}
      onPointerDown={startDivider}
      onPointerMove={dragDivider}
      onPointerUp={releaseDivider}
      onPointerCancel={releaseDivider}
      onLostPointerCapture={() => {
        activePointer.current = null;
        if (interruptedMotion.current) { interruptedMotion.current = false; onRelease(); }
      }}
      onFocus={() => { if (!selected && activePointer.current === null) onFocus(); }}
      onKeyDown={adjustDivider}
    />
  </div>;
}

export default function Comparison() {
  const [selected, setSelected] = useState(0);
  const [positions, setPositions] = useState(() => comparisonOptions.map(() => 50));
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const galleryRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef(reducedMotion);
  const demonstratedRef = useRef(false);
  const demoAnimation = useRef<ReturnType<typeof animate> | null>(null);
  const demoObserver = useRef<IntersectionObserver | null>(null);
  const captionId = useId();

  const carouselOptions = useMemo(() => ({
    align: 'center' as const,
    loop: true,
    dragFree: false,
    skipSnaps: false,
    watchFocus: false,
    duration: reducedMotion ? 0 : 32,
    watchDrag: (_api: unknown, event: MouseEvent | TouchEvent) =>
      !(event.target instanceof Element && event.target.closest('[data-comparison-control]')),
  }), [reducedMotion]);
  const [viewportRef, carousel] = useEmblaCarousel(carouselOptions);

  const stopDemonstration = useCallback(() => {
    demonstratedRef.current = true;
    demoAnimation.current?.stop();
    demoAnimation.current = null;
    demoObserver.current?.disconnect();
  }, []);

  const setPosition = useCallback((index: number, position: number) => {
    setPositions(current => current.map((value, serviceIndex) => serviceIndex === index ? position : value));
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotionRef.current = preference.matches;
      setReducedMotion(preference.matches);
      if (preference.matches && carousel) carousel.scrollTo(carousel.selectedScrollSnap(), true);
      if (preference.matches && demoAnimation.current) {
        stopDemonstration();
        setPosition(0, 50);
      }
    };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, [carousel, setPosition, stopDemonstration]);

  useEffect(() => {
    if (!carousel) return;
    const updateSelection = () => setSelected(carousel.selectedScrollSnap());
    const settleReducedMotion = () => {
      if (reducedMotionRef.current) carousel.scrollTo(carousel.selectedScrollSnap(), true);
    };
    updateSelection();
    carousel.on('select', updateSelection);
    carousel.on('reInit', updateSelection);
    carousel.on('pointerDown', stopDemonstration);
    carousel.on('pointerUp', settleReducedMotion);
    return () => {
      carousel.off('select', updateSelection);
      carousel.off('reInit', updateSelection);
      carousel.off('pointerDown', stopDemonstration);
      carousel.off('pointerUp', settleReducedMotion);
    };
  }, [carousel, stopDemonstration]);

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery || reducedMotion || demonstratedRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting) || demonstratedRef.current) return;
      demonstratedRef.current = true;
      observer.disconnect();
      demoAnimation.current = animate(50, [50, 52, 48, 50], {
        duration: 2.6,
        ease: 'easeInOut',
        onUpdate: value => setPosition(0, value),
        onComplete: () => { demoAnimation.current = null; },
      });
    }, { threshold: 0.35 });
    demoObserver.current = observer;
    observer.observe(gallery);
    return () => {
      observer.disconnect();
      demoAnimation.current?.stop();
      demoAnimation.current = null;
    };
  }, [reducedMotion, setPosition]);

  function navigateCarousel(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !carousel) return;
    if (event.key === 'ArrowRight') carousel.scrollNext(reducedMotion);
    else if (event.key === 'ArrowLeft') carousel.scrollPrev(reducedMotion);
    else if (event.key === 'Home') carousel.scrollTo(0, reducedMotion);
    else if (event.key === 'End') carousel.scrollTo(comparisonOptions.length - 1, reducedMotion);
    else return;
    event.preventDefault();
    stopDemonstration();
  }

  function freezeCarouselForDivider() {
    if (!carousel) return false;
    const engine = carousel.internalEngine();
    const visualOffset = engine.offsetLocation.get();
    const moving = Math.abs(engine.target.get() - visualOffset) > 0.01 || Math.abs(engine.scrollBody.velocity()) > 0.01;
    if (!moving) return false;
    // Embla 8.6: preserve the rendered offset while stopping pending carousel momentum.
    engine.animation.stop();
    engine.location.set(visualOffset);
    engine.previousLocation.set(visualOffset);
    engine.target.set(visualOffset);
    engine.offsetLocation.set(visualOffset);
    engine.scrollBody.useDuration(0).seek();
    engine.translate.to(visualOffset);
    return true;
  }

  const current = comparisonOptions[selected];
  return <div
    ref={galleryRef}
    className="comparison-gallery"
    role="region"
    aria-roledescription="carrossel"
    aria-label="Antes e depois dos serviços"
  >
    <div
      ref={viewportRef}
      className="comparison-carousel-viewport"
      tabIndex={0}
      aria-label="Serviços antes e depois"
      aria-describedby={captionId}
      onKeyDown={navigateCarousel}
    >
      <div className="comparison-carousel-track">
        {comparisonOptions.map((option, index) => <div
          key={option.id}
          className={`comparison-carousel-slide${selected === index ? ' is-selected' : ''}`}
          data-service={option.id}
          data-selected={selected === index}
          role="group"
          aria-roledescription="slide"
          aria-label={`${option.name}, ${index + 1} de ${comparisonOptions.length}`}
        >
          <ComparisonSlide
            option={option}
            selected={selected === index}
            position={positions[index]}
            onPosition={position => setPosition(index, position)}
            onInteract={stopDemonstration}
            onGrab={freezeCarouselForDivider}
            onRelease={() => carousel?.scrollTo(index, reducedMotionRef.current)}
            onFocus={() => carousel?.scrollTo(index, reducedMotion)}
          />
        </div>)}
      </div>
    </div>
    <div id={captionId} className="comparison-editorial-caption container" aria-live="polite" aria-atomic="true">
      <div className="comparison-service-copy"><h3>{current.name}</h3><p>{current.description}</p></div>
    </div>
  </div>;
}
