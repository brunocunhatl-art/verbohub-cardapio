import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { BellRing, Check, ChevronRight, CreditCard, Minus, Plus, Printer, Search, ShoppingBag, Store, Truck, WalletCards, X } from 'lucide-react';
import { ADDONS, CATEGORIES, CUSCUZ_INCLUDED, CUSCUZ_PREMIUM_INCLUDED, money } from './menu';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const ADMIN_PIN = '2026';

function uid(){ return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()); }

function App(){
  const [view,setView]=useState('cliente');
  const [admin,setAdmin]=useState(false);
  const [secretClicks,setSecretClicks]=useState(0);
  const [active,setActive]=useState(CATEGORIES[0].id);
  const [query,setQuery]=useState('');
  const [cart,setCart]=useState([]);
  const [custom,setCustom]=useState(null);
  const [toast,setToast]=useState('');
  const total = cart.reduce((s,i)=>s+i.total,0);

  function openAdmin(){
    const next = secretClicks + 1;
    setSecretClicks(next);
    if(next >= 5){
      const pin = prompt('Área da loja');
      if(pin === ADMIN_PIN){ setAdmin(true); setView('loja'); }
      setSecretClicks(0);
    }
  }

  function addToCart(item){
    setCart(c=>[...c,item]);
    setToast('Item adicionado ao pedido 🧡');
    setTimeout(()=>setToast(''),1400);
  }

  return <>
    <header className="topbar">
      <button className="brand" onClick={openAdmin} aria-label="Verbo Hub">
        <img src="/logo-verbo-hub.png" alt="Verbo Hub" />
      </button>
      <div className="top-actions">
        <button className="ghost" onClick={()=>setView('cliente')}>Cardápio</button>
        <button className="adminBtn" onClick={()=>admin?setView('loja'):openAdmin()}><Store size={18}/> Loja</button>
      </div>
    </header>
    {toast && <div className="toast">{toast}</div>}
    {view === 'loja' && admin ? <AdminPanel/> : <ClientMenu active={active} setActive={setActive} query={query} setQuery={setQuery} setCustom={setCustom} cart={cart} setCart={setCart} total={total}/>} 
    {custom && <CustomizeModal item={custom} close={()=>setCustom(null)} addToCart={addToCart}/>} 
  </>;
}

function ClientMenu({active,setActive,query,setQuery,setCustom,cart,setCart,total}){
  const visible = useMemo(()=> CATEGORIES.map(c=>({...c, items:c.items.filter(i=>(i.name+i.desc+c.name).toLowerCase().includes(query.toLowerCase()))})).filter(c=>c.items.length), [query]);
  return <main className="client">
    <section className="hero">
      <div><span className="kicker">Boa comida • boas conexões • bons momentos</span><h1>VERBO HUB</h1><p>Burgers, cuscuz, tapiocas e bebidas com pedido simples, bonito e direto.</p></div>
      <div className="hero-card"><b>VERBO HUB</b><small>Escolha, personalize, coloque observação e finalize.</small></div>
    </section>
    <div className="searchbar"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar burger, cuscuz, tapioca, suco..."/></div>
    <nav className="category-tabs">{CATEGORIES.map(c=><a className={active===c.id?'on':''} href={'#'+c.id} onClick={()=>setActive(c.id)} key={c.id}><span>{c.icon}</span>{c.name}</a>)}</nav>
    <div className="grid">
      <section className="menu-list">{visible.map(cat=><Category key={cat.id} cat={cat} setCustom={setCustom}/>)}</section>
      <Checkout cart={cart} setCart={setCart} total={total}/>
    </div>
  </main>;
}

function Category({cat,setCustom}){
  return <section className="category" id={cat.id}>
    <div className="cat-title"><span>{cat.icon}</span><h2>{cat.name}</h2></div>
    <div className="cards">{cat.items.map(item=><article className="product" key={item.id} onClick={()=>setCustom({...item, categoryConfig:cat})}>
      <div className="product-info"><div>{item.tags?.map(t=><em key={t}>{t}</em>)}</div><h3>{item.name}</h3><p>{item.desc || 'Produto Verbo Hub feito com carinho.'}</p><b>{money(item.price)}</b></div>
      <button><Plus size={18}/></button>
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
    <h2>{item.name}</h2><p className="desc">{item.desc}</p><strong className="price">{money(item.price)}</strong>
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

function Checkout({cart,setCart,total}){
  const [customer,setCustomer]=useState({name:'',phone:'',address:'',reference:''});
  const [delivery,setDelivery]=useState('retirada');
  const [payment,setPayment]=useState('pix');
  const [changeFor,setChangeFor]=useState('');
  const [sending,setSending]=useState(false);
  const deliveryFee = delivery === 'entrega' ? 0 : 0;
  const finalTotal = total + deliveryFee;
  async function send(){
    if(!cart.length) return alert('Seu pedido está vazio.');
    if(!customer.name || !customer.phone) return alert('Informe nome e WhatsApp.');
    if(delivery==='entrega' && !customer.address) return alert('Informe o endereço para entrega.');
    const payload = { customer, items:cart, subtotal:total, delivery_fee:deliveryFee, total:finalTotal, payment_method:payment, change_for:changeFor, order_type:delivery, status:'novo', source:'verbo-hub-cardapio' };
    setSending(true);
    if(supabase){ const {error}=await supabase.from('orders').insert(payload); if(error){ alert('Erro ao salvar no Supabase: '+error.message); setSending(false); return; } }
    setCart([]); setSending(false); alert('Pedido enviado e sincronizado com o aplicativo da loja!');
  }
  return <aside className="checkout"><h2><ShoppingBag/> Pedido</h2>{cart.length===0 ? <p className="empty">Seu carrinho está esperando aquele pedido caprichado.</p> : cart.map(i=><div className="cart-item" key={i.uid}><div><b>{i.qty}x {i.name}</b>{i.included?.length>0 && <small>Inclusos: {i.included.join(', ')}</small>}{i.addons?.length>0 && <small>Extras: {i.addons.map(a=>a.name).join(', ')}</small>}{i.observation && <small>Obs.: {i.observation}</small>}<span>{money(i.total)}</span></div><button onClick={()=>setCart(c=>c.filter(x=>x.uid!==i.uid))}><X size={16}/></button></div>)}
    <div className="form"><input placeholder="Nome" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/><input placeholder="WhatsApp" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/>
      <div className="choice"><button className={delivery==='retirada'?'on':''} onClick={()=>setDelivery('retirada')}><Store size={16}/> Retirada</button><button className={delivery==='entrega'?'on':''} onClick={()=>setDelivery('entrega')}><Truck size={16}/> Entrega</button></div>
      {delivery==='entrega' && <><input placeholder="Endereço completo" value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/><input placeholder="Ponto de referência" value={customer.reference} onChange={e=>setCustomer({...customer,reference:e.target.value})}/></>}
      <label>Pagamento</label><div className="paygrid">{[['pix','Pix'],['dinheiro','Dinheiro'],['credito','Crédito'],['debito','Débito']].map(([id,label])=><button className={payment===id?'on':''} onClick={()=>setPayment(id)} key={id}><WalletCards size={16}/>{label}</button>)}</div>
      {payment==='dinheiro' && <input placeholder="Troco para quanto?" value={changeFor} onChange={e=>setChangeFor(e.target.value)}/>}<div className="summary"><span>Subtotal</span><b>{money(total)}</b><span>Entrega</span><b>{delivery==='entrega'?'Consultar':'Retirada'}</b><strong>Total</strong><strong>{money(finalTotal)}</strong></div><button className="primary big" onClick={send} disabled={sending}>{sending?'Enviando...':'Finalizar pedido'} <ChevronRight size={18}/></button></div></aside>;
}


function AdminPanel(){
  const [orders,setOrders]=useState([]);
  const [muted,setMuted]=useState(false);
  const lastSeen=useRef(null);
  const audioRef=useRef(null);

  async function load(){
    if(!supabase) return;
    const {data}=await supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(100);
    setOrders(data||[]);
  }
  function startAlarm(){
    setMuted(false);
    try { audioRef.current?.play(); } catch(e) {}
  }
  function stopAlarm(){
    setMuted(true);
    audioRef.current?.pause();
    if(audioRef.current) audioRef.current.currentTime = 0;
  }
  useEffect(()=>{ load(); if(!supabase) return; const ch=supabase.channel('orders-live').on('postgres_changes',{event:'INSERT',schema:'public',table:'orders'}, payload=>{ load(); if(lastSeen.current !== payload.new.id){ lastSeen.current = payload.new.id; startAlarm(); setTimeout(()=>printOrder(payload.new), 400); }}).on('postgres_changes',{event:'UPDATE',schema:'public',table:'orders'}, load).subscribe(); return()=>supabase.removeChannel(ch); },[]);
  async function updateStatus(id,status){ if(!supabase) return; await supabase.from('orders').update({status}).eq('id',id); load(); }
  return <main className="admin" onClick={stopAlarm} onKeyDown={stopAlarm} tabIndex="0"><audio ref={audioRef} src="/pedido.wav" loop></audio><section className="hero"><div><span className="kicker"><BellRing size={16}/> Painel da loja</span><h1>Pedidos Verbo Hub</h1><p>Quando chegar pedido novo, toca som até alguém clicar ou tocar no painel. Também tenta imprimir automaticamente.</p></div><button className="primary" onClick={()=>window.print()}><Printer size={18}/> Imprimir tela</button></section>{!supabase && <div className="warn">Configure o Supabase no arquivo .env para sincronizar com o app anterior.</div>}{!muted && <div className="alarm"><BellRing/> Pedido novo tocando — clique em qualquer lugar para parar.</div>}<div className="orders">{orders.map(o=><article className="order" key={o.id}><header><div><b>{o.customer?.name || 'Cliente'}</b><small>{new Date(o.created_at).toLocaleString('pt-BR')}</small></div><strong>{money(o.total)}</strong></header><p>{o.customer?.phone} • {o.order_type}{o.customer?.address ? ` • ${o.customer.address}` : ''}</p>{o.items?.map(i=><div className="line" key={i.uid||i.id}>• {i.qty || 1}x {i.name} — {money(i.total || i.price)}{i.observation ? <small>Obs.: {i.observation}</small> : null}</div>)}<div className="statuses">{['novo','preparando','pronto','entregue','cancelado'].map(s=><button key={s} className={(o.status||'novo')===s?'on':''} onClick={()=>updateStatus(o.id,s)}>{s}</button>)}</div><button className="ghost print-one" onClick={()=>printOrder(o)}><Printer size={16}/> Imprimir este pedido</button></article>)}</div></main>;
}

function printOrder(o){
  const html = `<html><head><title>Pedido Verbo Hub</title><style>body{font-family:monospace;padding:10px}.center{text-align:center}hr{border:0;border-top:1px dashed #000}.big{font-size:18px;font-weight:bold}</style></head><body><div class=center><b>VERBO HUB</b><br/>Burgers & Tapiocas</div><hr/><div class=big>Pedido: ${o.id || ''}</div><p>${new Date(o.created_at||Date.now()).toLocaleString('pt-BR')}</p><p>Cliente: ${o.customer?.name||''}<br/>Fone: ${o.customer?.phone||''}<br/>Tipo: ${o.order_type||''}<br/>${o.customer?.address?'Endereço: '+o.customer.address:''}</p><hr/>${(o.items||[]).map(i=>`<p><b>${i.qty||1}x ${i.name}</b><br/>${i.included?.length?'Inclusos: '+i.included.join(', ')+'<br/>':''}${i.addons?.length?'Extras: '+i.addons.map(a=>a.name).join(', ')+'<br/>':''}${i.observation?'Obs.: '+i.observation+'<br/>':''}${money(i.total||i.price)}</p>`).join('')}<hr/><p>Pagamento: ${o.payment_method||''}</p><div class=big>Total: ${money(o.total||0)}</div><script>window.print(); setTimeout(()=>window.close(),800)</script></body></html>`;
  const w = window.open('', '_blank', 'width=420,height=700');
  if(w){ w.document.write(html); w.document.close(); }
}

createRoot(document.getElementById('root')).render(<App/>);
