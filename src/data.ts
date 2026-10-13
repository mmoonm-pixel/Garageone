export const phone = '5583994021492';
export const whatsapp = (message: string) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
export const appointmentLink = whatsapp('Olá! Vim pelo site da Garage One e gostaria de agendar um serviço para meu veículo.');
export const informationLink = whatsapp('Olá! Vim pelo site da Garage One e gostaria de mais informações.');
export const officialWhatsApp = 'https://wa.me/message/WS7DVFEWUWGHC1';
export const address = 'Av. Amazonas, 26 — Liberdade, Campina Grande–PB, CEP 58414-280';
export const businessHours: string | null = null;
export const locationPhoto: string | null = null;
export const instagram = 'https://www.instagram.com/garageone._';
export const tiktok = 'https://www.tiktok.com/@garageone._';
export const contactCenter = 'https://linktr.ee/garageone';
export const mapsLink = 'https://maps.app.goo.gl/TuAcbVZExy5d8UZ86';
export const routeLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`Garage One ${address}`)}`;
export const navigation = [
  { label: 'Início', href: '/#inicio' },
  { label: 'Nossos serviços', href: '/#servicos' },
  { label: 'Serviços para motos', href: '/#motos' },
  { label: 'Nossos produtos', href: '/#produtos' },
  { label: 'Conheça a Garage One', href: '/#sobre' },
  { label: 'Localização', href: '/#localizacao' },
];
export type Service = { id: string; name: string; description: string; details: string; image: string; alt: string; options?: { name: string; details: string }[] };
const service = (id: string, name: string, description: string, details: string): Service => ({ id, name, description, details, image: `/images/services/${id}.webp`, alt: `Ilustração do procedimento de ${name.toLowerCase()}, em ambiente automotivo escuro com detalhes laranja` });
export const services: Service[] = [
  service('lavagem-manutencao', 'Lavagem de manutenção detalhada', 'Limpeza externa, aspiração e atenção aos acabamentos.', 'Limpeza da lataria, rodas, caixas de rodas, vidros e tapetes; selagem dos pneus; aspiração interna; descontaminação de portas e painéis.'),
  service('lavagem-cera', 'Lavagem completa com cera clássica', 'Limpeza interna e externa com proteção de cera.', 'Limpeza externa e interna, incluindo logos, letreiros e borrachas externas, com aspiração, selagem dos pneus e enceramento manual ou selante de pintura.'),
  service('polimento-comercial', 'Lavagem completa com polimento comercial e cera clássica', 'Redução de marcas superficiais e recuperação do brilho.', 'Limpeza completa com polimento para redução de marcas superficiais e recuperação do brilho, conforme avaliação da pintura.'),
  service('polimento-tecnico', 'Lavagem completa com polimento técnico e cera clássica', 'Correção cuidadosa de imperfeições da pintura.', 'Limpeza completa com correção de imperfeições da pintura, respeitando as condições e os limites do acabamento do veículo.'),
  service('selante-ceramico', 'Lavagem completa com selante cerâmico', 'Limpeza, polimento e proteção do acabamento.', 'Limpeza completa, polimento e aplicação de selante cerâmico. O catálogo anuncia garantia de 1 ano condicionada aos cuidados da empresa. Consulte as condições com a equipe.'),
  service('vitrificacao-7h', 'Vitrificação 7H', 'Proteção da pintura, brilho e facilidade de limpeza.', 'Proteção da pintura, realce do brilho e facilidade de limpeza. O catálogo anuncia garantia de 2 anos, sujeita às condições da empresa. Consulte as condições com a equipe.'),
  service('vitrificacao-9h', 'Vitrificação 9H', 'Proteção da pintura com maior durabilidade anunciada.', 'Proteção da pintura com maior durabilidade anunciada. O catálogo anuncia garantia de 3 anos, sujeita às condições da empresa. Consulte as condições com a equipe.'),
  service('vitrificacao-plasticos', 'Vitrificação de plásticos', 'Conservação dos plásticos e proteção contra o tempo.', 'Tratamento de conservação para superfícies plásticas, contra desbotamento e ação do tempo. O catálogo anuncia até 2 anos de garantia. Consulte as condições com a equipe.'),
  service('oxi-sanitizacao', 'Oxi-sanitização', 'Higienização do interior e cuidado com odores.', 'Tratamento com ozônio voltado à higienização do interior e ao combate a odores. O tratamento não representa promessa de esterilização ou eliminação total de microrganismos.'),
  service('lavagem-chassi', 'Lavagem de chassi', 'Limpeza da parte inferior do veículo.', 'Remoção de sujeira, lama e resíduos acumulados na parte inferior do veículo.'),
  service('lavagem-motor', 'Lavagem de motor', 'Limpeza técnica do compartimento do motor.', 'Inspeção, isolamento, limpeza técnica e aplicação de verniz de proteção.'),
  service('tratamento-interno', 'Tratamento interno', 'Higienização de bancos, tecidos e acabamentos.', 'Limpeza de teto, painel, portas, bancos, cintos, porta-malas, estepe, carpete e dutos de ar. Inclui higienização de estofados e hidratação de couro, quando houver.'),
  service('tratamento-vidros', 'Tratamento de vidros', 'Descontaminação e proteção do vidro automotivo.', 'Limpeza, descontaminação, tratamento de manchas de chuva ácida e aplicação de cristalizador.'),
  service('tratamento-farois', 'Tratamento de faróis', 'Correção das lentes e proteção do acabamento.', 'Limpeza das lentes, isolamento, lixamento/correção e aplicação de vitrificador.'),
  { ...service('peliculas-automotivas', 'Películas automotivas', 'Proteção solar e opções para os vidros do veículo.', 'Conheça as opções de películas do catálogo. Consulte a aplicação indicada para seu veículo, os detalhes técnicos e as condições de garantia.'), options: [
    { name: 'G1 Carbono', details: 'Proteção solar e conforto térmico. O catálogo informa 3 anos de garantia pela marca.' },
    { name: 'G1 Teto Solar', details: 'Aplicação no teto solar para melhorar o conforto interno.' },
    { name: 'G1 Window Blue para para-brisas', details: 'O catálogo anuncia bloqueio de 84% a 89% dos infravermelhos e mais de 99% dos raios UV. Esses números se referem à filtragem da película, não à redução da temperatura interna.' },
    { name: 'G1 Window Premium', details: 'Composição nanocerâmica, com bloqueio anunciado de até 94% dos infravermelhos. Informação do catálogo sobre filtragem da película, não redução da temperatura interna.' },
  ] },
];
export const motorcycleServices: Service[] = [
  service('moto-lavagem-simples', 'Lavagem simples', 'Limpeza da moto e de seus acabamentos.', 'Serviço de lavagem para motos. Consulte os cuidados indicados para seu modelo.'),
  service('moto-polimento-carenagem', 'Polimento de carenagem', 'Cuidado com o brilho e o acabamento da carenagem.', 'Polimento da carenagem da moto, conforme avaliação do acabamento.'),
  service('moto-polimento-farois', 'Polimento de faróis e lanternas', 'Correção e cuidado com as lentes da moto.', 'Serviço para faróis e lanternas de motos, conforme avaliação das lentes.'),
  service('moto-vitrificacao-7h', 'Vitrificação 7H', 'Proteção para o acabamento da sua moto.', 'Vitrificação 7H para motos. Consulte a aplicação adequada e as condições com a equipe.'),
  service('moto-vitrificacao-9h', 'Vitrificação 9H', 'Proteção e conservação dos detalhes da moto.', 'Vitrificação 9H para motos. Consulte a aplicação adequada e as condições com a equipe.'),
  service('moto-limpeza-corrente', 'Limpeza de corrente', 'Limpeza cuidadosa da corrente da moto.', 'Serviço de limpeza da corrente da moto. Consulte as recomendações para seu modelo.'),
  service('moto-enceramento', 'Enceramento', 'Realce do brilho e cuidado com as superfícies.', 'Enceramento de superfícies compatíveis da moto, conforme avaliação da equipe.'),
  service('moto-ppf', 'PPF', 'Película de proteção para superfícies da moto.', 'Aplicação de película de proteção PPF em áreas compatíveis da moto. Consulte a cobertura indicada para seu modelo.'),
];
export const quoteServices = [...services.flatMap(s => [s.name, ...(s.options?.map(o => `${s.name} — ${o.name}`) ?? [])]), ...motorcycleServices.map(s => `Moto — ${s.name}`), 'Preciso de orientação'];
export type Testimonial = { id: string; category: string; comment: string; rating?: number; kind: 'verified'; verified: true };
export const testimonials: Testimonial[] = [];
