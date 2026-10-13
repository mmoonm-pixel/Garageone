import { useEffect, useRef, useState } from 'react';
import './HeroCinematic.css';

/** The original artwork stays in one plane; light accents only touch photographic areas. */
export default function HeroCinematic() {
  const areaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreferenceChange = () => setReducedMotion(preference.matches);
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    onPreferenceChange();
    onVisibilityChange();
    preference.addEventListener('change', onPreferenceChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) setLoaded(true);

    const area = areaRef.current;
    const observer = area && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      setVisible(entries.some(entry => entry.isIntersecting));
    }, { threshold: 0 }) : undefined;
    if (area) observer?.observe(area);
    return () => {
      preference.removeEventListener('change', onPreferenceChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer?.disconnect();
    };
  }, []);

  const running = loaded && visible && pageVisible && !reducedMotion;
  return <div ref={areaRef} className={`hero-image-area hero-cinematic${loaded ? ' is-loaded' : ''}`} data-hero-motion={reducedMotion ? 'reduced' : running ? 'running' : 'paused'}>
    <div className="hero-camera-frame">
      <picture>
        <source media="(max-width: 767px)" srcSet="/images/garage-hero-mobile.png" width="941" height="1672" />
        <img ref={imageRef} src="/images/garage-hero-desktop.png" width="1672" height="941" alt="Garage One. Cuidados de estética automotiva e polimento para o seu veículo." fetchPriority="high" loading="eager" decoding="async" onLoad={() => setLoaded(true)} onError={event => { event.currentTarget.style.visibility = 'hidden'; setLoaded(true); }} />
      </picture>
      <div className="hero-body-light-mask" aria-hidden="true"><span className="hero-body-reflection" /><span className="hero-body-depth" /></div>
      <span className="hero-studio-light" aria-hidden="true" />
    </div>
  </div>;
}
