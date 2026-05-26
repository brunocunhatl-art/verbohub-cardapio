export const money = (n) => Number(n||0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const make = (category, arr) => arr.map(([id,name,price,desc,tags=[]]) => ({id,name,price,desc,category,tags}));

export const ADDONS = {
  burger: [
    ['Carne extra', 7], ['Queijo', 4], ['Mussarela', 5], ['Presunto', 5], ['Ovo', 4], ['Bacon', 5], ['Calabresa', 5], ['Molho BBQ', 3], ['Milho', 2], ['Ervilha', 2]
  ],
  savory: [
    ['Frango', 5], ['Carne', 5], ['Mussarela', 5], ['Presunto', 5], ['Ovo', 5], ['Bacon', 5], ['Requeijão', 5], ['Catupiry', 5], ['Rúcula', 5], ['Tomate', 3], ['Calabresa', 5], ['Queijo coalho', 8]
  ],
  sweet: [
    ['Nutella', 8], ['Morango', 8], ['Leite condensado', 5], ['Coco', 5], ['Doce de leite', 5], ['Banana', 5], ['Canela', 2], ['Goiabada', 5]
  ],
  cuscuzCommon: [['Frango',5],['Carne',5],['Mussarela',5],['Presunto',5],['Ovo',5],['Bacon',5],['Requeijão',5],['Catupiry',5],['Rúcula',5]],
  cuscuzPremium: []
};
export const CUSCUZ_INCLUDED = ['Frango','Carne','Mussarela','Presunto','Ovo','Bacon','Requeijão','Catupiry','Rúcula'];
export const CUSCUZ_PREMIUM_INCLUDED = ['Carne seca', 'Mussarela', 'Queijo coalho'];

export const CATEGORIES = [
  { id:'burgers', name:'Burgers', icon:'🍔', addons:'burger', items: make('burgers', [
    ['x-burguer','X-Burguer',21.90,'Pão, carne, queijo, alface, tomate e maionese.',['mais vendido']],
    ['x-salada','X-Salada',26.90,'Pão, carne, queijo, alface, tomate, milho, ervilha e maionese.'],
    ['x-bacon','X-Bacon',28.90,'Pão, carne, queijo, bacon e maionese.',['bacon']],
    ['x-egg-bacon','X-Egg Bacon',30.90,'Pão, carne, queijo, ovo, bacon e maionese.'],
    ['duplo-bacon-bbq','Duplo Bacon BBQ 🔥',35.90,'Pão, 2 carnes, queijo, bacon, molho BBQ e maionese.',['especial']],
    ['x-tudo','X-Tudo',37.90,'Pão, carne, queijo, presunto, ovo, bacon, alface, tomate, milho, ervilha e maionese.',['completão']],
  ])},
  { id:'cuscuz', name:'Cuscuz', icon:'🍲', addons:'cuscuz', items: make('cuscuz', [
    ['cuscuz-base','Cuscuz Base',24.90,'Escolha até 3 adicionais comuns inclusos. Extras comuns +R$5,00. Premium +R$8,00.'],
    ['cuscuz-premium','Cuscuz Premium',32.90,'Carne seca, mussarela e queijo coalho inclusos. Produto normal, sem adicionais.',['premium']],
  ])},
  { id:'tapiocas-salgadas', name:'Tapiocas Salgadas', icon:'🥟', addons:'savory', items: make('tapiocas-salgadas', [
    ['tap-frango-requeijao','Frango + Mussarela + Requeijão',25.90,'Tapioca salgada recheada.'],
    ['tap-frango-bacon','Frango + Presunto + Bacon + Requeijão',28.90,'Tapioca salgada recheada.'],
    ['tap-carne-calabresa','Carne + Calabresa + Tomate + Mussarela',28.90,'Tapioca salgada recheada.'],
    ['tap-carne-ovo','Carne + Ovo + Bacon + Requeijão',29.90,'Tapioca salgada recheada.'],
    ['tap-mussarela-bacon','Mussarela + Bacon + Requeijão',25.90,'Tapioca salgada recheada.'],
    ['tap-presunto-ovo','Presunto + Mussarela + Tomate + Ovo',26.90,'Tapioca salgada recheada.'],
    ['tap-completa','Completa (Frango + Tudo) 🔥',31.90,'A queridinha da casa.'],
    ['tap-banana-bacon','Banana + Bacon + Mussarela + Canela',25.90,'Agridoce especial da casa.'],
    ['tap-carne-seca','+ Mussarela + Queijo Coalho',37.90,'Tapioca premium.'],
  ])},
  { id:'tapiocas-doces', name:'Tapiocas Doces', icon:'🍫', addons:'sweet', items: make('tapiocas-doces', [
    ['doce-nutella-morango','Nutella com Morango',19.90,''],
    ['doce-leite-coco','Leite Condensado com Coco',19.90,''],
    ['doce-churros','Tapioca de Churros',19.90,'Doce de leite com canela e açúcar.'],
    ['doce-romeu','Romeu e Julieta',19.90,'Queijo com goiabada.'],
  ])},
  { id:'sucos', name:'Sucos Naturais', icon:'🥤', addons:null, items: make('sucos', [
    ['suco-limao','Limão',7.90,'Suco natural feito na hora.'],['suco-laranja','Laranja',8.90,'Suco natural feito na hora.'],['suco-abacaxi','Abacaxi',8.90,'Suco natural feito na hora.'],['suco-abacaxi-hortela','Abacaxi com Hortelã',9.90,'Suco natural feito na hora.'],
  ])},
  { id:'detox', name:'Detox', icon:'🌿', addons:null, items: make('detox', [
    ['detox-1','Detox 1',11.90,'Couve, limão e gengibre.'],['detox-2','Detox 2',11.90,'Abacaxi, hortelã e gengibre.'],
  ])},
  { id:'refrigerantes', name:'Refrigerantes e Água', icon:'🥫', addons:null, items: make('refrigerantes', [
    ['coca-lata','Coca-Cola Lata',6.50,''],['guarana-lata','Guaraná Lata',6.50,''],['fanta-lata','Fanta Lata',6.50,''],['coca-1l','Coca-Cola 1L',10.00,''],['guarana-1l','Guaraná 1L',10.00,''],['agua-gas','Água com Gás',4.50,''],['agua','Água Mineral',3.50,''],['coca-600','Coca-Cola 600ml',7.50,''],
  ])},
  { id:'milkshakes', name:'Milkshakes', icon:'🥛', addons:null, items: make('milkshakes', [
    ['milk-choc-nutella','Chocolate com Nutella',20.00,''],['milk-morango-nutella','Morango com Nutella',20.00,''],['milk-chocolate','Chocolate',18.00,''],['milk-morango','Morango',18.00,''],
  ])},
];

export const flatMenu = CATEGORIES.flatMap(c => c.items);
