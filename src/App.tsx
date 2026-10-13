import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUp, ExternalLink, Instagram, MapPin, Phone } from 'lucide-react';
import BookingVideo from './components/BookingVideo';
import HeroCinematic from './components/HeroCinematic';
import GarageAnimatedBackground from './components/GarageAnimatedBackground';
import TestimonialsCarousel from './components/Testimonials';
import PremiumMap from './components/PremiumMap';
import Header from './components/Header';
import InfoMarquee from './components/InfoMarquee';
import QuoteModal from './components/QuoteModal';
import AccentPeriod from './components/AccentPeriod';
import { serviceHighlights } from './components/serviceHighlights';
import WhatsAppIcon from './components/WhatsAppIcon';
import { BudgetCartProvider, useBudgetCart } from './components/BudgetCart';
import { BudgetReview, ProductCatalog, ProductsPreview } from './components/ProductCatalog';
import { appointmentLink, informationLink, officialWhatsApp, instagram, tiktok, businessHours, locationPhoto, navigation, services, motorcycleServices, testimonials } from './data';
import { useDragScroll, useReveal } from './hooks';
import './components/Garage.css';
import './components/GarageAdjustments.css';
function Brand({ footer = false }: { footer?: boolean }) {
  return <a href="/#inicio" className={`brand ${footer ? 'brand-footer' : ''}`} aria-label="Garage One — início"><img src="/images/logo-garage-one.png" alt="Garage One — Estética Automotiva" width={2086} height={754} /></a>;
}
function SectionHeading({ number, label, title, subtitle }: { number: string; label: string; title: string; subtitle?: string }) {
  return <div className="section-heading" data-reveal><div className="eyebrow">{label}<span className="section-number">{number}</span></div><div className="section-heading-row"><h2><AccentPeriod text={title} /></h2>{subtitle && <p><AccentPeriod text={subtitle} /></p>}</div></div>;
}
function Hero({ onQuote }: { onQuote: () => void }) {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => { const media = window.matchMedia('(max-width: 767px)'); const update = () => setMobile(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  const buttons = <><a href={appointmentLink} className="btn btn-hero-glass fisheye-glass" target="_blank" rel="noopener noreferrer"><WhatsAppIcon />Agendar pelo WhatsApp<ArrowRight size={17} /></a><button className="btn btn-hero-glass fisheye-glass" onClick={onQuote}>Solicitar orçamento<ArrowRight size={17} /></button></>;
  return <section id="inicio" className={`hero${mobile ? ' mobile-video-hero' : ''}`} aria-labelledby="hero-title"><h1 id="hero-title" className="sr-only">Garage One — Estética Automotiva para carros e motos em Campina Grande, Paraíba</h1>{mobile ? <><BookingVideo /><div className="mobile-hero-content"><h2><AccentPeriod text="Seu veículo merece um cuidado especial." /></h2><div className="mobile-hero-actions">{buttons}</div></div></> : <><HeroCinematic /><div className="hero-actions" data-reveal data-reveal-delay="0.12">{buttons}</div></>}</section>;
}
function Services({ moto = false, onQuote }: { moto?: boolean; onQuote: (service: string) => void }) {
  const drag = useDragScroll();
  const [progress, setProgress] = useState(0);
  const list = moto ? motorcycleServices : services;
  return <section id={moto ? 'motos' : 'servicos'} className="section services-section garage-services"><div className="container"><SectionHeading number={moto ? '02' : '01'} label={moto ? 'Duas rodas, o mesmo cuidado' : 'Cuidado em cada detalhe'} title={moto ? 'Cuidado também para sua moto' : 'Nossos serviços'} subtitle={moto ? 'Limpeza, acabamento e proteção para os detalhes da sua moto.' : 'Da lavagem à proteção da pintura, encontre o cuidado para cada detalhe do seu veículo.'} /></div><div className="carousel-shell"><div {...drag} className="service-carousel draggable" role="region" aria-label={moto ? 'Serviços para motos' : 'Serviços para carros'} tabIndex={0} onScroll={event => { const e = event.currentTarget; setProgress(e.scrollLeft / Math.max(1, e.scrollWidth - e.clientWidth)); }}>{list.map((service, index) => <article className="service-card" key={service.id} data-reveal data-reveal-delay={Math.min(index, 2) * .07}><img src={service.image} alt={service.alt} width={800} height={1000} loading="lazy" decoding="async" draggable="false" /><div className="service-panel"><h3>{service.name}</h3><p>{service.description}</p><ul className="service-inclusions">{serviceHighlights[service.id].map(detail => <li key={detail}>{detail}</li>)}</ul><div className="service-card-actions"><button type="button" className="service-cta fisheye-glass" onClick={() => onQuote(moto ? `Moto — ${service.name}` : service.name)}><span>Orçamento</span><ArrowRight size={15} aria-hidden="true" /></button></div></div></article>)}</div></div><div className="container carousel-bottom"><div className="scroll-track" aria-hidden="true"><span style={{ transform: `translateX(${progress * 200}%)` }} /></div><p>Apresentação ilustrativa dos procedimentos.<span className="service-count">{list.length} serviços</span></p></div></section>;
}
function About() {
  return <section id="sobre" className="section about-section garage-about" aria-labelledby="about-intro-title"><BookingVideo /><div className="container about-editorial"><div className="about-introduction" data-reveal><h2 id="about-intro-title" className="about-intro-title"><AccentPeriod text="Conheça a Garage One." /></h2><span className="section-number">04</span></div><div className="about-text-grid"><h2 data-reveal>Cuidado em<br /><span><AccentPeriod text="cada detalhe." /></span></h2><div className="about-description"><p data-reveal data-reveal-delay="0.08">A Garage One reúne serviços de estética automotiva e produtos para quem valoriza o cuidado com o veículo. Localizada no bairro Liberdade, em Campina Grande, oferece lavagens, polimentos, vitrificação, tratamentos internos, películas e serviços para motos.</p><p data-reveal data-reveal-delay="0.16">Além dos serviços, conta com produtos e acessórios para limpeza, conservação e acabamento automotivo.</p><a href={informationLink} className="btn fisheye-glass" target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18} />Fale com nossa equipe</a></div></div><div className="about-highlights">{['Atenção aos detalhes', 'Proteção e conservação', 'Cuidado profissional'].map((text, index) => <div key={text} data-reveal data-reveal-delay={index * .07}><span className="highlight-number" aria-hidden="true">0{index + 1}</span><span>{text}</span></div>)}</div></div></section>;
}
function Testimonials() {
  if (!testimonials.length) return null;
  return <section id="depoimentos" className="section testimonials-section"><div className="container"><SectionHeading number="05" label="Experiências que importam" title="O que dizem nossos clientes" /><TestimonialsCarousel /></div></section>;
}
function Location() {
  return <section id="localizacao" className={`section location-section${locationPhoto ? ' has-location-photo' : ''}`} style={locationPhoto ? { backgroundImage: `url(${locationPhoto})` } : undefined}><div className="container"><SectionHeading number="06" label="Campina Grande · Paraíba" title="Encontre a Garage One" subtitle="Estamos no bairro Liberdade, em Campina Grande. Veja como chegar ou fale com nossa equipe." /><div className="location-grid"><PremiumMap /><div className="location-card" data-reveal><div className="location-card-top"><span className="location-dot" /><span>Esperamos por você</span></div><h3>Garage One</h3><p className="location-subtitle">Estética Automotiva</p><div className="contact-detail"><MapPin /><div><span>Endereço</span><p>Av. Amazonas, 26 — Liberdade<br />Campina Grande–PB<br />CEP 58414-280</p></div></div>{businessHours && <div className="contact-detail"><div><span>Horário</span><p>{businessHours}</p></div></div>}<div className="location-contact-links"><a href="tel:+5583994021492"><Phone size={17} />(83) 99402-1492</a><a href={instagram} target="_blank" rel="noopener noreferrer"><Instagram size={17} />@garageone._<ExternalLink size={13} /></a></div><div className="location-actions"><a href={informationLink} target="_blank" rel="noopener noreferrer" className="btn fisheye-glass"><WhatsAppIcon />Falar no WhatsApp</a><a href={instagram} target="_blank" rel="noopener noreferrer" className="btn fisheye-glass"><Instagram size={17} />Ver Instagram</a></div></div></div></div></section>;
}
function Footer() {
  return <footer className="site-footer compact-footer"><div className="container"><div className="footer-top compact-footer-grid"><div className="footer-identity" data-reveal><Brand footer /><p>Estética automotiva para carros e motos. Produtos e acessórios para cuidar de cada detalhe.</p></div><div className="compact-footer-details" data-reveal><address>Av. Amazonas, 26 — Liberdade<br />Campina Grande–PB — CEP 58414-280</address>{businessHours && <p>{businessHours}</p>}<div className="compact-footer-contact"><a href="tel:+5583994021492"><Phone size={15} />WhatsApp: (83) 99402-1492</a><a href={instagram} target="_blank" rel="noopener noreferrer"><Instagram size={15} />Instagram</a><a href={tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></div><div className="compact-footer-actions"><a href={officialWhatsApp} target="_blank" rel="noopener noreferrer" className="btn fisheye-glass"><WhatsAppIcon size={17} />WhatsApp</a><a href="/#localizacao" className="btn fisheye-glass"><MapPin size={16} />Localização</a></div><div className="footer-catalog-links"><a href="https://canva.link/gservicos" target="_blank" rel="noopener noreferrer">Catálogo de serviços<ExternalLink size={13} /></a><a href="https://canva.link/gprodutos" target="_blank" rel="noopener noreferrer">Catálogo de produtos<ExternalLink size={13} /></a></div></div></div><nav className="compact-footer-navigation" aria-label="Navegação do rodapé" data-reveal>{navigation.map(item => <a href={item.href} key={item.href}>{item.label}</a>)}</nav><div className="footer-bottom" data-reveal><p>© {new Date().getFullYear()} Garage One. Todos os direitos reservados.</p><a href="/#inicio" className="btn back-to-top fisheye-glass">Voltar ao topo<ArrowUp size={17} /></a></div></div></footer>;
}
function usePage() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const pop = () => setPath(location.pathname);
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !['/', '/produtos/', '/orcamento/'].includes(url.pathname)) return;
      if (url.pathname === location.pathname && url.hash) return;
      event.preventDefault(); history.pushState(null, '', url.pathname + url.hash); setPath(url.pathname);
      if (url.pathname === location.pathname && !url.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    };
    document.addEventListener('click', click); window.addEventListener('popstate', pop);
    return () => { document.removeEventListener('click', click); window.removeEventListener('popstate', pop); };
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
      if (target) target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    });
    document.title = path.startsWith('/produtos') ? 'Produtos Garage One | Campina Grande–PB' : path.startsWith('/orcamento') ? 'Orçamento de produtos | Garage One' : 'Garage One | Estética Automotiva em Campina Grande';
    return () => cancelAnimationFrame(frame);
  }, [path]);
  return path;
}
function HomePage({ onQuote }: { onQuote: (name?: string) => void }) {
  useReveal();
  return <><Hero onQuote={() => onQuote()} /><InfoMarquee /><Services onQuote={onQuote} /><Services moto onQuote={onQuote} /><ProductsPreview /><About /><Testimonials /><Location /></>;
}
function GarageSite() {
  const path = usePage();
  const cart = useBudgetCart();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const openQuote = (service = '') => { setSelectedService(service); setQuoteOpen(true); };
  return <><GarageAnimatedBackground /><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><Header count={cart.count} onQuote={() => openQuote()} /><main id="conteudo">{path.startsWith('/produtos') ? <ProductCatalog /> : path.startsWith('/orcamento') ? <BudgetReview /> : <HomePage onQuote={openQuote} />}</main><Footer /><a className="floating-whatsapp fisheye-glass fisheye-glass--floating" href={officialWhatsApp} target="_blank" rel="noopener noreferrer" aria-label="Falar com a Garage One pelo WhatsApp"><WhatsAppIcon size={27} /><span className="floating-tooltip">Vamos cuidar do seu veículo?</span></a><QuoteModal open={quoteOpen} selectedService={selectedService} onClose={() => setQuoteOpen(false)} /></>;
}
export default function App() { return <BudgetCartProvider><GarageSite /></BudgetCartProvider>; }
