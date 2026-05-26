# VERBO HUB

Cardápio online em React/Vite para GitHub + Vercel, com visual estilo iFood/MyDino e integração com Supabase.

## O que tem nesta versão

- Nome ajustado para **VERBO HUB**.
- Menu separado por categorias.
- Logo na tela inicial.
- Cuscuz Base e Cuscuz Premium.
- Adicionais coerentes por tipo de produto.
- Bebidas, águas, refrigerantes, detox e milkshakes sem adicionais.
- Observações em todos os produtos.
- Pagamento completo: Pix, dinheiro, crédito e débito.
- Retirada ou entrega.
- Painel da loja escondido: toque/click 5 vezes na logo e digite o PIN `2026`.
- Pedido novo toca som até alguém clicar no painel.
- Tenta imprimir automaticamente o pedido novo e tem botão para imprimir manualmente.

## Rodar localmente

```bash
npm install
npm run dev
```

## Supabase

1. Crie um projeto no Supabase.
2. Rode o arquivo `supabase.sql` no SQL Editor.
3. Copie `.env.example` para `.env`.
4. Preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
VITE_STORE_WHATSAPP=5567999999999
```

Para sincronizar com o aplicativo anterior, use a mesma tabela `orders` ou ajuste o app antigo para ler/escrever nessa estrutura.

## Importante sobre impressão automática

Navegadores podem bloquear impressão automática e áudio até haver uma primeira interação na tela. Por isso o painel também tem botão de imprimir e o som para quando alguém clicar/tocar no painel.
