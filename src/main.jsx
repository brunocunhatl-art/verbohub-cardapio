import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Check, ChevronRight, Gift, Minus, Plus, Search, ShoppingBag, Truck, WalletCards, X, Clock, Star, Flame, BadgeCheck } from 'lucide-react';
import { ADDONS, CATEGORIES, CUSCUZ_INCLUDED, CUSCUZ_PREMIUM_INCLUDED, flatMenu, money, IMAGE_BY_ID } from './menu';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
function uid(){ return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()); }

function useStoreStatus(){
  const [storeStatus,setStoreStatus]=useState({open:true,estimated_minutes:25,message:'Estamos recebendo pedidos normalmente.'});
  useEffect(()=>{
    let channel;
    async function load(){
      if(!supabase) return;
      const {data}=await supabase.from('store_settings').select('*').eq('id','main').maybeSingle();
      if(data) setStoreStatus({open:data.is_open !== false, estimated_minutes:data.estimated_minutes||25, message:data.message||''});
      channel=supabase.channel('store-settings-cardapio').on('postgres_changes',{event:'*',schema:'public',table:'store_settings'}, payload=>{
        const row=payload.new;
        if(row?.id==='main') setStoreStatus({open:row.is_open !== false, estimated_minutes:row.estimated_minutes||25, message:row.message||''});
      }).subscribe();
    }
    load();
    return()=>{ if(channel) supabase.removeChannel(channel); };
  },[]);
  return storeStatus;
}


function sameDayISOStart(){
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString();
}

function normalizeName(value){
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}

function matchMenuItemByName(name){
  const key = normalizeName(name);
  return flatMenu.find(p => normalizeName(p.name) === key) || flatMenu.find(p => key.includes(normalizeName(p.name)) || normalizeName(p.name).includes(key));
}



function imageForProduct(item){
  if(item?.image) return item.image;
  if(item?.id && IMAGE_BY_ID[item.id]) return IMAGE_BY_ID[item.id];
  const key = normalizeName(item?.name || '');
  const cat = normalizeName(item?.category || item?.category_name || '');
  const matched = matchMenuItemByName(item?.name);
  if(matched?.image) return matched.image;
  if(key.includes('egg') && key.includes('bacon')) return '/products/x-egg-bacon.jpg';
  if(key.includes('duplo') || key.includes('bbq')) return '/products/duplo-bacon-bbq.jpeg';
  if(key.includes('x tudo') || key.includes('xtudo')) return '/products/x-tudo.jpg';
  if(key.includes('x bacon') || (key.includes('bacon') && cat.includes('burger'))) return '/products/x-bacon.jpeg';
  if(key.includes('salada')) return '/products/x-salada.jpg';
  if(key.includes('x burger') || key.includes('x burguer') || cat.includes('burger')) return '/products/x-burguer.jpg';
  if(key.includes('cuscuz') && key.includes('premium')) return '/products/cuscuz-premium.png';
  if(key.includes('cuscuz')) return '/products/cuscuz-base.jpg';
  if(cat.includes('tapioca') && cat.includes('doce')){
    if(key.includes('nutella')) return '/products/tapioca-nutella.jpg';
    if(key.includes('leite') || key.includes('coco')) return '/products/tapioca-leite-condensado.jpg';
    if(key.includes('churros')) return '/products/tapioca-churros.jpeg';
    if(key.includes('romeu') || key.includes('julieta')) return '/products/tapioca-romeu-julieta.jpg';
  }
  if(cat.includes('tapioca')) return '/products/tapiocas-salgadas.jpeg';
  if(key.includes('coca') && key.includes('600')) return '/products/coca-cola-600ml.jpg';
  if(key.includes('coca') && key.includes('1l')) return '/products/coca-cola-1l.jpg';
  if(key.includes('agua')) return '/products/aguas.jpg';
  if(cat.includes('refrigerante') || key.includes('guarana') || key.includes('fanta')) return '/products/refrigerantes-lata.jpg';
  if(cat.includes('suco')) return '/products/sucos.jpeg';
  if(cat.includes('detox') || key.includes('detox')) return '/products/detox.jpeg';
  if(cat.includes('milk') || key.includes('milk')) return '/products/milkshakes.jpg';
  return '/logo-verbo-hub.png';
}

function categoryAddon(categoryId, categoryName){
  const id = normalizeName(categoryId || '');
  const name = normalizeName(categoryName || '');
  if(id.includes('burger') || name.includes('burger')) return 'burger';
  if(id.includes('cuscuz') || name.includes('cuscuz')) return 'cuscuz';
  if((id.includes('tapioca') || name.includes('tapioca')) && (id.includes('doce') || name.includes('doce'))) return 'sweet';
  if(id.includes('tapioca') || name.includes('tapioca')) return 'savory';
  return null;
}

function buildCategoriesFromMenuItems(rows){
  const byCat = new Map();
  (rows||[]).filter(r => r.active !== false).forEach((row, idx) => {
    const id = row.category_id || row.cat || normalizeName(row.category_name || row.category || 'cardapio').replaceAll(' ','-') || 'cardapio';
    const name = row.category_name || row.category || row.cat || 'Cardápio';
    if(!byCat.has(id)) byCat.set(id, { id, name, icon: row.icon || '🍽️', addons: row.addons ?? categoryAddon(id,name), items: [] });
    const cat = byCat.get(id);
    cat.items.push({
      id: String(row.id || row.name || idx),
      name: row.name || 'Produto',
      price: Number(row.price)||0,
      desc: row.description || row.desc || 'Produto Verbo Hub feito com carinho.',
      category: id,
      tags: Array.isArray(row.tags) ? row.tags : [],
      image: imageForProduct({ ...row, category:id, category_name:name })
    });
  });
  return [...byCat.values()].filter(c => c.items.length);
}

function useDynamicCategories(){
  const [categories,setCategories]=useState(CATEGORIES);
  useEffect(()=>{
    let channel;
    async function load(){
      if(!supabase){ setCategories(CATEGORIES); return; }
      const {data,error}=await supabase.from('menu_items').select('*').eq('active',true).order('sort_order',{ascending:true}).order('created_at',{ascending:true});
      if(error){ console.error('Erro ao carregar menu_items:', error); setCategories(CATEGORIES); return; }
      const built = buildCategoriesFromMenuItems(data||[]);
      setCategories(built.length ? built : CATEGORIES);
    }
    load();
    if(supabase){ channel=supabase.channel('menu-items-cardapio-public').on('postgres_changes',{event:'*',schema:'public',table:'menu_items'}, load).subscribe(); }
    return()=>{ if(channel) supabase.removeChannel(channel); };
  },[]);
  return categories;
}

function buildWhatsAppMessage({customer, cart, total, deliveryFee, discount, finalTotal, payment, changeFor, coupon}){
  const lines = [];
  lines.push('Olá, Verbo Hub! Acabei de fazer um pedido para entrega pelo cardápio digital.');
  lines.push('');
  lines.push(`Cliente: ${customer.name || 'Não informado'}`);
  if(customer.phone) lines.push(`Telefone: ${customer.phone}`);
  if(customer.address) lines.push(`Endereço: ${customer.address}`);
  if(customer.reference) lines.push(`Referência: ${customer.reference}`);
  lines.push('');
  lines.push('Pedido:');
  cart.forEach(item => {
    lines.push(`- ${Number(item.qty||1)}x ${item.name} — ${money(item.total)}`);
    if(item.included?.length) lines.push(`  Inclusos: ${item.included.join(', ')}`);
    if(item.addons?.length) lines.push(`  Extras: ${item.addons.map(a=>a.name).join(', ')}`);
    if(item.observation) lines.push(`  Obs: ${item.observation}`);
  });
  lines.push('');
  lines.push(`Subtotal: ${money(total)}`);
  if(discount>0) lines.push(`Desconto${coupon ? ' ('+coupon+')' : ''}: -${money(discount)}`);
  lines.push(`Entrega: ${deliveryFee ? money(deliveryFee) : 'a combinar'}`);
  lines.push(`Total: ${money(finalTotal)}`);
  lines.push(`Pagamento: ${payment}`);
  if(changeFor) lines.push(`Troco para: ${changeFor}`);
  lines.push('');
  lines.push('Pode confirmar meu pedido?');
  return lines.join('\n');
}

function useBestSellerToday(){
  const [best,setBest]=useState(null);
  useEffect(()=>{
    let channel;
    async function load(){
      if(!supabase) return;
      const {data,error}=await supabase.rpc('get_best_seller_today');
      if(error) return;
      const row = Array.isArray(data) ? data[0] : data;
      if(!row?.name) { setBest(null); return; }
      const matched = matchMenuItemByName(row.name) || flatMenu.find(p => p.id === row.item_id);
      setBest({ id: row.item_id || matched?.id, name: matched?.name || row.name, qty: Number(row.qty)||0, image: imageForProduct({id: row.item_id || matched?.id, name: matched?.name || row.name, category_name: matched?.category}) });
    }
    load();
    if(supabase){
      channel=supabase.channel('best-seller-cardapio').on('postgres_changes',{event:'INSERT',schema:'public',table:'orders'}, load).subscribe();
    }
    return()=>{ if(channel) supabase.removeChannel(channel); };
  },[]);
  return best;
}

function pickUpsell(cart){
  const ids=new Set(cart.map(i=>i.id));
  const hasSalgado=cart.some(i=>String(i.id).includes('tap-') || String(i.id).includes('x-') || String(i.id).includes('cuscuz'));
  const suggestions=['milk-chocolate','milk-choc-nutella','doce-nutella-morango','coca-lata','coca-600'].map(id=>flatMenu.find(p=>p.id===id)).filter(Boolean).filter(p=>!ids.has(p.id));
  return hasSalgado ? suggestions.slice(0,3) : suggestions.slice(0,2);
}

function App(){
  const [active,setActive]=useState(CATEGORIES[0].id);
  const [query,setQuery]=useState('');
  const [cart,setCart]=useState([]);
  const [custom,setCustom]=useState(null);
  const [toast,setToast]=useState('');
  const total = cart.reduce((s,i)=>s+i.total,0);
  const storeStatus = useStoreStatus();

  function addToCart(item){
    setCart(c=>[...c,item]);
    setToast('Item adicionado ao pedido 🧡');
    setTimeout(()=>setToast(''),1400);
  }

  return <>
    <header className="topbar">
      <button className="brand" aria-label="Verbo Hub">
        <img src="/logo-verbo-hub.png" alt="Verbo Hub" />
      </button>
      <div className="top-actions">
        <span className="ghost">Cardápio oficial</span>
      </div>
    </header>
    {toast && <div className="toast">{toast}</div>}
    <ClientMenu active={active} setActive={setActive} query={query} setQuery={setQuery} setCustom={setCustom} cart={cart} setCart={setCart} total={total} storeStatus={storeStatus}/>
    {custom && <CustomizeModal item={custom} close={()=>setCustom(null)} addToCart={addToCart}/>} 
  </>;
}

function ClientMenu({active,setActive,query,setQuery,setCustom,cart,setCart,total,storeStatus}){
  const categories = useDynamicCategories();
  const visible = useMemo(()=> categories.map(c=>({...c, items:c.items.filter(i=>(i.name+i.desc+c.name).toLowerCase().includes(query.toLowerCase()))})).filter(c=>c.items.length), [query,categories]);
  const bestSeller = useBestSellerToday();
  const heroFeatured = bestSeller || { name:'Duplo Bacon BBQ', qty:0, image:'/products/duplo-bacon-bbq.jpeg' };
  return <main className="client">
    <section className="hero hero-pro">
      <div className="hero-copy"><span className="kicker"><BadgeCheck size={16}/> Pedido online oficial</span><h1>Peça seu Verbo Hub</h1><p>Burgers, tapiocas, cuscuz e bebidas com preparo caprichado e pedido direto para a loja.</p><div className="hero-badges"><div className={storeStatus.open?'store-pill open':'store-pill closed'}><Clock size={16}/>{storeStatus.open ? `Aberto agora • ${storeStatus.estimated_minutes} min` : 'Loja fechada'}</div><span className="mini-pill">Retirada no local</span><span className="mini-pill">Pagamento na loja</span></div></div>
      <div className="hero-card hero-card-pro best-seller-card"><img src={heroFeatured.image} alt={heroFeatured.name}/><span className="shine">🔥 Mais pedido hoje</span><b>{heroFeatured.name}</b><small>{bestSeller ? `${bestSeller.qty} vendido${bestSeller.qty>1?'s':''} hoje` : 'Conheça alguns dos sabores favoritos do Verbo Hub.'}</small></div>
    </section>
    {!storeStatus.open && <div className="closed-banner"><b>Estamos fechados no momento.</b><span>{storeStatus.message || 'Você pode olhar o cardápio, mas a finalização está bloqueada.'}</span></div>}
    <div className="searchbar"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar burger, cuscuz, tapioca, suco..."/></div>
    <nav className="category-tabs">{categories.map(c=><a className={active===c.id?'on':''} href={'#'+c.id} onClick={()=>setActive(c.id)} key={c.id}><span>{c.icon}</span>{c.name}</a>)}</nav>
    <div className="grid">
      <section className="menu-list">{visible.map(cat=><Category key={cat.id} cat={cat} setCustom={setCustom}/>)}</section>
      <Checkout cart={cart} setCart={setCart} total={total} setCustom={setCustom} storeStatus={storeStatus}/>
    </div>
  </main>;
}

function ProductBadge({item}){
  const n = String(item.name || '').toLowerCase();
  if(n.includes('premium') || n.includes('duplo') || n.includes('x-tudo')) return <em className="badge-hot"><Flame size={12}/> Mais pedido</em>;
  if(n.includes('nutella') || n.includes('churros')) return <em className="badge-sweet"><Star size={12}/> Doce favorito</em>;
  return null;
}

function Category({cat,setCustom}){
  return <section className="category" id={cat.id}>
    <div className="cat-title"><span>{cat.icon}</span><div><h2>{cat.name}</h2><small>Escolha um item para personalizar</small></div></div>
    <div className="cards">{cat.items.map(item=><article className="product product-pro" key={item.id} onClick={()=>setCustom({...item, categoryConfig:cat})}>
      <div className="product-photo"><img src={item.image || '/logo-verbo-hub.png'} alt={item.name} loading="lazy"/></div>
      <div className="product-info"><div className="tag-row"><ProductBadge item={item}/>{item.tags?.map(t=><em key={t}>{t}</em>)}</div><h3>{item.name}</h3><p>{item.desc || 'Produto Verbo Hub feito com carinho.'}</p><b>{money(item.price)}</b></div>
      <button aria-label={`Adicionar ${item.name}`}><Plus size={18}/><span>Adicionar</span></button>
    </article>)}</div>
  </section>;
}

function CustomizeModal({item,close,addToCart}){
  const [qty,setQty]=useState(1);
  const [observation,setObservation]=useState('');
  const [selectedAddons,setSelectedAddons]=useState([]);
  const [included,setIncluded]=useState([]);
  const config = item.categoryConfig;
  const isPremiumCuscuz = item.id === 'cuscuz-premium';
  const isCuscuzBase = item.id === 'cuscuz-base';
  const hasAddons = !!config.addons && !isPremiumCuscuz;
  const isCuscuz = isCuscuzBase;
  const includedChoices = CUSCUZ_INCLUDED;
  const addonGroups = getAddonGroups(item, config);
  const addonsTotal = selectedAddons.reduce((s,a)=>s+a.price,0);
  const unitTotal = item.price + addonsTotal;
  const total = unitTotal * qty;

  function toggleAddon(addon){
    setSelectedAddons(list => list.some(a=>a.name===addon.name) ? list.filter(a=>a.name!==addon.name) : [...list, addon]);
  }
  function toggleIncluded(name){
    setIncluded(list => list.includes(name) ? list.filter(x=>x!==name) : (list.length >= 3 ? list : [...list,name]));
  }
  function confirm(){
    if(isCuscuz && included.length > 3) return alert('Escolha no máximo 3 adicionais inclusos para o cuscuz base.');
    const finalIncluded = isPremiumCuscuz ? CUSCUZ_PREMIUM_INCLUDED : included;
    addToCart({ uid:uid(), id:item.id, name:item.name, basePrice:item.price, qty, addons:selectedAddons, included:finalIncluded, observation, total });
    close();
  }

  return <div className="modal" role="dialog"><div className="sheet">
    <button className="close" onClick={close}><X/></button>
    {item.image && <img className="modal-product-image" src={item.image} alt={item.name}/>}<h2>{item.name}</h2><p className="desc">{item.desc}</p><strong className="price">{money(item.price)}</strong>
    {isPremiumCuscuz && <div className="no-addons"><b>Produto fechado.</b><br/>Acompanha carne seca, mussarela e queijo coalho. Não possui adicionais.</div>}
    {isCuscuz && <section className="custom-section"><h4>Escolha até 3 adicionais inclusos <small>{included.length}/3</small></h4><div className="chips">{includedChoices.map(x=><button className={included.includes(x)?'on':''} onClick={()=>toggleIncluded(x)} key={x}>{included.includes(x)&&<Check size={14}/>} {x}</button>)}</div><small className="hint">No cuscuz base, carne seca não entra como adicional incluso.</small></section>}
    {hasAddons && <section className="custom-section"><h4>Adicionais extras</h4>{addonGroups.map(g=><div key={g.title}><b className="group-title">{g.title}</b><div className="chips">{g.items.map(a=><button className={selectedAddons.some(x=>x.name===a.name)?'on':''} onClick={()=>toggleAddon(a)} key={a.name}>{selectedAddons.some(x=>x.name===a.name)&&<Check size={14}/>} {a.name} +{money(a.price)}</button>)}</div></div>)}</section>}
    {!hasAddons && !isPremiumCuscuz && <div className="no-addons">Sem adicionais para esta categoria. Você ainda pode colocar observações.</div>}
    <section className="custom-section"><h4>Observações</h4><textarea value={observation} onChange={e=>setObservation(e.target.value)} placeholder="Ex.: tirar tomate, maionese à parte, ponto da carne..."/></section>
    <div className="qty"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus/></button><span>{qty}</span><button onClick={()=>setQty(qty+1)}><Plus/></button></div>
    <button className="primary big" onClick={confirm}>Adicionar ao pedido • {money(total)}</button>
  </div></div>;
}

function getAddonGroups(item, config){
  if(config.addons === 'burger') return [{title:'Extras para burger', items:ADDONS.burger.map(([name,price])=>({name,price}))}];
  if(config.addons === 'savory') return [{title:'Extras salgados', items:ADDONS.savory.map(([name,price])=>({name,price}))}];
  if(config.addons === 'sweet') return [{title:'Extras doces', items:ADDONS.sweet.map(([name,price])=>({name,price}))}];
  if(item.id === 'cuscuz-premium') return [];
  if(config.addons === 'cuscuz') {
    const common = ADDONS.cuscuzCommon.map(([name,price])=>({name,price}));
    const premium = ADDONS.cuscuzPremium.map(([name,price])=>({name,price}));
    return [{title:'Comuns',items:common},{title:'Premium',items:premium}];
  }
  return [];
}


function normalizeCouponCode(value){ return String(value||'').trim().toUpperCase(); }

function useCoupons(){
  const [coupons,setCoupons]=useState([]);
  useEffect(()=>{
    let channel;
    async function load(){
      if(!supabase) return;
      const {data,error}=await supabase.from('coupons').select('*').eq('active',true).order('created_at',{ascending:false});
      if(!error) setCoupons(data||[]);
    }
    load();
    if(supabase){
      channel=supabase.channel('coupons-cardapio').on('postgres_changes',{event:'*',schema:'public',table:'coupons'}, load).subscribe();
    }
    return()=>{ if(channel) supabase.removeChannel(channel); };
  },[]);
  return coupons;
}

function Checkout({cart,setCart,total,setCustom,storeStatus}){
  const [customer,setCustomer]=useState({name:'',phone:'',address:'',reference:''});
  const [delivery,setDelivery]=useState('retirada');
  const [payment,setPayment]=useState('pix');
  const [changeFor,setChangeFor]=useState('');
  const [sending,setSending]=useState(false);
  const [couponCode,setCouponCode]=useState('');
  const [appliedCoupon,setAppliedCoupon]=useState(null);
  const [couponMessage,setCouponMessage]=useState('');
  const [collapsed,setCollapsed]=useState(false);
  const [lastOrder,setLastOrder]=useState(null);
  const coupons = useCoupons();
  const deliveryFee = delivery === 'entrega' ? 0 : 0;
  const discount = appliedCoupon ? Math.min(total + deliveryFee, ((total + deliveryFee) * (Number(appliedCoupon.percent)||0)) / 100) : 0;
  const finalTotal = Math.max(0, total + deliveryFee - discount);
  function applyCoupon(){
    const code = normalizeCouponCode(couponCode);
    if(!code){ setCouponMessage('Digite o nome do cupom.'); return; }
    const found = coupons.find(c=>normalizeCouponCode(c.code || c.name) === code && c.active !== false);
    if(!found){ setAppliedCoupon(null); setCouponMessage('Cupom não encontrado ou inativo.'); return; }
    setAppliedCoupon(found); setCouponCode(code); setCouponMessage(`Cupom aplicado: ${Number(found.percent)||0}% de desconto.`);
  }
  function clearCoupon(){ setAppliedCoupon(null); setCouponCode(''); setCouponMessage(''); }
  async function send(){
    if(!storeStatus.open) return alert('A loja está fechada no momento.');
    if(!cart.length) return alert('Seu pedido está vazio.');
    if(!customer.name || !customer.phone) return alert('Informe nome e WhatsApp.');
    if(delivery==='entrega' && !customer.address) return alert('Informe o endereço para entrega.');
    const coupon = appliedCoupon ? { id:appliedCoupon.id, code:appliedCoupon.code || appliedCoupon.name, percent:Number(appliedCoupon.percent)||0 } : null;
    const payload = { customer, items:cart, subtotal:total, delivery_fee:deliveryFee, discount, coupon, extra:0, total:finalTotal, payment_method:payment, change_for:changeFor, order_type:delivery, status:'novo', fiado:false, source:'verbo-hub-cardapio' };
    setSending(true);
    if(supabase){ const {error}=await supabase.from('orders').insert(payload); if(error){ alert('Erro ao salvar no Supabase: '+error.message); setSending(false); return; } }
    if(delivery === 'entrega'){
      const text = buildWhatsAppMessage({customer, cart, total, deliveryFee, discount, finalTotal, payment, changeFor, coupon: coupon?.code});
      const url = `https://wa.me/5567993248754?text=${encodeURIComponent(text)}`;
      window.location.href = url;
    }
    setCart([]); setAppliedCoupon(null); setCouponCode(''); setCouponMessage(''); setLastOrder({ total: finalTotal, name: customer.name, when: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }); setSending(false); setCollapsed(true);
  }
  if(collapsed) return <aside className="checkout collapsed success-card"><div className="success-icon">✓</div><h2>Pedido recebido!</h2><p>{lastOrder?.name ? `${lastOrder.name}, seu pedido foi enviado para a loja.` : 'Seu pedido foi enviado para a loja.'}</p><small>Horário: {lastOrder?.when || 'agora'} • Total: {money(lastOrder?.total || 0)}</small><button className="primary big" onClick={()=>setCollapsed(false)}><ShoppingBag/> Fazer novo pedido</button></aside>;
  return <aside className="checkout checkout-pro"><h2><ShoppingBag/> Seu pedido</h2>{cart.length===0 ? <p className="empty">Seu carrinho está esperando aquele pedido caprichado.</p> : cart.map(i=><div className="cart-item" key={i.uid}><div><b>{i.qty}x {i.name}</b>{i.included?.length>0 && <small>Inclusos: {i.included.join(', ')}</small>}{i.addons?.length>0 && <small>Extras: {i.addons.map(a=>a.name).join(', ')}</small>}{i.observation && <small>Obs.: {i.observation}</small>}<span>{money(i.total)}</span></div><button onClick={()=>setCart(c=>c.filter(x=>x.uid!==i.uid))}><X size={16}/></button></div>)}
    {cart.length>0 && <UpsellBox cart={cart} setCustom={setCustom}/>}
    <div className="form"><input placeholder="Nome" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/><input placeholder="WhatsApp" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/>
      <div className="choice"><button className={delivery==='retirada'?'on':''} onClick={()=>setDelivery('retirada')}><Store size={16}/> Retirada</button><button className={delivery==='entrega'?'on':''} onClick={()=>setDelivery('entrega')}><Truck size={16}/> Entrega</button></div>
      {delivery==='entrega' && <><input placeholder="Endereço completo" value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/><input placeholder="Ponto de referência" value={customer.reference} onChange={e=>setCustomer({...customer,reference:e.target.value})}/></>}
      <label>Cupom de desconto</label><div className="coupon-row"><input placeholder="Digite seu cupom" value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())}/><button type="button" onClick={applyCoupon}>Aplicar</button>{appliedCoupon&&<button type="button" className="ghost" onClick={clearCoupon}>Remover</button>}</div>{couponMessage&&<small className={appliedCoupon?'ok':'warn'}>{couponMessage}</small>}
      <label>Pagamento</label><div className="paygrid">{[['pix','Pix'],['dinheiro','Dinheiro'],['credito','Crédito'],['debito','Débito']].map(([id,label])=><button className={payment===id?'on':''} onClick={()=>setPayment(id)} key={id}><WalletCards size={16}/>{label}</button>)}</div>
      {payment==='dinheiro' && <input placeholder="Troco para quanto?" value={changeFor} onChange={e=>setChangeFor(e.target.value)}/>}<div className="summary"><span>Subtotal</span><b>{money(total)}</b><span>Entrega</span><b>{delivery==='entrega'?'Consultar':'Retirada'}</b>{discount>0&&<><span>Desconto {appliedCoupon?.code || appliedCoupon?.name}</span><b>-{money(discount)}</b></>}<strong>Total</strong><strong>{money(finalTotal)}</strong></div><button className="primary big" onClick={send} disabled={sending || !storeStatus.open}>{!storeStatus.open?'Loja fechada':(sending?'Enviando...':'Finalizar pedido')} <ChevronRight size={18}/></button></div></aside>;
}


function UpsellBox({cart,setCustom}){
  const items=pickUpsell(cart);
  if(!items.length) return null;
  return <section className="upsell-box"><h3><Gift size={18}/> Que tal colocar mais sabor no seu pedido?</h3><p>Combina muito com o que você escolheu:</p><div className="upsell-list">{items.map(p=><button key={p.id} onClick={()=>{ const cat=CATEGORIES.find(c=>c.items.some(i=>i.id===p.id)); setCustom({...p, categoryConfig:cat}); }}><img src={p.image || '/logo-verbo-hub.png'} alt={p.name}/><span>{p.name}</span><b>{money(p.price)}</b></button>)}</div></section>;
}


createRoot(document.getElementById('root')).render(<App/>);
