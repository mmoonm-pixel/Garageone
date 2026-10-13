# Garage One — Estética Automotiva

Adaptação do site existente em React, TypeScript, Vite, Tailwind, Motion e Leaflet. Preserva tipografia Chakra Petch/Inter, menu aerodinâmico, vidro transparente, carrosséis, fundo global cinematográfico e navegação responsiva. A antiga comparação foi substituída pela seleção de produtos, conforme solicitado.

## Executar

```bash
npm ci
npm run dev
npm run build
npm run preview
```

O build gera `dist/` e páginas estáticas para `/produtos/` e `/orcamento/`, com navegação interna React e acesso direto. Na Vercel, usar preset Vite, comando `npm run build` e diretório `dist`; configuração em `vercel.json`. Não há variáveis privadas ou chaves de mapa obrigatórias.

## Conteúdo

- 15 serviços para carros, quatro opções de películas e oito serviços para motos; todos podem ser pré-selecionados no formulário.
- 131 produtos e 142 apresentações em `src/garage-products.json`, sete categorias, fotografias reais extraídas das 22 páginas do catálogo e salvas localmente. Sem preços ou estoque em tempo real.
- Cinco apresentações marcadas como reposição no catálogo consultado: Delet 5 L, Dimension 9H, V-Paint 20 ml, Glass Coat H7 27 ml e Luxury Gloss 500 ml. Não podem ser adicionadas normalmente ao orçamento.
- Carrinho em `localStorage`, chave `garage-one-budget-v1`, com IDs de produto/apresentação e quantidades inteiras. Seleção restaurada ao navegar/atualizar. Duplicatas são somadas. Abrir WhatsApp não limpa a seleção.
- Revisão de orçamento, quantidades editáveis, remoção, nome obrigatório, observações opcionais. Mensagem com nome, quantidades, produtos e apresentações; observações vazias são omitidas. Um único botão abre o link HTTPS wa.me na mesma aba, com a seleção atual codificada uma vez. Não há tentativa whatsapp://, alternativa nem botão de cópia. Nome e observações permanecem na sessão. Nenhum envio automático, compra ou confirmação fictícia.
- WhatsApp comercial `5583994021492`; botão flutuante mantém link oficial `https://wa.me/message/WS7DVFEWUWGHC1`.
- Vídeo fornecido pelo usuário em MP4 sem áudio, com poster real, loop e reprodução inline; poster estático com movimento reduzido. A mesma mídia é utilizada no institucional e no hero exclusivamente mobile. O hero desktop mantém o banner original; o banner avulso foi removido.
- Ponto do mapa confirmado pelo link de localização da central oficial da empresa. Leaflet/OSM, marcador automotivo laranja, zoom, popup e rotas em modal. Photon/OSRM são serviços públicos sem chave, usados somente mediante ação do visitante. O formulário recebe somente o endereço de origem e calcula um percurso real de carro; o traçado aparece progressivamente no mapa. Google Maps e Waze ficam disponíveis após o cálculo.

## Materiais e informações pendentes

- Três inclusões por serviço de moto: a página 16 do catálogo lista somente os nomes. Os cards exibem apenas o escopo já confirmado; detalhamento aguarda a empresa.
- Abertura do WhatsApp em celular físico: tentativa direta implementada e testada em emulação, sem aparelho físico disponível. Confirmações/bloqueios do navegador e sistema permanecem possíveis.

- Fotografia real do estabelecimento: `locationPhoto` em `src/data.ts` está preparado, sem imagem fictícia.
- Horários: `businessHours` permanece `null` e não é exibido.
- Depoimentos reais: seção e carrossel preparados, dados vazios e seção pública oculta. Para publicá-los, preencher avaliações confirmadas e incluir o link da seção no menu.
- Splash: texto do catálogo informa 10 ml, mas a embalagem fotografada indica 50 ml. A divergência aparece no catálogo e na revisão; confirmar com a empresa antes de alterar a apresentação.

Todos os arquivos da logo e dos banners fornecidos foram preservados byte a byte. Serviços usam imagens ilustrativas geradas; produtos usam fotografias do catálogo, sem recriação por IA. Fontes locais e licenças são preservadas. Veja `ASSETS.md` e `QA.md`.
