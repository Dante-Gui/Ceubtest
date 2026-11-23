# Plano de design e decisões — Torino Online

## Plano de design (conforme seção 5.1 do CLAUDE.md)

- **Conceito:** "Chapa quente, comanda na mão." Identidade direta de balcão de hamburgueria, sem cara de template genérico: contraste forte entre o topo Carvão, a superfície neutra Fumaça e a assinatura visual da **comanda** serrilhada apenas nos pontos de pedido (T05, T07, T08, T09, T16).
- **Paleta final:** Brasa `#B4361B` (ação principal/preço), Brasa escura `#8E2812` (hover), Mostarda `#F4B223` (selos e fita da comanda), Carvão `#1F1A17` (topo, hero e texto), Fumaça `#F3F1EE` (fundo), Papel `#FFFFFF` (cards, comanda e formulários), Pimenta `#6A5F58` (texto secundário ≥ 4.5:1), Alface `#2E7D4F` (sucesso), Tomate `#C0182B` (erro), Gema `#9A6200` (aviso).
- **Tipografia:** `Bricolage Grotesque` (700/800, `-0.02em`) para títulos e senha da comanda; `Figtree` (400/500/600/700, `tabular-nums` nos valores) para leitura, formulários e preços. Sentence case em toda a interface.
- **Formas e movimento:** Botões em pílula (`999px`), cards `18px` com borda fina (sem sombra cinza), campos `12px`, chips `10px` fixos ao rolar, comanda sem raio com borda inferior serrilhada. Entrada orquestrada apenas no hero (T01); feedback tátil ao adicionar ao carrinho e carimbos em T09.
- **Revisão contra genéricos:** Trocamos sombras repetidas em cards por borda nítida + foto 4:3 em destaque e restringimos o visual de notinha (comanda) às 5 telas de fluxo de pedido, evitando enfeites repetitivos.

```text
Wireframe T01 (Cardápio — 1280px / 390px)
+--------------------------------------------------------------+
| [Torino]               [Cardápio] [Meus pedidos] [Entrar] (2)|  <- Carvão
+--------------------------------------------------------------+
| Hambúrguer na chapa,                 +---------------------+ |
| do jeito Torino.                     |   [Foto/SVG Hero]   | |  <- Carvão
| Escolha, peça e acompanhe...         +---------------------+ |
| (Ver cardápio)                                               |
+--------------------------------------------------------------+
| [ Buscar hambúrguer, batata ou bebida...             ] (Go)  |  <- Fumaça
| [Todos] [Hambúrgueres] [Acompanhamentos] [Bebidas] [Doces]   |  <- sticky
+--------------------------------------------------------------+
| +------------+  +------------+  +------------+  +----------+ |
| | [Foto 4:3] |  | [Foto 4:3] |  | [Foto 4:3] |  | [Foto]   | |
| | Nome       |  | Nome       |  | Nome       |  | ...      | |
| | R$ 29,90   |  | R$ 38,50   |  | R$ 18,00   |  |          | |
| | (Adicionar)|  | (Adicionar)|  | (Adicionar)|  |          | |
| +------------+  +------------+  +------------+  +----------+ |
+--------------------------------------------------------------+
| [Mobile fixo: 2 itens · R$ 68,40          (Ver carrinho) ]   |
+--------------------------------------------------------------+
```

---

## Decisões registradas (seções 1 e 10 do CLAUDE.md)

1. **Fontes da verdade ausentes no repositório inicial:** Como o projeto foi criado do zero a partir do `CLAUDE.md` sem os arquivos PDF em `docs/`, todas as telas (T01–T17), mensagens exatas (seção 9), regras de validação e contratos foram modelados fielmente a partir do `CLAUDE.md`, centralizando constantes em `js/config.js` e textos em `js/mensagens.js`.
2. **Fluxo de status (RN09):** Adotado `Recebido -> Em preparo -> Saiu para entrega -> Entregue`, permitindo `Cancelado` a partir de `Recebido` ou `Em preparo`. Transições permitidas são configuradas em `CONFIG.TRANSICOES_STATUS` (`js/config.js`).
3. **Modalidades de pagamento (RN10):** Configuradas em `CONFIG.MODALIDADES_PAGAMENTO`: `Pix`, `Cartão` e `Dinheiro na entrega`. O pedido só passa para status pago após confirmação válida; em modo mock (fase 1), T08 permite testar os cenários de aprovação, recusa e indisponibilidade de forma controlada.
4. **Taxa de entrega (RN03):** Valor fixo configurável em `CONFIG.TAXA_ENTREGA_CENTAVOS = 600` (R$ 6,00), somado apenas por `carrinho.total()`.
5. **Pendência RN20:** Citada nos UC11, UC16, UC17 e UC19, mas não definida no documento base. Nenhuma regra própria foi inventada; fica registrada como pendência para alinhamento com o time.
6. **Ilustrações placeholder:** Enquanto fotos `.webp` reais não são fornecidas, os produtos e o hero usam ilustrações SVG artesanais 4:3 na paleta oficial (`assets/img/produtos/*.svg` e `assets/img/hero-burger.svg`), sem caixas cinzas.
7. **Persistência na Fase 1:** Sessão em `localStorage["torino.sessao"]` (sem senha), carrinho em `localStorage["torino.carrinho"]`, e catálogo/clientes/endereços/pedidos em `IndexedDB` (`torino-online-db`) populados a partir de `js/mock/*.json` via `js/nucleo/api.js`.
8. **Credenciais de demonstração (Fase 1 mock):** Cliente demo (`cliente@torino.com` / `Torino@123`) e Admin demo (`admin@torino.com` / `Admin@123`), configurados em `js/config.js` apenas para facilitar testes locais da fase 1.
