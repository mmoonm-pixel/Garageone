import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Check, Minus, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { categories, findSelection, products } from '../catalog';
import type { Product } from '../catalog';
import { useBudgetCart } from './BudgetCart';
import { useDragScroll, useReveal } from '../hooks';
import { whatsapp } from '../data';
import WhatsAppIcon from './WhatsAppIcon';

export function ProductCard({ product }: { product: Product }) {
  const id = useId();
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [added, setAdded] = useState(false);
  const variant = product.variants.find(item => item.id === variantId)!;
  const cart = useBudgetCart();
  return <article className="product-card" data-product-id={product.id}>
    <div className="product-photo">{variant.image ? <img src={variant.image} alt={`${product.name} — embalagem fotografada no catálogo Garage One`} width={600} height={600} loading="lazy" decoding="async" /> : <span className="product-image-pending">Imagem em atualização</span>}</div>
    <div className="product-content"><span className="product-category">{product.category}</span><h3>{product.name}</h3>
      {product.variants.length > 1 ? <><label className="sr-only" htmlFor={id}>Apresentação de {product.name}</label><select id={id} value={variantId} onChange={event => { setVariantId(event.target.value); setAdded(false); }}>{product.variants.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></> : <p className="product-presentation">{variant.label}</p>}
      {product.notes && <p className="product-notes">{product.notes}</p>}
      {variant.status === 'restock' ? <a className="btn fisheye-glass product-add" href={whatsapp(`Olá, equipe Garage One! Gostaria de consultar a reposição de ${product.name} — ${variant.label}.`)} target="_blank" rel="noopener noreferrer">Consultar reposição<WhatsAppIcon size={16} /></a> : <button type="button" className="btn fisheye-glass product-add" onClick={() => { cart.add(product.id, variant.id); setAdded(true); }}><span>{added ? 'Adicionar novamente' : 'Adicionar ao orçamento'}</span>{added ? <Check size={16} /> : <Plus size={16} />}</button>}
      <span className="sr-only" role="status">{added ? `${product.name}, ${variant.label}, adicionado ao orçamento.` : ''}</span>
    </div>
  </article>;
}
export function ProductsPreview() {
  const drag = useDragScroll();
  return <section id="produtos" className="section products-preview"><div className="container"><div className="section-heading" data-reveal><div className="eyebrow">O cuidado continua<span className="section-number">03</span></div><div className="section-heading-row"><h2>Nossos produtos</h2><p>O cuidado continua com os produtos certos. Conheça nossa seleção para limpeza, proteção e acabamento automotivo.</p></div></div></div>
    <div className="carousel-shell"><div {...drag} className="product-preview-carousel draggable" aria-label="Seleção de produtos do catálogo" tabIndex={0}>{products.filter(product => product.variants.some(variant => variant.image)).slice(0, 6).map(product => <ProductCard key={product.id} product={product} />)}</div></div>
    <div className="container product-preview-actions"><a className="btn fisheye-glass" href="/produtos/">Ver catálogo completo<ArrowRight size={17} /></a></div>
  </section>;
}
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function ProductCatalog() {
  useReveal();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const cart = useBudgetCart();
  const filtered = products.filter(product => (!category || product.category === category) && normalize(`${product.name} ${product.variants.map(variant => variant.label).join(' ')}`).includes(normalize(search.trim())));
  return <section className="section catalog-page container"><header className="catalog-heading" data-reveal><span className="eyebrow">Limpeza · proteção · acabamento</span><h1>Produtos Garage One</h1><p>Encontre os produtos para seu cuidado automotivo e monte uma seleção para orçamento.</p></header>
    <div className="catalog-toolbar"><label className="catalog-search"><Search size={18} /><span className="sr-only">Buscar produtos por nome</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar produto ou apresentação" /></label><label className="catalog-filter"><span className="sr-only">Filtrar por categoria</span><select value={category} onChange={event => setCategory(event.target.value)}><option value="">Todas as categorias</option>{categories.map(value => <option value={value} key={value}>{value}</option>)}</select></label><a className="btn fisheye-glass" href="/orcamento/"><ShoppingBag size={17} />Revisar seleção ({cart.count})</a></div>
    <p className="catalog-note">Consulte valores e disponibilidade com a equipe. As indicações de reposição são do catálogo consultado e não representam estoque em tempo real.</p>
    <p className="catalog-result-count" role="status">{filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</p>
    {filtered.length ? <div className="product-grid">{filtered.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="catalog-empty"><h2>Nenhum produto encontrado</h2><p>Experimente outro nome ou categoria.</p><button className="btn fisheye-glass" onClick={() => { setCategory(''); setSearch(''); }}>Limpar filtros</button></div>}
    {!cart.storageAvailable && <p role="status">Seu navegador não permitiu salvar a seleção. Mantenha esta página aberta enquanto prepara o orçamento.</p>}
  </section>;
}
export function BudgetReview() {
  useReveal();
  const cart = useBudgetCart();
  const [name, setName] = useState(() => { try { return sessionStorage.getItem('garage-budget-name') ?? ''; } catch { return ''; } });
  const [notes, setNotes] = useState(() => { try { return sessionStorage.getItem('garage-budget-notes') ?? ''; } catch { return ''; } });
  useEffect(() => { try { sessionStorage.setItem('garage-budget-name', name); sessionStorage.setItem('garage-budget-notes', notes); } catch { /* Input remains available when storage is blocked. */ } }, [name, notes]);
  const lines = cart.items.flatMap((item) => {
    const selection = findSelection(item.productId, item.variantId);
    return selection ? [`• ${item.quantity} × ${selection.product.name}${selection.variant.label && selection.variant.label !== 'Apresentação sob consulta' ? ` — ${selection.variant.label}` : ''}`] : [];
  });
  const message = [`Olá, equipe Garage One! Meu nome é ${name.trim()} e gostaria de solicitar um orçamento:`, '', ...lines, ...(notes.trim() ? ['', `Observações: ${notes.trim()}`] : []), '', 'Podem me informar os valores e a disponibilidade? Obrigado!'].join('\n');
  function validate(form: HTMLFormElement) {
    const input = form.elements.namedItem('customerName') as HTMLInputElement;
    if (!name.trim()) { input.setCustomValidity('Informe seu nome.'); input.reportValidity(); return false; }
    return cart.items.length > 0 && lines.length > 0 && form.reportValidity();
  }
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate(event.currentTarget)) return;
    window.location.assign(whatsapp(message));
  }
  return <section className="section budget-page container"><header className="catalog-heading" data-reveal><span className="eyebrow">Sua seleção</span><h1>Revisar orçamento</h1><p>Revise sua seleção. Nossa equipe informará os valores e a disponibilidade pelo WhatsApp.</p></header>
    {!cart.items.length ? <div className="catalog-empty"><ShoppingBag size={32} /><h2>Sua seleção está vazia</h2><p>Escolha os produtos e as apresentações que deseja consultar.</p><a className="btn fisheye-glass" href="/produtos/">Voltar ao catálogo<ArrowRight size={17} /></a></div> : <div className="budget-layout"><div className="budget-items">{cart.items.map(item => {
      const selection = findSelection(item.productId, item.variantId)!;
      return <article className="budget-item" key={`${item.productId}:${item.variantId}`}>
        <div className="budget-item-photo">{selection.variant.image && <img src={selection.variant.image} alt={`${selection.product.name} — embalagem fotografada no catálogo Garage One`} width={120} height={120} />}</div>
        <div className="budget-item-info"><h2>{selection.product.name}</h2><p>{selection.variant.label}</p>{selection.product.notes && <p className="product-notes">{selection.product.notes}</p>}<div className="quantity-control"><button type="button" className="fisheye-glass" disabled={item.quantity === 1} aria-label={`Diminuir quantidade de ${selection.product.name}, ${selection.variant.label}`} onClick={() => cart.update(item.productId, item.variantId, item.quantity - 1)}><Minus size={15} /></button><label className="sr-only" htmlFor={`quantity-${item.variantId}`}>Quantidade de {selection.product.name}, {selection.variant.label}</label><input id={`quantity-${item.variantId}`} type="number" inputMode="numeric" min={1} max={999} step={1} value={item.quantity} onChange={event => cart.update(item.productId, item.variantId, Number(event.target.value))} /><button type="button" className="fisheye-glass" disabled={item.quantity === 999} aria-label={`Aumentar quantidade de ${selection.product.name}, ${selection.variant.label}`} onClick={() => cart.update(item.productId, item.variantId, item.quantity + 1)}><Plus size={15} /></button></div></div>
        <button className="fisheye-glass budget-remove" type="button" aria-label={`Remover ${selection.product.name}, ${selection.variant.label}`} onClick={() => cart.remove(item.productId, item.variantId)}><Trash2 size={17} /></button>
      </article>;
    })}<a className="btn fisheye-glass" href="/produtos/">Continuar no catálogo<ArrowRight size={17} /></a></div>
    <form className="budget-form" onSubmit={send}><h2>Solicite seu orçamento</h2><p>Envie sua seleção e consulte valores e disponibilidade com nossa equipe.</p><div className="field"><label htmlFor="budget-customer-name">Seu nome *</label><input id="budget-customer-name" name="customerName" value={name} maxLength={100} autoComplete="name" required onChange={event => { setName(event.target.value); event.target.setCustomValidity(''); }} /></div><div className="field"><label htmlFor="budget-notes">Observações (opcional)</label><textarea id="budget-notes" value={notes} maxLength={2000} rows={4} onChange={event => setNotes(event.target.value)} /></div><button className="btn fisheye-glass" type="submit"><WhatsAppIcon size={18} />Solicitar orçamento pelo WhatsApp</button><p>O WhatsApp será aberto com a lista. Confirme o envio no aplicativo. Sua seleção continua salva.</p></form></div>}
  </section>;
}
