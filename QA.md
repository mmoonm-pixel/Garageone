# QA — Garage One

## Estabilidade do modal compartilhado — 2026-10-13

- Orçamento renderizado em portal no body e camada nativa fixa; fora dos carrosséis e do root transformado. Entrada somente por opacidade, sem animação de posição.
- Body fixado com posição de scroll salva e restauração exata; estilos anteriores e foco do botão de origem restaurados ao fechar. Fundo bloqueado durante a interação.
- Formulário em área interna rolável, com momentum touch e contenção de overscroll. Fechar permanece fixo fora da área rolável. Mobile ancorado no topo com margem/áreas seguras; mudanças do viewport atualizam apenas a altura disponível.
- Todos os 23 botões de carros/motos testados em 1440, 390 e 320 px, incluindo diferentes posições dos carrosséis: seleção correta, rolagem, troca de serviço, digitação, fechamento e restauração aprovados. Mensagem WhatsApp preservada.
- Redução do viewport emulada até 410 px: campo ativo visível, fechamento acessível e posição mobile estável, sem listeners de scroll para reposicionar. Não houve teste em teclado físico/Safari; validação Chromium com viewport emulado.
- Registro: `/tmp/garage-stable-modal-qa.json`. Build TypeScript/Vite aprovado. Demais componentes e assets não foram modificados.


## Finalização única do orçamento — 2026-10-13

- Somente um botão de ação na etapa de envio: Solicitar orçamento pelo WhatsApp, com ícone e vidro preservados.
- Removidos botão alternativo, aviso de fallback, cópia da lista e tentativa whatsapp://. A ação usa o mesmo destino HTTPS wa.me e a mesma aba do antigo link funcional.
- Valida nome e seleção. Mensagem exata com nome, todos os produtos, quantidades/apresentações atuais e observações somente quando preenchidas; encodeURIComponent aplicado uma vez.
- Fluxo verificado em Chromium desktop e mobile emulado: dois produtos distintos, alteração de quantidade, acentos, porcentagem, &, notas preenchidas/vazias, persistência ao retornar. Destino externo interceptado para conferir o URL completo; nenhuma mensagem enviada.
- Catálogo e demais componentes preservados. Build aprovado. Registro: `/tmp/garage-single-budget-qa.json`.


## Correções de hero, cards e WhatsApp — 2026-10-13

- Hero mobile sem caixa, borda ou fundo glass em torno do título/botões; o vidro dos botões permanece. Desktop e vídeo institucional preservados.
- Faixa reta, separadores | verticais, conteúdo e animação mantidos. Sem overflow em 1440, 768, 390 e 320 px.
- Quinze serviços para carros com ao menos três detalhes extraídos dos dados e catálogo real. Oito serviços para motos exibem apenas escopo confirmado; três inclusões ainda dependem do detalhamento da empresa, ausente na página 16 do catálogo.
- Altura dos cards ajustada; todos os painéis cabem, botão abaixo da lista e alinhado na base. Texto + seta centralizados; deslocamento medido menor que 0,01 px. Os 23 botões abrem o modal com o serviço correto.
- WhatsApp mobile usa whatsapp://send, de forma síncrona. Sem window.open/target _blank na tentativa mobile, sem timer ou redirecionamento automático. Fallback HTTPS manual, também validado. Mensagem, nome, observações e carrinho preservados; notas vazias omitidas.
- Testes desktop, protocolo recusado e mobile emulado aprovados; tentativa de URI registrada e fallback/conservação dos campos testados com interceptação do protocolo no navegador. Chromium headless sem handler de WhatsApp não consegue abrir o app; nenhum teste em celular físico foi possível. Não se afirma que o aplicativo instalado abriu.
- Catálogo com 131 produtos, mapa/rotas, menu, dados comerciais e todos os arquivos públicos preservados. Build aprovado.

Registros locais: `/tmp/garage-fix-qa.json`, `/tmp/garage-fix-motion.json`; scripts de handoff e emulação em `/tmp/garage-fix-mobile-whatsapp.cjs`.

## Ajustes pontuais — 2026-10-13

- Build TypeScript/Vite e diff sem erros. Testes Chromium em 1440, 768, 390 e 320 px: nenhum erro JavaScript ou overflow horizontal.
- Hero desktop preservado; vídeo mobile mudo, autoplay, loop e inline, com card glass inferior. Vídeo institucional mantido e banner avulso removido. Preferência reduzida usa poster estático.
- Todos os 23 cards de carros/motos têm somente Orçamento com seta, centralização verificada e pré-seleção correta no modal. Textos e fotografias preservados.
- Pontos finais dos títulos/chamadas ficam laranja; dados técnicos não foram alterados. Marquee mantém conteúdo e movimento, com inclinação e cobertura lateral sem overflow.
- Revisão exige nome válido e carrinho; mensagem conferida com acentos, quantidades e duas apresentações distintas do mesmo produto. Observações omitidas quando vazias; cópia integral e persistência do carrinho aprovadas.
- Quatro cenários do helper WhatsApp aprovados: desktop HTTPS, tentativa mobile URI com fallback, cancelamento quando o aplicativo oculta a página e fallback se a URI falhar. Nenhuma mensagem enviada; abertura em aplicativo físico não foi testada e depende do navegador/sistema.
- Rota em modal somente com origem e Ver rota; nenhuma abertura externa automática. Traçado progressivo, enquadramento, permanência no mapa principal e links externos após cálculo aprovados com fixtures. Photon/OSRM também consultados ao vivo: rota real da rodoviária à Garage One retornou 68 pontos, 2839,1 m e 344,3 s. Não há dependência de chave pendente; serviços públicos dependem de disponibilidade e não incluem trânsito em tempo real.
- 205 arquivos públicos preservados byte a byte. Catálogo, dados, carrinho, menu, logo, hero desktop, vidro e fundo global preservados. Fotografias de produtos e vídeos não foram alterados.

Registros: `/tmp/garage-adjust-qa.json`, `/tmp/garage-adjust-motion.json`, `/tmp/garage-adjust-live-route.json`. Limites: Chromium e celulares emulados; sem teste físico em Safari/Firefox. Tiles e respostas no navegador usaram fixtures locais; consulta real ao provedor realizada separadamente.

## Histórico da adaptação inicial


Revisão de 2026-10-13. Adaptação da estrutura existente, sem reconstrução em outra stack.

- Build TypeScript/Vite aprovado. As páginas inicial, `/produtos/` e `/orcamento/` foram abertas diretamente em Chromium em 1440, 390 e 320 px; sem overflow ou erros JavaScript.
- Logo e dois banners conferidos byte a byte contra os originais recuperados do ImgBB. PNG transparente da logo, troca responsiva correta e proporção integral do hero; sem frases adicionais sobre a imagem. SVG completo do menu idêntico ao anterior.
- Todos os 15 serviços para carros e oito para motos foram testados, com pré-seleção correta nos 23 formulários. Quatro opções de películas em detalhes, com percentuais identificados como informações do catálogo. Campos obrigatórios, espaços em branco, acentos/quebras de linha, mensagem opcional omitida quando vazia, Escape e retorno do foco aprovados.
- Catálogo com 131 produtos/142 apresentações e fotografias reais locais. Busca, estado sem resultados, limpeza, categorias, variações, adição repetida, contador, reposição bloqueada e revisão de quantidades aprovados. Os cinco itens de reposição não entram normalmente no carrinho.
- Seleção mantida entre páginas e após atualização. Duas apresentações do mesmo produto permanecem distintas, adições repetidas são somadas. Nome/observações e lista WhatsApp completos, sem preço/total monetário, envio automático ou limpeza ao abrir o aplicativo. Remoção até estado vazio aprovada.
- Seleção extensa testada com todas as 137 apresentações disponíveis para orçamento: cópia integral e texto do WhatsApp idênticos, 137 linhas preservadas. JSON inválido no armazenamento recuperado sem erros. Preferência reduzida mantém movimento parado e poster sem carregar vídeo.
- Animação global contínua, hero e oito itens do marquee em movimento, vídeo institucional tocando mudo/inline e controles ausentes aprovados em desktop/mobile. Vidro transparente, formatos e posicionamento do WhatsApp preservados. Menu interno funciona ao voltar das páginas de produtos/orçamento.
- Marcador automotivo, popup e planejamento da rota em modal sobre a página aprovados em 1440/390/320 px. Altura da página inalterada, nenhum formulário abaixo do mapa, busca/seleção e percurso/instruções aprovados com fixtures; Escape fecha. Ponto real confirmado separadamente pelo link oficial da Garage One.
- Horários não fornecidos permanecem ausentes; depoimentos vazios e seção pública oculta. Campo de fotografia real da localização preparado. Divergência Splash 10 ml no texto/50 ml na foto indicada para confirmação.

Registros locais: `/tmp/garage-functional-qa.json`, `/tmp/garage-motion-storage-qa.json`, `/tmp/garage-catalog-extraction-report.json`, `/tmp/garage-service-assets-manifest.json`.

Limites: Chromium e celulares emulados, sem aparelhos físicos/Safari/Firefox. Nos testes de navegador, cartografia e rotas usaram fixtures locais, sem download automatizado de tiles OpenStreetMap. Nenhuma mensagem WhatsApp enviada. As rotas públicas não são serviço pago nem fornecem trânsito em tempo real. Catálogo consultado não é estoque em tempo real.
