import { useEffect, useRef, useState } from 'react';
import type { FeatureGroup, LeafletEvent, Map as LeafletMap, Marker, TileLayer } from 'leaflet';
import { MapPin, Route } from 'lucide-react';
import MapRouteModal from './MapRouteModal';
import type { DrivingRoute, MapAddress } from './mapServices';
import 'leaflet/dist/leaflet.css';
import './PremiumMap.css';

// Verified Garage One point from the LOCALIZAÇÃO link on the official Linktree.
// https://maps.app.goo.gl/TuAcbVZExy5d8UZ86 — checked 2026-10-13.
export const businessCoordinates: [number, number] = [-7.2390304, -35.8887076];
export const mapRouteUrl = 'https://www.google.com/maps/dir/?api=1&destination=Garage+One+Av+Amazonas+26+Liberdade+Campina+Grande+PB';

// Browser requests only the visible map. Keep attribution, Referer and normal
// HTTP caching intact; do not prefetch or download tiles for offline use.
const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const carIcon = '<span class="premium-map-car fisheye-glass"><svg viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 29v-5c0-2 1.3-3.7 3.2-4.3L16 13h12l8.5 7 4.5 2.2V29H7Z"/><path d="m16 13-2.8 7H35M22 13v7M8 25h4m25 0h4"/><circle cx="15" cy="29" r="3.4" fill="none"/><circle cx="34" cy="29" r="3.4" fill="none"/></svg></span>';

function buildInfoCard(openDirections?: () => void) {
  const card = document.createElement('div');
  card.className = 'premium-map-info';
  card.setAttribute('role', 'group');
  card.setAttribute('aria-label', 'Informações da Garage One');

  const title = document.createElement('h3');
  title.textContent = 'GARAGE ONE';
  const subtitle = document.createElement('p');
  subtitle.className = 'premium-map-info-subtitle';
  subtitle.textContent = 'Estética Automotiva';
  const address = document.createElement('address');
  address.append(
    document.createTextNode('Av. Amazonas, 26'),
    document.createElement('br'),
    document.createTextNode('Liberdade'),
    document.createElement('br'),
    document.createTextNode('Campina Grande/PB'),
  );
  const route = document.createElement('button');
  route.className = 'fisheye-glass premium-map-popup-route';
  route.type = 'button';
  if (openDirections) route.addEventListener('click', openDirections);
  route.textContent = 'TRAÇAR ROTA';
  route.setAttribute('aria-label', 'Traçar rota até a Garage One neste mapa');
  card.append(title, subtitle, address);
  if (openDirections) card.append(route);
  return card;
}

type Props = { enableDirections?: boolean; routePreview?: { route: DrivingRoute; origin: MapAddress } };

export default function PremiumMap({ enableDirections = true, routePreview }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [resolvedRoute, setResolvedRoute] = useState<{ route: DrivingRoute; origin: MapAddress }>();
  const drawingFrame = useRef(0);
  const [ready, setReady] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const routeLayers = useRef<FeatureGroup | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const selectBusinessRef = useRef<(() => void) | null>(null);
  const routeButtonRef = useRef<HTMLButtonElement>(null);

  function displayRoute(route: DrivingRoute, origin: MapAddress) {
    const map = mapRef.current, leaflet = leafletRef.current, layers = routeLayers.current;
    if (!map || !leaflet || !layers) return;
    cancelAnimationFrame(drawingFrame.current); drawingFrame.current = 0;
    map.stop(); map.closePopup(); layers.clearLayers();
    const coordinates = route.coordinates;
    const shadow = leaflet.polyline([], { color: '#080808', weight: 8, opacity: .3, interactive: false }).addTo(layers);
    const line = leaflet.polyline([], { color: '#e65c1a', weight: 4, opacity: .9, interactive: false }).addTo(layers);
    leaflet.circleMarker(origin.coordinates, { radius: 6, color: '#e65c1a', weight: 2, fillColor: '#e65c1a', fillOpacity: 1 }).bindTooltip('Ponto de partida').addTo(layers);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    map.fitBounds(leaflet.latLngBounds(coordinates), { padding: [36, 60], maxZoom: 17, animate: !preference.matches, duration: .65 });
    const paint = (points: typeof coordinates) => { shadow.setLatLngs(points); line.setLatLngs(points); };
    if (preference.matches) { paint(coordinates); if (surfaceRef.current) surfaceRef.current.dataset.routeDrawing = 'complete'; return; }
    const cumulative = [0];
    for (let i = 1; i < coordinates.length; i++) cumulative.push(cumulative[i - 1] + leaflet.latLng(coordinates[i - 1]).distanceTo(leaflet.latLng(coordinates[i])));
    const total = cumulative[cumulative.length - 1];
    const started = performance.now();
    if (surfaceRef.current) surfaceRef.current.dataset.routeDrawing = 'running';
    const draw = (time: number) => {
      if (!surfaceRef.current || mapRef.current !== map) return;
      const progress = preference.matches || document.hidden ? 1 : Math.min(1, (time - started) / 1200);
      const target = total * (1 - (1 - progress) ** 3);
      let index = 1;
      while (index < cumulative.length - 1 && cumulative[index] < target) index++;
      const length = cumulative[index] - cumulative[index - 1];
      const ratio = length > 0 ? Math.max(0, Math.min(1, (target - cumulative[index - 1]) / length)) : 1;
      const from = coordinates[index - 1], to = coordinates[index];
      const partial: typeof coordinates = [...coordinates.slice(0, index), [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio]];
      paint(progress === 1 ? coordinates : partial);
      if (progress < 1) drawingFrame.current = requestAnimationFrame(draw);
      else { drawingFrame.current = 0; surfaceRef.current.dataset.routeDrawing = 'complete'; }
    };
    drawingFrame.current = requestAnimationFrame(draw);
  }
  const effectiveRoute = routePreview ?? resolvedRoute;
  useEffect(() => {
    if (!ready) return;
    if (effectiveRoute) displayRoute(effectiveRoute.route, effectiveRoute.origin);
    else { cancelAnimationFrame(drawingFrame.current); drawingFrame.current = 0; routeLayers.current?.clearLayers(); if (surfaceRef.current) delete surfaceRef.current.dataset.routeDrawing; }
  }, [ready, effectiveRoute?.route, effectiveRoute?.origin]);
  useEffect(() => () => cancelAnimationFrame(drawingFrame.current), []);

  function closeDirections() {
    setRouteOpen(false);
    routeButtonRef.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const frame = frameRef.current;
    const surface = surfaceRef.current;
    if (!frame || !surface) return;

    let disposed = false;
    let started = false;
    let map: LeafletMap | undefined;
    let marker: Marker | undefined;
    let tiles: TileLayer | undefined;
    let resize: ResizeObserver | undefined;
    let removeMarkerKey: (() => void) | undefined;
    let tileSuccesses = 0;
    let tileErrors = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateExpanded = (event: LeafletEvent) => {
      // popupclose fires while Leaflet is still removing its layer.
      const open = event.type === 'popupopen';
      marker?.getElement()?.setAttribute('aria-expanded', String(open));
      if (!disposed) setPopupOpen(open);
    };
    const syncMotionPreference = () => {
      if (!map) return;
      const enabled = !reducedMotion.matches;
      map.options.inertia = enabled;
      if (!enabled) map.stop();
    };

    async function initialize() {
      if (started || disposed) return;
      started = true;
      try {
        const leaflet = await import('leaflet');
        if (disposed) return;
        leafletRef.current = leaflet;
        map = leaflet.map(surface!, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: false,
          touchZoom: true,
          keyboard: true,
          tapHold: false,
          zoomAnimation: true,
          fadeAnimation: false,
          markerZoomAnimation: true,
          inertia: !reducedMotion.matches,
          minZoom: 2,
          maxZoom: 19,
        }).setView(businessCoordinates, 16);
        // Leaflet 1.9.4 leaves a zoom RAF/250 ms fallback queued after remove().
        // Guard this instance's callbacks so closing the route modal mid-zoom is safe.
        const lifecycleMap = map as LeafletMap & {
          _animateZoom: (...args: unknown[]) => void;
          _onZoomTransitionEnd: () => void;
        };
        const animateZoom = lifecycleMap._animateZoom.bind(lifecycleMap);
        const finishZoom = lifecycleMap._onZoomTransitionEnd.bind(lifecycleMap);
        lifecycleMap._animateZoom = (...args) => { if (!disposed) animateZoom(...args); };
        lifecycleMap._onZoomTransitionEnd = () => { if (!disposed) finishZoom(); };
        mapRef.current = map;
        routeLayers.current = leaflet.featureGroup().addTo(map);
        // Force instantaneous public camera methods when reduced motion is active.
        const panBy = map.panBy.bind(map);
        map.panBy = (offset, options = {}) => panBy(offset,
          reducedMotion.matches ? { ...options, animate: false } : options);
        const setView = map.setView.bind(map);
        map.setView = (center, zoom, options = {}) => setView(center, zoom,
          reducedMotion.matches ? { ...options, animate: false } : options);
        map.attributionControl.setPrefix(false);
        map.attributionControl.setPosition('bottomleft');
        map.zoomControl.setPosition('topleft');

        tiles = leaflet.tileLayer(tileUrl, {
          maxZoom: 19,
          minZoom: 2,
          keepBuffer: 0,
          updateWhenIdle: true,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
        });
        tiles.on('loading', () => { tileSuccesses = 0; tileErrors = 0; });
        tiles.on('tileload', () => {
          tileSuccesses += 1;
          if (!disposed) setUnavailable(false);
        });
        tiles.on('tileerror', () => { tileErrors += 1; });
        tiles.on('load', () => {
          if (!disposed && tileErrors > 0 && tileSuccesses === 0) setUnavailable(true);
        });
        tiles.addTo(map);

        marker = leaflet.marker(businessCoordinates, {
          icon: leaflet.divIcon({
            html: carIcon,
            className: 'premium-map-marker',
            iconSize: [58, 58],
            iconAnchor: [29, 29],
            popupAnchor: [0, -30],
          }),
          title: enableDirections ? 'Garage One — ver informações e rota' : 'Garage One — destino do percurso',
          alt: 'Garage One — estética automotiva',
          keyboard: true,
          autoPanOnFocus: true,
        }).addTo(map);
        marker.bindPopup(buildInfoCard(enableDirections ? () => { marker?.closePopup(); setRouteOpen(true); } : undefined), {
          className: 'premium-map-popup',
          maxWidth: 250,
          minWidth: 205,
          autoPan: true,
          autoPanPadding: [20, 20],
          closeButton: true,
        });
        // Rebind the default click handler: opening the popup follows the real camera move.
        marker.off('click');
        const showBusiness = () => {
          if (!map || !marker) return;
          map.stop();
          marker.closePopup();
          map.off('moveend', openBusinessPopup);
          if (reducedMotion.matches) { map.setView(businessCoordinates, 18, { animate: false }); marker.openPopup(); }
          else { map.once('moveend', openBusinessPopup); map.flyTo(businessCoordinates, 18, { animate: true, duration: .7 }); }
        };
        const openBusinessPopup = () => marker?.openPopup();
        selectBusinessRef.current = showBusiness;
        marker.on('click', showBusiness);
        marker.on('popupopen popupclose', updateExpanded);
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.setAttribute('role', 'button');
          markerElement.setAttribute('aria-label', 'Garage One — abrir informações da localização');
          markerElement.setAttribute('aria-haspopup', 'true');
          markerElement.setAttribute('aria-expanded', 'false');
          const markerKey = (event: KeyboardEvent) => {
            if (event.key !== ' ' && event.key !== 'Enter') return;
            event.preventDefault();
            event.stopPropagation();
            if (marker?.isPopupOpen()) marker.closePopup(); else showBusiness();
          };
          markerElement.addEventListener('keydown', markerKey);
          removeMarkerKey = () => markerElement.removeEventListener('keydown', markerKey);
        }

        // Leaflet supplies keyboard-operable controls; labels use the site's language.
        const zoomIn = surface!.querySelector<HTMLAnchorElement>('.leaflet-control-zoom-in');
        const zoomOut = surface!.querySelector<HTMLAnchorElement>('.leaflet-control-zoom-out');
        zoomIn?.setAttribute('aria-label', 'Ampliar mapa');
        zoomIn?.setAttribute('title', 'Ampliar mapa');
        zoomOut?.setAttribute('aria-label', 'Reduzir mapa');
        zoomOut?.setAttribute('title', 'Reduzir mapa');
        zoomIn?.classList.add('fisheye-glass');
        zoomOut?.classList.add('fisheye-glass');

        if ('ResizeObserver' in window) {
          resize = new ResizeObserver(() => map?.invalidateSize({ animate: false, pan: false }));
          resize.observe(surface!);
        }
        reducedMotion.addEventListener('change', syncMotionPreference);
        if (!disposed) setReady(true);
      } catch {
        if (!disposed) setUnavailable(true);
      }
    }

    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer?.disconnect();
          void initialize();
        }
      }, { threshold: 0.01 });
      observer.observe(frame);
    } else {
      void initialize();
    }

    return () => {
      disposed = true;
      observer?.disconnect();
      resize?.disconnect();
      reducedMotion.removeEventListener('change', syncMotionPreference);
      removeMarkerKey?.();
      marker?.off();
      tiles?.off();
      map?.remove();
      mapRef.current = null; leafletRef.current = null; routeLayers.current = null; selectBusinessRef.current = null;
    };
  }, []);

  return <div className={`map-container premium-map${popupOpen ? ' has-open-popup' : ''}`} ref={frameRef} data-reveal>
    <div className="premium-map-stage">
      <div className="premium-map-surface" ref={surfaceRef} tabIndex={0} aria-label="Mapa interativo da Garage One em Campina Grande: use as setas para mover e os controles para ampliar" />
      {unavailable && <div className="premium-map-fallback" role="status"><p>Mapa indisponível. A opção Google Maps continua acessível.</p></div>}
      <button className="fisheye-glass premium-map-locate" type="button" onClick={() => selectBusinessRef.current?.()} aria-label="Aproximar mapa e abrir informações da Garage One"><MapPin size={16} aria-hidden="true" />Garage One</button>
      {enableDirections && <div className="premium-map-stage-actions">
        <button ref={routeButtonRef} className="fisheye-glass premium-map-route" type="button" aria-expanded={routeOpen} aria-controls="garage-route-panel" aria-haspopup="dialog" onClick={() => routeOpen ? closeDirections() : setRouteOpen(true)}><Route size={16} aria-hidden="true" />Traçar rota</button>
        {resolvedRoute && <><a className="fisheye-glass premium-map-google" href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(resolvedRoute.origin.coordinates.join(','))}&destination=${encodeURIComponent(businessCoordinates.join(','))}&travelmode=driving`} target="_blank" rel="noopener noreferrer">Google Maps</a><a className="fisheye-glass premium-map-google" href={`https://www.waze.com/ul?ll=${encodeURIComponent(businessCoordinates.join(','))}&navigate=yes`} target="_blank" rel="noopener noreferrer">Waze</a></>}
      </div>}
    </div>
    {enableDirections && routeOpen && <MapRouteModal destination={businessCoordinates} onClose={closeDirections} externalUrl={mapRouteUrl} returnFocusRef={routeButtonRef} onRouteChange={setResolvedRoute} />}
  </div>;
}
