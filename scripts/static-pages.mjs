import { mkdir, readFile, writeFile } from 'node:fs/promises';
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
for (const [route, title] of [['produtos', 'Produtos Garage One | Campina Grande–PB'], ['orcamento', 'Orçamento de produtos | Garage One']]) {
  const folder = new URL(`../dist/${route}/`, import.meta.url);
  await mkdir(folder, { recursive: true });
  let page = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  if (canonical) {
    const pageUrl = `${canonical}${route}/`;
    page = page.replace(/<link rel="canonical" href="[^"]+"/, `<link rel="canonical" href="${pageUrl}"`)
      .replace(/<meta property="og:url" content="[^"]+"/, `<meta property="og:url" content="${pageUrl}"`);
  }
  await writeFile(new URL('index.html', folder), page);
}
