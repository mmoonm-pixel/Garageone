// Public, best-effort services; no API keys, paid accounts or traffic estimates.
// Requests are made only after an explicit address/route action, never as autocomplete.
export const mapCapabilities = { perspective3D: false, routing: true } as const;
export type TransportMode = 'car' | 'bike' | 'foot';
export const transportModes = {
  car: { label: 'Carro', estimate: 'de carro', endpoint: 'routed-car', profile: 'driving', google: 'driving' },
  bike: { label: 'Bicicleta', estimate: 'de bicicleta', endpoint: 'routed-bike', profile: 'bike', google: 'bicycling' },
  foot: { label: 'A pé', estimate: 'a pé', endpoint: 'routed-foot', profile: 'foot', google: 'walking' },
} as const;
export type Coordinates = [latitude: number, longitude: number];
export type MapAddress = { id: string; label: string; coordinates: Coordinates };
export type DrivingRoute = {
  coordinates: Coordinates[];
  distanceMeters: number;
  durationSeconds: number;
  transportMode: TransportMode;
  steps: { instruction: string; distanceMeters: number }[];
};

const addressCache = new Map<string, MapAddress[]>();
const routeCache = new Map<string, DrivingRoute>();
let lastAddressRequest = 0;
let lastRouteRequest = 0;
const record = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;

function coordinatePair(value: unknown): Coordinates | undefined {
  if (!Array.isArray(value) || value.length < 2) return;
  const [longitude, latitude] = value;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
  return [latitude, longitude];
}

async function requestJson(url: string, signal: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) controller.abort();
  const timer = window.setTimeout(cancel, 12000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('O serviço de mapas está indisponível. Tente novamente ou abra no Google Maps.');
    return await response.json();
  } catch (error) {
    if (signal.aborted) throw new DOMException('Solicitação cancelada', 'AbortError');
    if (controller.signal.aborted) throw new Error('O serviço demorou a responder. Tente novamente ou abra no Google Maps.');
    if (error instanceof SyntaxError) throw new Error('O serviço não retornou uma resposta válida. Tente novamente ou abra no Google Maps.');
    if (error instanceof TypeError) throw new Error('Não foi possível acessar o serviço de mapas. Confira a conexão ou abra no Google Maps.');
    throw error;
  } finally {
    window.clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}

function remember<T>(cache: Map<string, T>, key: string, value: T) {
  if (cache.size >= 20) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
}

export async function searchMapAddresses(query: string, destination: Coordinates, signal: AbortSignal): Promise<MapAddress[]> {
  const key = query.trim();
  if (key.length < 4 || key.length > 200) throw new Error('Informe um endereço com pelo menos quatro caracteres, incluindo a cidade.');
  if (addressCache.has(key)) return addressCache.get(key)!;
  if (Date.now() - lastAddressRequest < 1000) throw new Error('Aguarde um instante antes de buscar novamente.');
  lastAddressRequest = Date.now();
  const params = new URLSearchParams({ q: key, limit: '5', lat: String(destination[0]), lon: String(destination[1]) });
  const data = record(await requestJson(`https://photon.komoot.io/api/?${params}`, signal));
  const features = data?.features;
  if (!Array.isArray(features)) throw new Error('Não foi possível consultar o endereço. Tente novamente.');
  const found: MapAddress[] = [];
  for (const item of features) {
    const feature = record(item), properties = record(feature?.properties), geometry = record(feature?.geometry);
    const coordinates = coordinatePair(geometry?.coordinates);
    if (!properties || !coordinates || geometry?.type !== 'Point') continue;
    const text = (field: string) => typeof properties[field] === 'string' ? properties[field] as string : '';
    const street = [text('street'), text('housenumber')].filter(Boolean).join(', ');
    const parts = [text('name'), street, text('district'), text('city') || text('county'), text('state'), text('country')];
    const label = [...new Set(parts.filter(Boolean))].join(' — ');
    if (!label) continue;
    found.push({ id: `${coordinates[0]},${coordinates[1]}`, label, coordinates });
  }
  const unique = found.filter((item, index) => found.findIndex(other => other.id === item.id) === index);
  remember(addressCache, key, unique);
  return unique;
}

export async function requestDrivingRoute(origin: Coordinates, destination: Coordinates, signal: AbortSignal, mode: TransportMode = 'car'): Promise<DrivingRoute> {
  const path = `${origin[1]},${origin[0]};${destination[1]},${destination[0]}`;
  const key = `${mode}:${path}`;
  if (routeCache.has(key)) return routeCache.get(key)!;
  if (Date.now() - lastRouteRequest < 1000) throw new Error('Aguarde um instante antes de calcular novamente.');
  lastRouteRequest = Date.now();
  const provider = transportModes[mode];
  const data = record(await requestJson(`https://routing.openstreetmap.de/${provider.endpoint}/route/v1/${provider.profile}/${path}?overview=full&geometries=geojson&steps=true`, signal));
  if (data?.code !== 'Ok' || !Array.isArray(data.routes) || !data.routes.length)
    throw new Error('Não foi possível encontrar uma rota nesse modo de transporte para o ponto de partida.');
  const first = record(data.routes[0]), geometry = record(first?.geometry);
  const rawCoordinates = geometry?.coordinates;
  if (geometry?.type !== 'LineString' || !Array.isArray(rawCoordinates)) throw new Error('O serviço não retornou um percurso válido.');
  const coordinates = rawCoordinates.map(coordinatePair).filter((point): point is Coordinates => !!point);
  if (coordinates.length < 2 || coordinates.length !== rawCoordinates.length || typeof first?.distance !== 'number' || typeof first.duration !== 'number' ||
    !Number.isFinite(first.distance) || !Number.isFinite(first.duration) || first.distance < 0 || first.duration < 0)
    throw new Error('O serviço não retornou um percurso válido.');
  const steps: DrivingRoute['steps'] = [];
  if (Array.isArray(first.legs)) for (const rawLeg of first.legs) {
    const leg = record(rawLeg);
    if (!Array.isArray(leg?.steps)) continue;
    for (const rawStep of leg.steps) {
      const step = record(rawStep), maneuver = record(step?.maneuver);
      if (!step || !maneuver || typeof step.distance !== 'number' || !Number.isFinite(step.distance) || step.distance < 0) continue;
      const instruction = maneuverInstruction(maneuver);
      if (!instruction) continue;
      const street = typeof step.name === 'string' && step.name.trim() ? ` · ${step.name.trim()}` : '';
      steps.push({ instruction: `${instruction}${maneuver.type === 'arrive' ? '' : street}`, distanceMeters: step.distance });
    }
  }
  const route = { coordinates, distanceMeters: first.distance, durationSeconds: first.duration, transportMode: mode, steps };
  remember(routeCache, key, route);
  return route;
}

// Instructions are translations of actual OSRM maneuvers, never inferred from
// straight-line geometry. If the provider omits them, no instructions are shown.
function maneuverInstruction(maneuver: Record<string, unknown>): string | undefined {
  if (maneuver.type === 'depart') return 'Saia do ponto de partida';
  if (maneuver.type === 'arrive') return 'Chegue ao destino';
  if (['roundabout', 'rotary', 'roundabout turn'].includes(String(maneuver.type))) {
    return typeof maneuver.exit === 'number' && Number.isInteger(maneuver.exit) && maneuver.exit > 0
      ? `Na rotatória, utilize a saída ${maneuver.exit}` : 'Siga pela rotatória';
  }
  if (maneuver.type === 'on ramp') return 'Entre na via de acesso';
  if (maneuver.type === 'off ramp') return 'Utilize a saída';
  if (maneuver.type === 'merge') return 'Entre na via';
  if (maneuver.type === 'fork') return `Na bifurcação, ${maneuver.modifier === 'left' || maneuver.modifier === 'slight left' ? 'mantenha-se à esquerda' : maneuver.modifier === 'right' || maneuver.modifier === 'slight right' ? 'mantenha-se à direita' : 'siga em frente'}`;
  if (['turn', 'end of road', 'continue', 'new name', 'notification', 'use lane', 'exit roundabout', 'exit rotary'].includes(String(maneuver.type))) {
    const modifiers: Record<string, string> = { left: 'Vire à esquerda', right: 'Vire à direita', 'slight left': 'Siga levemente à esquerda', 'slight right': 'Siga levemente à direita', 'sharp left': 'Vire à esquerda', 'sharp right': 'Vire à direita', uturn: 'Faça o retorno', straight: 'Siga em frente' };
    return modifiers[String(maneuver.modifier)] ?? 'Continue pelo percurso';
  }
  return;
}
