import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { informationLink, navigation } from '../data';
import WhatsAppIcon from './WhatsAppIcon';

export default function Header({ count = 0, onQuote }: { count?: number; onQuote: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 12);
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
    return () => window.removeEventListener('scroll', updateScrolled);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const onOutsidePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || headerRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onOutsidePointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onOutsidePointerDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return <header ref={headerRef} className={`site-header${scrolled ? ' is-scrolled' : ''}${menuOpen ? ' menu-is-open' : ''}`}>
    <div className="header-inner">
      <a href="/#inicio" className="brand header-brand" aria-label="Garage One — início" onClick={closeMenu}>
        <img src="/images/logo-garage-one.png" width={2086} height={754} alt="Garage One — Estética Automotiva" />
      </a>
      <div className="header-controls"><a className="header-cart fisheye-glass fisheye-glass--icon" href="/orcamento/" aria-label={`Revisar orçamento, ${count} itens`}><ShoppingBag size={20} aria-hidden="true" /><span className="cart-count">{count}</span></a><button ref={menuButtonRef} className={`menu-toggle fisheye-glass fisheye-glass--icon${menuOpen ? ' is-open' : ''}`} type="button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(open => !open)}>
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true" focusable="false">
          <path className="menu-stroke menu-stroke-1" d="M3 6 C12 5.6 24 6.4 33 6" vectorEffect="non-scaling-stroke" />
          <path className="menu-stroke menu-stroke-2" d="M9 14 C17 13.7 25 14.3 33 14" vectorEffect="non-scaling-stroke" />
          <path className="menu-stroke menu-stroke-3" d="M15 22 C21 21.8 27 22.2 33 22" vectorEffect="non-scaling-stroke" />
        </svg>
      </button></div>
    </div>
    <nav id="mobile-navigation" className={`mobile-nav${menuOpen ? ' is-open' : ''}`} aria-label="Navegação principal" aria-hidden={!menuOpen} inert={!menuOpen}>
      <div>
        <img className="menu-brand-logo" src="/images/logo-garage-one.png" width={2086} height={754} alt="Garage One — Estética Automotiva" />
        {navigation.map((item, index) => <a href={item.href} key={item.href} onClick={closeMenu}>
          <span aria-hidden="true">0{index + 1}</span>{item.label}<ArrowRight size={17} aria-hidden="true" />
        </a>)}
        <button type="button" className="btn fisheye-glass menu-quote" onClick={() => { closeMenu(); menuButtonRef.current?.focus(); onQuote(); }}>Solicitar orçamento<ArrowRight size={17} /></button>
        <a className="mobile-contact btn fisheye-glass" href={informationLink} target="_blank" rel="noopener noreferrer" onClick={closeMenu}>
          <WhatsAppIcon /> Falar pelo WhatsApp
        </a>
      </div>
    </nav>
  </header>;
}
