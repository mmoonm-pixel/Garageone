import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Route } from 'lucide-react';
import { requestDrivingRoute, searchMapAddresses } from './mapServices';
import PremiumMap from './PremiumMap';
import type { Coordinates, DrivingRoute, MapAddress } from './mapServices';
type Preview = { route: DrivingRoute; origin: MapAddress };
type Props = { destination: Coordinates; externalUrl: string; onRouteChange?: (preview?: Preview) => void };
export default function MapRoutePanel({ destination, onRouteChange }: Props) {
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<Preview>();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; inputRef.current?.focus({ preventScroll: true }); return () => { mounted.current = false; sequence.current++; requestRef.current?.abort(); }; }, []);
  async function calculate(event: FormEvent) {
    event.preventDefault();
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    const current = ++sequence.current;
    const active = () => mounted.current && current === sequence.current && !controller.signal.aborted;
    setBusy(true); setError(''); setPreview(undefined); onRouteChange?.(); setStatus('Localizando o endereço de origem…');
    try {
      const matches = await searchMapAddresses(query, destination, controller.signal);
      if (!active()) return;
      const origin = matches[0];
      if (!origin) throw new Error('Não foi possível localizar o endereço. Informe rua, número e cidade.');
      setStatus('Calculando sua rota…');
      const route = await requestDrivingRoute(origin.coordinates, destination, controller.signal, 'car');
      if (!active()) return;
      const result = { route, origin }; setPreview(result); onRouteChange?.(result); setStatus('Rota calculada. Confira a origem localizada no mapa.');
    } catch (failure) { if (active()) { setError(failure instanceof Error ? failure.message : 'Não foi possível calcular a rota. Tente novamente.'); setStatus(''); } }
    finally { if (active()) setBusy(false); }
  }
  const distance = preview ? `${(preview.route.distanceMeters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km` : '';
  const minutes = preview ? Math.ceil(preview.route.durationSeconds / 60) : 0;
  const duration = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
  const google = preview ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(preview.origin.coordinates.join(','))}&destination=${encodeURIComponent(destination.join(','))}&travelmode=driving` : '';
  const waze = `https://www.waze.com/ul?ll=${encodeURIComponent(destination.join(','))}&navigate=yes`;
  return <section id="garage-route-panel" className="premium-map-directions" aria-label="Planejamento do percurso até a Garage One"><p className="premium-map-destination"><span>Destino fixo</span><strong>Garage One</strong>Avenida Amazonas, 26 — Liberdade, Campina Grande–PB.</p><form onSubmit={calculate}><label htmlFor="garage-route-origin">Endereço de origem</label><div className="premium-map-address-search"><input ref={inputRef} id="garage-route-origin" name="origin" value={query} onChange={event => { sequence.current++; requestRef.current?.abort(); setQuery(event.target.value); setPreview(undefined); onRouteChange?.(); setBusy(false); setError(''); setStatus(''); }} placeholder="Rua, número e cidade" autoComplete="street-address" minLength={4} maxLength={200} required /><button type="submit" className="fisheye-glass route-panel-action" disabled={busy}><Route size={16} aria-hidden="true" />{busy ? 'Calculando…' : 'Ver rota'}</button></div></form><div className="premium-map-route-status" aria-live="polite">{error ? <p role="alert">{error}</p> : status && <p>{status}</p>}</div>{preview && <><p className="route-resolved-origin">Origem localizada: {preview.origin.label}</p><div className="premium-map-route-summary"><strong>{distance}</strong><span>aprox. {duration} de carro</span></div><p className="premium-map-estimate">Estimativa do serviço de rotas, sem trânsito em tempo real.</p><div className="route-preview" role="region" aria-label="Mapa interativo do percurso calculado"><PremiumMap enableDirections={false} routePreview={preview} /></div><div className="route-navigation-actions"><a className="fisheye-glass route-panel-action" href={google} target="_blank" rel="noopener noreferrer">Google Maps</a><a className="fisheye-glass route-panel-action" href={waze} target="_blank" rel="noopener noreferrer">Waze</a></div>{preview.route.steps.length > 0 && <details className="route-instructions"><summary>Orientações do percurso</summary><ol>{preview.route.steps.map((step,index) => <li key={index}>{step.instruction}<span>{Math.round(step.distanceMeters)} m</span></li>)}</ol></details>}<p className="premium-map-service-credits">Busca: Photon · Rotas: OSRM / FOSSGIS</p></>}</section>;
}
