# CLAUDE.md — Torino Online (front-end das telas)

Você é o desenvolvedor front-end e designer do **Torino Online**, o site de pedidos de uma hamburgueria. Sua missão: construir as 17 telas do MVP (T01–T17) em **HTML, CSS e JavaScript puro**, com um visual que dê fome, seja rápido de usar no celular e passe a sensação de uma hamburgueria de verdade, não de um template.

Responda e escreva textos de interface em **português do Brasil**.

---

## 1. Fontes da verdade

Leia antes de codar. Em caso de conflito, a ordem de prioridade é esta:

1. `docs/casos-de-uso.pdf` — HUs, UCs, fluxos básico/alternativo/exceção e **mensagens exatas**.
2. `docs/fluxo-de-telas.pdf` — inventário T01–T17, navegação, blocos, estados e API sugerida.
3. `docs/fluxo-front-end-e-validacoes.pdf` — fluxo de desenvolvimento, matriz de validação por tela e campo, RN no front-end e cenários de teste.
4. Issues do GitHub Projects (HU/UC) — escopo e critérios de aceite de cada entrega.
5. Este arquivo — direção de arte, convenções e processo.

Se algo estiver ambíguo ou faltando, **não invente em silêncio**: escolha a opção mais simples, deixe configurável em um único lugar (constante em `js/config.js`) e registre em `docs/decisoes.md`.

## 2. Stack e regras técnicas

- Somente **HTML5, CSS3 e JavaScript ES2020** (módulos `type="module"`). Sem frameworks, sem bundler, sem bibliotecas de UI.
- Fontes via Google Fonts com fallback (`display=swap`). Ícones em **SVG inline** (sprite em `assets/icons/sprite.svg`).
- O site é estático (HTML, CSS e JavaScript) e será publicado em GitHub Pages. Na **fase 1 não há servidor**: dados de exemplo em `js/mock/*.json`, sessão e carrinho em `localStorage` e pedidos em `IndexedDB`, sempre por `js/nucleo/api.js`. Na **fase 2** (sugestão) a mesma camada passa a falar com um serviço web com banco, como Supabase (PostgreSQL), trocando uma flag em `js/config.js`; nenhuma tela muda.
- `fetch` de JSON não funciona em `file://`. Rode sempre com servidor local (seção 12).
- Nunca use `innerHTML` com dados vindos do usuário ou da API sem escapar. Valide entradas no cliente (na fase 2 as mesmas regras são repetidas no servidor/banco).
- Mensagens de erro **nunca** expõem detalhes internos (stack, SQL, nomes de campo do banco). Use as mensagens exatas da seção 9.
- Senhas nunca são guardadas no navegador. Sessão mock: `localStorage["torino.sessao"] = { tipo: "cliente" | "admin", nome }`.
- Carrinho: `localStorage["torino.carrinho"]`. Sempre dentro de `try/catch` e com fallback para carrinho vazio.

## 3. Estrutura do repositório

```
torino-web/
├── index.html               T01 Cardápio (demais telas: um .html por tela)
├── admin/                   telas do administrador (T11–T17)
├── 404.html                 página "não encontrada"
├── servidor.js · iniciar.bat
│
├── css/
│   ├── tokens.css           ★ identidade visual (cores, fontes, medidas)
│   ├── base.css             reset e utilitários
│   ├── components.css       índice que importa css/componentes/*
│   ├── componentes/         um arquivo por componente
│   │   botao · campo · chips · card-produto · alerta-toast · estados · comanda
│   ├── cliente.css          layout do cliente (topo, hero, cardápio, rodapé)
│   └── admin.css            layout do painel (quando existir)
│
├── js/
│   ├── config.js            ★ tudo que é configurável
│   ├── mensagens.js         ★ textos exatos dos casos de uso
│   ├── mock/                ★ dados de exemplo (produtos.json…)
│   ├── nucleo/              motor compartilhado (raramente precisa mexer)
│   │   api · carrinho · sessao · layout · ui · formato · validacao
│   └── paginas/             um arquivo por tela (cardapio.js = T01…)
│
├── assets/
│   ├── icons/sprite.svg
│   └── img/  produtos/ · estados/ · hero-burger.svg · favicon.svg
│
└── docs/                    casos-de-uso.pdf · fluxo-de-telas.pdf ·
                             fluxo-front-end-e-validacoes.pdf · decisoes.md
```

Cada página HTML carrega `css/tokens.css`, `css/base.css`, `css/components.css` (que importa `css/componentes/*`) + `cliente.css` ou `admin.css`, e um único `js/paginas/<tela>.js` como módulo. Lógica compartilhada fica em `js/nucleo/` (incluindo `validacao.js`), nunca copiada entre páginas; `js/mensagens.js` e `js/config.js` são a fonte única de textos e configurações. Um arquivo CSS por componente.

## 4. Direção de arte

### 4.1 Conceito

**"Chapa quente, comanda na mão."** O visual nasce do universo da hamburgueria: fotos grandes e suculentas, tipografia gorda como cartaz de balcão, cores de brasa, mostarda e carvão, e a **comanda** (a notinha do pedido) como elemento de identidade. Gaste a ousadia em **um** lugar: a comanda. O resto é limpo, rápido e disciplinado.

Evite os atalhos de "site gerado": fundo creme com serifa e terracota, cards idênticos com a mesma sombra cinza, rótulos em caixa-alta espaçada acima de todo título, degradês decorativos, "→" em todo botão, tudo com o mesmo raio de borda.

### 4.2 Paleta (tokens em `css/tokens.css`)

| Nome | Hex | Uso |
|---|---|---|
| Brasa | `#B4361B` | Ação principal, preço em destaque, links |
| Brasa escura | `#8E2812` | Hover/pressed da ação principal |
| Mostarda | `#F4B223` | Acento: selo "mais pedido", destaque da comanda, foco decorativo |
| Carvão | `#1F1A17` | Cabeçalho do cliente, hero, texto principal |
| Fumaça | `#F3F1EE` | Fundo de página (cinza quente neutro, não creme) |
| Papel | `#FFFFFF` | Superfícies, comanda, formulários |
| Pimenta | `#6A5F58` | Texto secundário (contraste mínimo 4.5:1 sobre Papel e Fumaça) |
| Alface | `#2E7D4F` | Sucesso |
| Tomate | `#C0182B` | Erro (distinto da Brasa: erro sempre vem com ícone e texto) |
| Gema | `#9A6200` | Aviso |

Cores nunca carregam sozinhas o significado: acompanhe com ícone e texto.

```css
:root {
  --brasa:#B4361B; --brasa-escura:#8E2812; --mostarda:#F4B223; --carvao:#1F1A17;
  --fumaca:#F3F1EE; --papel:#fff; --pimenta:#6A5F58;
  --sucesso:#2E7D4F; --erro:#C0182B; --aviso:#9A6200;

  --fonte-titulo:"Bricolage Grotesque", "Arial Black", system-ui, sans-serif;
  --fonte-texto:"Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;

  --t-1:.8rem; --t0:1rem; --t1:1.25rem; --t2:1.563rem; --t3:1.953rem;
  --t-hero:clamp(2.4rem, 7vw + 1rem, 4.6rem);

  --e1:4px; --e2:8px; --e3:16px; --e4:24px; --e5:40px; --e6:64px;
  --raio-botao:999px; --raio-card:18px; --raio-campo:12px; --raio-chip:10px;
  --foco:0 0 0 3px #fff, 0 0 0 6px var(--carvao);
  --mov-rapido:140ms; --mov-medio:260ms; --curva:cubic-bezier(.2,.7,.2,1);
}
@media (prefers-reduced-motion: reduce){ :root{ --mov-rapido:0ms; --mov-medio:0ms; } }
```

### 4.3 Tipografia

- **Títulos:** Bricolage Grotesque, pesos 700 e 800, tracking levemente negativo (`-0.02em`). Os títulos são parte do design: grandes, densos, com entrelinha 1.05–1.15.
- **Texto e interface:** Figtree, pesos 400, 500 e 600. Entrelinha 1.5, linhas com no máximo ~70 caracteres.
- **Preços e números:** `font-variant-numeric: tabular-nums`, peso 700, sempre no formato `R$ 29,90` (use `Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"})` em `js/nucleo/formato.js`).
- Escala modular (tokens `--t-1` a `--t3`); só o hero usa `--t-hero`.
- **Sentence case** em toda a interface. Sem caixa-alta espaçada.

### 4.4 Layout e formas

- Mobile-first (base 360px); breakpoints 480, 768, 1024, 1280. Conteúdo do cliente com largura máxima de 1180px.
- Formas com função, não uma só forma para tudo: **botões em pílula**, **cards de produto 18px**, **campos 12px**, **chips 10px**, **comanda com borda serrilhada** (sem raio).
- Cards de produto separam-se do fundo por **borda fina e foto**, não por sombra. Sombra só em elementos que flutuam: barra do carrinho no celular, modal, menu aberto.
- Espaçamento generoso: seções com `--e6` no desktop e `--e5` no celular.

### 4.5 A comanda (assinatura visual)

Componente `.comanda`: papel branco, borda inferior em **serrilhado** (CSS com `linear-gradient` repetido em pseudo-elemento), título em Bricolage, linhas de item com pontilhado ligando nome ao preço, total em destaque com fita Mostarda, número do pedido como "senha" grande. Use-a em:

- **T05 Carrinho** — a comanda "ganha linhas" conforme itens entram.
- **T07 Finalização** — a comanda é o resumo a revisar.
- **T08 Pagamento** — resumo do valor.
- **T09 Acompanhamento** — a comanda com a **linha do tempo de status** (carimbos que acendem).
- **T16 Detalhes do pedido (admin)** — versão compacta para a cozinha.

Fora desses pontos, não repita o motivo (restrição é o que faz ela ser lembrada).

### 4.6 Imagens

- Produtos usam fotos reais em `assets/img/produtos/` (WebP, 4:3, ≤ 120 KB, `loading="lazy"`, `width`/`height` definidos, `alt` descritivo).
- Enquanto não houver fotos, **não use caixas cinzas**: crie ilustrações SVG de hambúrguer, batata e bebida em `assets/img/` com a paleta do projeto, para o cardápio nunca parecer vazio.
- Hero do cliente (T01): foto grande do hambúrguer principal sobre fundo Carvão; sem banco de imagens genérico.

### 4.7 Movimento

- **Um** momento orquestrado: a entrada do hero em T01 (título, foto e botão entram em sequência curta).
- Movimento que responde a ação do usuário é bem-vindo: ao tocar em **Adicionar**, o item "voa" até o ícone do carrinho e o contador pulsa uma vez; a comanda ganha uma linha; carimbos de status acendem em T09.
- Proibido: fade-in em todas as seções, hover animado em todo card, parallax.
- Respeite `prefers-reduced-motion` (tokens acima já zeram as durações). Nenhuma informação depende de animação.

### 4.8 Tom de voz (textos de interface)

- Frases curtas, verbos claros, voz ativa. Botão diz o que acontece: **Adicionar ao carrinho**, **Finalizar pedido**, **Confirmar pedido**, **Pagar agora**, **Salvar endereço**. A mesma ação mantém o mesmo nome em todo o fluxo (o toast depois de "Salvar endereço" é "Endereço salvo.").
- Estados vazios convidam a agir, não pedem desculpa: "Seu carrinho está vazio. Que tal começar pelo cardápio?" — mas a **mensagem exata** do UC aparece sempre, e o convite vem como texto de apoio.
- Erros dizem o que houve e o que fazer, sem culpar a pessoa e sem jargão.
- Copy sugerida do hero (pode ajustar): "Hambúrguer na chapa, do jeito Torino." / "Escolha, peça e acompanhe em minutos."

## 5. Processo obrigatório

1. **Plano de design (uma vez, antes de codar):** em até 25 linhas, registre em `docs/decisoes.md` a paleta final, as duas fontes e seus papéis, o conceito de layout (com um wireframe ASCII do T01) e os princípios. Revise contra o brief: se alguma parte for o que você faria para qualquer site de restaurante, troque e explique por quê.
2. **Fatia vertical primeiro:** construa **T01 (Cardápio)** completo (hero, busca, categorias, cards, rodapé, estados) e valide a identidade antes de replicar. Só então siga as ondas (seção 8).
3. **Para cada tela:** leia a HU/UC → monte HTML semântico → CSS → JS → teste todos os estados → tire screenshots (390px e 1280px) → abra PR.
4. **Autocrítica visual:** com Playwright ou o navegador, compare com a seção 4. Antes de entregar, remova um enfeite. Pergunte: "isso aparece em qualquer site de restaurante?"
5. **Não reescreva telas prontas** para "melhorar" sem pedido; ajuste com patches pequenos.

## 6. Componentes (em `css/componentes/` + `js/nucleo/ui.js`)

| Componente | Variações e estados |
|---|---|
| Botão | primário (Brasa), secundário (contorno Carvão), fantasma, perigo; desabilitado, carregando (spinner + texto), foco visível |
| Campo | rótulo sempre visível, ajuda, erro com ícone + texto, sucesso; `aria-invalid` e `aria-describedby` |
| Card de produto | foto 4:3, nome, descrição de 2 linhas, preço, botão Adicionar; selo "Mais pedido" em Mostarda; indisponível (foto em tons de cinza + aviso) |
| Chips de categoria | rolagem horizontal no celular, fixos ao rolar (sticky) |
| Alerta e toast | sucesso, erro, aviso, info; `role="status"` ou `role="alert"`, `aria-live` |
| Tabela admin | cabeçalho fixo, ordenação, paginação; no celular vira lista de cards |
| Modal | foco preso, `Esc` fecha, devolve o foco ao gatilho, fundo escurecido |
| Linha do tempo | etapas do pedido com carimbo; etapa atual em destaque, concluídas marcadas, futuras apagadas |
| Comanda | ver 4.5 |
| Estado vazio / erro / carregando | skeleton para listas; ilustração SVG simples + texto + ação |

## 7. Telas: especificação e destaque visual

Detalhes completos (blocos, elementos, estados, navegação) estão em `docs/fluxo-de-telas.pdf`. Abaixo, o essencial e o que torna cada tela atraente.

### Cliente

| ID | Arquivo | UC | Destaque visual e de usabilidade |
|---|---|---|---|
| T01 | `index.html` | UC01, UC02 | Hero escuro com foto grande e entrada orquestrada; busca grande; chips de categoria fixos; grade 1/2/3/4 colunas; barra do carrinho fixa no celular com total e botão **Ver carrinho** |
| T02 | `produto.html?id=` | UC03 | Foto em destaque, ingredientes como lista legível, seletor de quantidade grande, botão fixo no rodapé no celular; indisponível desabilita o botão e explica |
| T03 | `cadastro.html` | UC04 | Formulário curto em coluna única, validação ao sair do campo, força da senha discreta; ilustração lateral só no desktop |
| T04 | `login.html` | UC05 | Mesma estrutura de T03; erro genérico no topo do formulário; volta ao fluxo de origem após entrar |
| T05 | `carrinho.html` | UC06 | **Comanda** com itens, quantidade +/-, remover com desfazer; resumo de subtotal, taxa e total; estado vazio convidativo |
| T06 | `enderecos.html` | UC07 | Endereços como cartões selecionáveis (radio estilizado); formulário com busca de CEP opcional; salvar mantém o usuário no fluxo do pedido |
| T07 | `checkout.html` | UC08 | Comanda de revisão; endereço e itens com botão **Alterar**; botão **Confirmar pedido** bloqueia duplo clique |
| T08 | `pagamento.html?pedido=` | UC09 | Modalidades como opções grandes; resultado (aprovado, recusado, indisponível) com ícone e próxima ação clara |
| T09 | `pedido.html?id=` | UC10 | **Comanda com linha do tempo** e senha do pedido grande; botão Atualizar; acesso a pedido alheio mostra a mensagem exata |
| T10 | `meus-pedidos.html` | UC11 | Lista de pedidos com status em selo, valor e data; paginação; vazio com botão para o cardápio |

### Administrador

O painel é **mais sóbrio**: mesmos tokens e tipografia, sem comanda decorativa (exceto T16), foco em densidade e leitura rápida. Menu lateral no desktop; barra superior com menu recolhível no celular.

| ID | Arquivo | UC | Destaque |
|---|---|---|---|
| T11 | `admin/login.html` | UC12 | Tela simples em Carvão com formulário central; erro genérico |
| T12 | `admin/produtos.html` | UC13, UC15 | Tabela com miniatura, preço, status (ativo/inativo) e ações; busca; no celular vira cards |
| T13 | `admin/produto-form.html?id=` | UC13, UC14 | Formulário único para criar/editar; pré-visualização do card do cliente ao lado; envio de imagem com prévia |
| T14 | modal em `produtos.html` | UC15 | Confirmação com nome do produto e aviso de que o histórico é preservado; impedimento por histórico mostra a mensagem exata |
| T15 | `admin/pedidos.html` | UC16 | Filtro por status em chips com contadores; pedidos novos destacados; atualização manual (botão) |
| T16 | `admin/pedido.html?id=` | UC17, UC18 | Comanda compacta; seletor mostra **apenas** transições permitidas; confirmação com toast "Status atualizado." |
| T17 | `admin/historico.html` | UC19 | Tabela paginada com filtros de período e status |

## 8. Ordem de construção

1. **Onda 1:** `config.js`, `mensagens.js`, `nucleo/api.js` (+ mock), `nucleo/sessao.js`, `nucleo/validacao.js`, tokens/base/componentes → T11, T12, T13, T14, T01, T02, T03, T04.
2. **Onda 2:** `nucleo/carrinho.js` → T05, T06, T07.
3. **Onda 3:** T08, T09, T10, T15, T16, T17.

Cada tela é uma branch e um PR (seção 11). Não comece uma tela cujo anterior no fluxo ainda não esteja navegável.

## 9. Mensagens exatas (não altere o texto)

Mensagens marcadas *(sugerida)* não constam literalmente no documento original e podem ser refinadas, mas mantenha-as centralizadas em `js/mensagens.js`.

| UC | Tipo | Mensagem |
|---|---|---|
| UC01 | Info | Os produtos disponíveis são exibidos. |
| UC01 | Erro | Cardápio temporariamente indisponível. *(sugerida)* |
| UC02 | Erro | Nenhum produto encontrado. |
| UC02 | Erro | Informe um nome ou termo para pesquisar. |
| UC03 | Info | Detalhes do produto carregados. |
| UC03 | Erro | Este produto não está disponível. |
| UC04 | Sucesso | Cadastro realizado com sucesso. |
| UC04 | Erro | Verifique os campos informados. |
| UC04 | Erro | Já existe uma conta com esses dados. |
| UC05 | Sucesso | Login realizado. |
| UC05 | Erro | Não foi possível autenticar com os dados informados. |
| UC06 | Sucesso | Carrinho atualizado. |
| UC06 | Erro | O carrinho está vazio. |
| UC06 | Erro | O produto não está disponível. |
| UC07 | Sucesso | Endereço salvo. |
| UC07 | Erro | Preencha os campos obrigatórios do endereço. |
| UC08 | Sucesso | Pedido registrado. |
| UC08 | Erro | Revise os dados do pedido antes de confirmar. |
| UC08 | Erro | Não foi possível confirmar o pedido; revise os itens. |
| UC09 | Sucesso | Pagamento confirmado. |
| UC09 | Erro | Pagamento não aprovado. Tente outra modalidade. |
| UC09 | Erro | Não foi possível confirmar o pagamento. |
| UC10 | Info | Status do pedido exibido. |
| UC10 | Erro | Pedido não encontrado ou acesso não autorizado. |
| UC11 | Info | Histórico carregado. |
| UC11 | Info | Você ainda não possui pedidos. |
| UC11 | Erro | Não foi possível carregar o histórico. |
| UC12 | Sucesso | Acesso autorizado. |
| UC12 | Erro | Credenciais inválidas ou acesso não autorizado. |
| UC13 | Sucesso | Produto cadastrado. |
| UC13 | Erro | Verifique os dados do produto. |
| UC14 | Sucesso | Produto atualizado. |
| UC14 | Erro | Não foi possível atualizar o produto. |
| UC15 | Sucesso | Produto desativado. |
| UC15 | Erro | Não é possível excluir este produto por causa do histórico associado. |
| UC16 | Info | Pedidos carregados. |
| UC16 | Info | Não há pedidos para exibir. *(sugerida)* |
| UC17 | Info | Detalhes do pedido carregados. |
| UC17 | Erro | Pedido não encontrado. |
| UC18 | Sucesso | Status atualizado. |
| UC18 | Erro | A alteração de status não é permitida. |
| UC19 | Info | Histórico carregado. |
| UC19 | Info | Não há registros para exibir. *(sugerida)* |

### Regras de validação (resumo)

A matriz completa por tela e campo, as RN no front-end e os cenários de teste estão em `docs/fluxo-front-end-e-validacoes.pdf`. Em toda tela:

- Validadores em `js/nucleo/validacao.js` (`obrigatorio`, `email`, `telefoneBR`, `senha`, `cep`, `precoCentavos`, `inteiroEntre`, `opcaoDe`…); cada tela declara um **esquema** de campos e regras, sem regra de negócio dentro de `js/paginas/`.
- Fluxo ao enviar: sessão (RN07/RN08) → normalizar (trim, máscara, vírgula) → validar campos → regras de negócio → gravar tudo ou nada → mensagem de sucesso do UC.
- Validar ao sair do campo e no envio; depois do primeiro erro, revalidar ao digitar. Erro junto ao campo (ícone + texto, `aria-invalid`, `aria-describedby`), resumo no topo com a **mensagem do UC** (`aria-live`) e foco no primeiro campo inválido.
- Bloquear duplo envio. Falha nunca grava parcialmente.
- Dinheiro em **centavos** (inteiros); total só por `carrinho.total()` (RN03). Ao confirmar o pedido, revalidar preço e disponibilidade (RN12) e gravar cópia de itens e preços (RN06).
- Login e acesso: mensagem genérica, sem revelar qual dado falhou (RNF06). Exibir dados do usuário com `textContent`.
- Limites, textos de campo e fluxo de status são **sugestões**, ajustáveis em `js/config.js` e `js/mensagens.js`.
- Na fase 1 as validações melhoram a experiência e sustentam a demonstração; não são segurança. Segurança real vem na fase 2.

## 10. Dados, API e decisões em aberto

### Contratos (sugestão para a fase 2; na fase 1 são atendidos por `js/nucleo/api.js` com mock)

| Uso | Método e rota |
|---|---|
| Produtos (cliente) | `GET /api/produtos?busca=&categoria=` · `GET /api/produtos/{id}` |
| Cadastro e login | `POST /api/clientes` · `POST /api/auth/login` |
| Endereços | `GET /api/enderecos` · `POST /api/enderecos` |
| Pedido e pagamento | `POST /api/pedidos` · `POST /api/pedidos/{id}/pagamento` |
| Pedidos do cliente | `GET /api/pedidos` · `GET /api/pedidos/{id}` |
| Login admin | `POST /api/admin/auth/login` |
| Produtos (admin) | `GET/POST /api/admin/produtos` · `PUT /api/admin/produtos/{id}` · `PATCH /api/admin/produtos/{id}/desativar` |
| Pedidos (admin) | `GET /api/admin/pedidos?status=` · `GET /api/admin/pedidos/{id}` · `PATCH /api/admin/pedidos/{id}/status` · `GET /api/admin/pedidos/historico` |

Todas as chamadas passam por `js/nucleo/api.js`, que trata erros e devolve mensagens da seção 9 (nunca o erro bruto). Valores são **recalculados e revalidados em `js/nucleo/`** (RN03, RN12) e, na fase 2, também pelo servidor/banco; a tela só exibe.

### Mock inicial (`js/mock/produtos.json`)

```json
[
  { "id": 1, "nome": "Torino clássico", "descricao": "Blend 160 g, queijo prato, alface, tomate e molho da casa.",
    "ingredientes": ["pão brioche", "blend bovino 160 g", "queijo prato", "alface", "tomate", "molho da casa"],
    "preco": 29.9, "categoria": "Hambúrgueres", "imagem": "assets/img/produtos/classico.webp", "ativo": true, "maisPedido": true },
  { "id": 2, "nome": "Brasa dupla", "descricao": "Dois blends, cheddar, cebola caramelizada e bacon.",
    "ingredientes": ["pão brioche", "2 blends 120 g", "cheddar", "cebola caramelizada", "bacon"],
    "preco": 38.5, "categoria": "Hambúrgueres", "imagem": "assets/img/produtos/brasa-dupla.webp", "ativo": true, "maisPedido": false },
  { "id": 3, "nome": "Batata rústica", "descricao": "Porção para dividir, com páprica e alecrim.",
    "ingredientes": ["batata", "páprica", "alecrim"],
    "preco": 18.0, "categoria": "Acompanhamentos", "imagem": "assets/img/produtos/batata.webp", "ativo": true, "maisPedido": false }
]
```

Os nomes e preços acima são só de exemplo.

### Decisões em aberto (centralize em `js/config.js` e anote em `docs/decisoes.md`)

- **Fluxo de status (RN09):** o documento diz "definido pela hamburgueria". Sugestão: `Recebido → Em preparo → Saiu para entrega → Entregue`, com `Cancelado` a partir de Recebido e Em preparo. Transições só para o próximo estado (ou cancelar).
- **Modalidades de pagamento (RN10):** sugestão inicial `Pix`, `Cartão` e `Dinheiro na entrega`; só marque como pago após confirmação válida.
- **Taxa de entrega (RN03):** valor fixo mock (ex.: R$ 6,00) vindo da config.
- **RN20:** citada nos UC11, UC16, UC17 e UC19, mas não definida no documento. Não implemente regra própria; registre a pendência.
- **Campos de cadastro/endereço/produto:** o documento diz apenas "dados obrigatórios". Sugestão está em `docs/fluxo-de-telas.pdf`.

## 11. Git e entrega

- Branch: `feat/T01-cardapio` (padrão `feat|fix|docs/<ID>-<nome>`).
- Commits pequenos e convencionais: `feat(T01): cria tela de cardápio (HU01, UC01)`.
- PR: título `[T01] Cardápio`; corpo com `Closes #<issue da HU>`, prints (390px e 1280px) e o checklist da seção 13 marcado.
- Nunca faça commit de segredos, chaves de API ou dados reais de clientes.
- Depois do merge, a tela pode ser pré-visualizada em GitHub Pages.

## 12. Comandos úteis

```bash
node servidor.js                     # servidor local (ou duplo clique em iniciar.bat)
# PORTA = porta exibida pelo servidor
npx playwright screenshot --viewport-size=390,844  http://localhost:PORTA/index.html docs/prints/t01-mobile.png
npx playwright screenshot --viewport-size=1280,800 http://localhost:PORTA/index.html docs/prints/t01-desktop.png
npx lighthouse http://localhost:PORTA/index.html --only-categories=accessibility,performance --view
```

Meta de qualidade por página: Lighthouse acessibilidade ≥ 95 e desempenho ≥ 90 no celular simulado.

## 13. Checklist de aceite (por tela)

- [ ] Layout fiel à seção 7 e ao esqueleto de `docs/fluxo-de-telas.pdf`, em 390px e 1280px.
- [ ] Todos os estados: carregando, lista, vazio, erro e sucesso.
- [ ] Mensagens idênticas às da seção 9, sem detalhes internos.
- [ ] Validações conforme a matriz de `docs/fluxo-front-end-e-validacoes.pdf` (campos, RN, estados e foco no erro).
- [ ] Navegação conforme o mapa; rotas protegidas redirecionam ao login e voltam ao fluxo.
- [ ] Formulários validam, mostram erro por campo e bloqueiam duplo envio.
- [ ] Acessibilidade: HTML semântico, rótulos, foco visível, contraste ≥ 4.5:1, teclado completo, `aria-live` nas mensagens, alvos de toque ≥ 44px.
- [ ] `prefers-reduced-motion` respeitado; nada depende de animação.
- [ ] Imagens otimizadas com `alt`, `width`, `height` e `loading="lazy"`.
- [ ] Nenhum `console.error`, nenhuma dependência externa além das fontes.
- [ ] Identidade: usa tokens (sem cores soltas), a comanda só onde previsto, nenhum "tell" da seção 4.1.
- [ ] PR aberto com prints e `Closes #N`.

## 14. Não faça

- Não introduza frameworks, jQuery, Tailwind ou bibliotecas de componentes.
- Não use cores, tamanhos ou raios fora dos tokens.
- Não altere o texto das mensagens exatas nem acrescente mensagens que revelem detalhes internos.
- Não coloque lógica de preço/total como fonte da verdade no cliente.
- Não crie telas, rotas ou funcionalidades fora do MVP (sem cupons, avaliações, fidelidade, rastreamento do entregador em tempo real ou relatórios avançados).
- Não peça confirmação para decisões pequenas: escolha a mais simples, registre em `docs/decisoes.md` e siga.

## 15. Como me pedir uma tela

Exemplos de instruções que o time pode dar:

- "Faça o plano de design e a fatia vertical da **T01**."
- "Construa a **T05 Carrinho** conforme o CLAUDE.md e abra o PR."
- "Revise a **T09** contra o checklist da seção 13 e liste o que falta."
- "Gere as ilustrações SVG de placeholder de hambúrguer, batata e bebida."