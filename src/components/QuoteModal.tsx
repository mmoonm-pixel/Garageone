import { useEffect, useId, useRef } from 'react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import './QuoteModal.css';
import { X } from 'lucide-react';
import { quoteServices as services, whatsapp } from '../data';
import { animate } from 'motion';

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
  selectedService?: string;
}


export default function QuoteModal({ open, onClose, selectedService = '' }: QuoteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLSelectElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const id = useId();

  // A service change must not unlock the page or restart the modal entrance.
  useEffect(() => {
    if (open && serviceRef.current) {
      serviceRef.current.value = selectedService;
      serviceRef.current.setCustomValidity('');
    }
  }, [open, selectedService]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const body = document.body, root = document.documentElement;
    const x = window.scrollX, y = window.scrollY;
    const bodyProperties = ['position', 'top', 'left', 'right', 'width', 'overflow', 'padding-right'] as const;
    const bodyStyles = bodyProperties.map(key => [key, body.style.getPropertyValue(key), body.style.getPropertyPriority(key)] as const);
    const rootOverflow = root.style.overflow, rootBehavior = root.style.scrollBehavior;
    const gap = window.innerWidth - root.clientWidth;
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
    root.style.overflow = 'hidden';
    body.style.position = 'fixed'; body.style.top = `-${y}px`; body.style.left = `-${x}px`;
    body.style.right = '0'; body.style.width = '100%'; body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${padding + gap}px`;
    const viewport = window.visualViewport;
    let frame = 0, lastHeight = 0;
    const updateHeight = () => {
      const height = Math.round(viewport?.height ?? window.innerHeight);
      if (height === lastHeight) return;
      lastHeight = height;
      dialog.style.setProperty('--quote-viewport-height', `${height}px`);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => keepFocusedFieldVisible());
    };
    updateHeight();
    if (!dialog.open) dialog.showModal();
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Opacity only: no moving, scaling or recentering during interaction.
    const entrance = preference.matches ? null : animate(dialog, { opacity: [0, 1] }, { duration: .3 });
    const stopMotion = () => { if (preference.matches) { entrance?.stop(); dialog.style.opacity = '1'; } };
    preference.addEventListener('change', stopMotion);
    viewport?.addEventListener('resize', updateHeight);
    window.addEventListener('resize', updateHeight);
    const focusFrame = requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 767px)').matches) dialog.focus({ preventScroll: true });
      else nameRef.current?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frame); cancelAnimationFrame(focusFrame);
      viewport?.removeEventListener('resize', updateHeight);
      window.removeEventListener('resize', updateHeight);
      preference.removeEventListener('change', stopMotion);
      entrance?.stop();
      if (dialog.open) dialog.close();
      dialog.style.removeProperty('--quote-viewport-height'); dialog.style.removeProperty('opacity');
      root.style.scrollBehavior = 'auto';
      for (const [key, value, priority] of bodyStyles) {
        if (value) body.style.setProperty(key, value, priority); else body.style.removeProperty(key);
      }
      root.style.overflow = rootOverflow;
      window.scrollTo({ left: x, top: y, behavior: 'instant' });
      previousFocusRef.current?.isConnected && previousFocusRef.current.focus({ preventScroll: true });
      root.style.scrollBehavior = rootBehavior;
    };
  }, [open]);

  function keepFocusedFieldVisible() {
    const scroller = scrollRef.current, active = document.activeElement;
    if (!scroller || !(active instanceof HTMLElement) || !scroller.contains(active)) return;
    const area = scroller.getBoundingClientRect(), field = active.getBoundingClientRect();
    // Scroll only the form, only when necessary; never move the dialog itself.
    const top = area.top + 64, bottom = area.bottom - 12;
    if (field.bottom > bottom) scroller.scrollTop += field.bottom - bottom;
    else if (field.top < top) scroller.scrollTop -= top - field.top;
  }

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;

    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) {
      event.preventDefault();
      event.currentTarget.focus();
    } else if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      onClose();
    }
  }

  function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const service = String(data.get('service') ?? '').trim();
    const vehicle = String(data.get('vehicle') ?? '').trim();
    const preference = String(data.get('preference') ?? '').trim();

    for (const [fieldName, value, message] of [
      ['name', name, 'Informe seu nome.'],
      ['service', service, 'Selecione o serviço desejado.'],
      ['vehicle', vehicle, 'Informe o modelo do veículo.'],
    ]) {
      const field = form.elements.namedItem(fieldName) as HTMLInputElement | HTMLSelectElement | null;
      if (!value && field) {
        field.setCustomValidity(message);
        field.reportValidity();
        field.focus();
        return;
      }
    }

    const message = [
      'Olá, equipe Garage One! Vim pelo site e gostaria de solicitar um orçamento.',
      '',
      `Nome: ${name}`,
      `Serviço desejado: ${service}`,
      `Modelo do veículo: ${vehicle}`,
      ...(preference ? [`Mensagem: ${preference}`] : []),
    ].join('\n');

    window.open(whatsapp(message), '_blank', 'noopener,noreferrer');
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="quote-dialog"
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-note`}
      onKeyDown={trapFocus}
      onClick={closeFromBackdrop}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button className="modal-close fisheye-glass fisheye-glass--icon" type="button" onClick={onClose} aria-label="Fechar formulário de orçamento">
        <X size={22} aria-hidden="true" />
      </button>

      <div className="quote-dialog-scroll" ref={scrollRef} onFocusCapture={() => requestAnimationFrame(keepFocusedFieldVisible)}>
      <div className="modal-header">
        <span className="eyebrow">Atendimento personalizado</span>
        <h2 id={`${id}-title`}>Solicitar orçamento</h2>
        <p>Conte o que seu veículo precisa. Nossa equipe dará continuidade ao atendimento pelo WhatsApp.</p>
      </div>

      <form className="quote-form" onSubmit={submitQuote}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor={`${id}-name`}>Nome <span aria-hidden="true">*</span></label>
            <input
              ref={nameRef}
              id={`${id}-name`}
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              maxLength={100}
              required
              onInput={(event) => event.currentTarget.setCustomValidity('')}
            />
          </div>

          <div className="field">
            <label htmlFor={`${id}-service`}>Serviço desejado <span aria-hidden="true">*</span></label>
            <select
              ref={serviceRef}
              id={`${id}-service`}
              name="service"
              defaultValue=""
              required
              onChange={(event) => event.currentTarget.setCustomValidity('')}
            >
              <option value="" disabled>Selecione um serviço</option>
              {services.map((service) => <option key={service} value={service}>{service}</option>)}
            </select>
          </div>

          <div className="field">
            <label htmlFor={`${id}-vehicle`}>Modelo do veículo <span aria-hidden="true">*</span></label>
            <input
              id={`${id}-vehicle`}
              name="vehicle"
              type="text"
              placeholder="Ex.: Corolla 2023"
              maxLength={120}
              required
              onInput={(event) => event.currentTarget.setCustomValidity('')}
            />
          </div>

          <div className="field">
            <label htmlFor={`${id}-preference`}>Mensagem para o atendimento</label>
            <textarea
              id={`${id}-preference`}
              name="preference"
              rows={4}
              maxLength={2000}
              placeholder="Conte mais sobre o seu veículo."
            />
          </div>
        </div>

        <p id={`${id}-note`} className="form-note">* Campos obrigatórios. O WhatsApp será aberto com essas informações. Confirme o envio no aplicativo. Sem cadastro.</p>
        <button className="btn btn-primary fisheye-glass" type="submit">Enviar pelo WhatsApp</button>
      </form>
      </div>
    </dialog>, document.body
  );
}
