import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Service } from '../data';
export default function ServiceDetails({ service, moto, onClose, onQuote }: { service: Service; moto: boolean; onClose: () => void; onQuote: (selection: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const name = moto ? `Moto — ${service.name}` : service.name;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = overflow; if (focus?.isConnected) focus.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="quote-dialog service-details-dialog" aria-labelledby="service-details-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { const r = event.currentTarget.getBoundingClientRect(); if (event.target === event.currentTarget && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) onClose(); }}>
    <button type="button" className="modal-close fisheye-glass fisheye-glass--icon" aria-label="Fechar detalhes do serviço" onClick={onClose}><X size={20} /></button><span className="eyebrow">{moto ? 'Cuidados para motos' : 'Cuidados para carros'}</span><h2 id="service-details-title">{service.name}</h2><p>{service.details}</p>
    {service.options && <div className="service-options">{service.options.map(option => <div key={option.name}><h3>{option.name}</h3><p>{option.details}</p><button type="button" className="btn fisheye-glass" onClick={() => onQuote(`${service.name} — ${option.name}`)}>Orçamento desta película</button></div>)}</div>}
    <button type="button" className="btn fisheye-glass" onClick={() => onQuote(name)}>Solicitar orçamento</button>
  </dialog>;
}
