/**
 * Configurações centrais do Torino Online.
 * Única fonte de constantes ajustáveis (fase 1 mock -> fase 2 backend).
 */
export const CONFIG = Object.freeze({
  NOME_LOJA: "Torino Online",
  SLOGAN_HERO: "Hambúrguer na chapa, do jeito Torino.",
  SUBTITULO_HERO: "Escolha, peça e acompanhe em minutos.",

  // Fase 1: "mock" (JSON + IndexedDB + localStorage). Fase 2: "api" (ex.: Supabase/REST).
  MODO_API: "mock",
  API_BASE_URL: "/api",
  ATRASO_MOCK_MS: 180,

  // Chaves de armazenamento local (nunca armazenar senhas)
  CHAVE_SESSAO: "torino.sessao",
  CHAVE_CARRINHO: "torino.carrinho",
  NOME_BANCO_IDB: "torino-online-db",
  VERSAO_BANCO_IDB: 1,

  // Regras financeiras e limites (valores em centavos - RN03)
  TAXA_ENTREGA_CENTAVOS: 600,
  QUANTIDADE_MIN_ITEM: 1,
  QUANTIDADE_MAX_ITEM: 20,
  PRECO_MIN_CENTAVOS: 100,
  PRECO_MAX_CENTAVOS: 999900,
  ITENS_POR_PAGINA: 8,
  ITENS_POR_PAGINA_ADMIN: 10,

  // Categorias do cardápio
  CATEGORIAS: [
    "Hambúrgueres",
    "Acompanhamentos",
    "Bebidas",
    "Sobremesas",
  ],

  // Fluxo de status dos pedidos (RN09)
  STATUS_PEDIDO: [
    "Recebido",
    "Em preparo",
    "Saiu para entrega",
    "Entregue",
    "Cancelado",
  ],

  ETAPAS_LINHA_TEMPO: [
    "Recebido",
    "Em preparo",
    "Saiu para entrega",
    "Entregue",
  ],

  // Transições permitidas: apenas próximo estado ou cancelar (de Recebido/Em preparo)
  TRANSICOES_STATUS: Object.freeze({
    Recebido: ["Em preparo", "Cancelado"],
    "Em preparo": ["Saiu para entrega", "Cancelado"],
    "Saiu para entrega": ["Entregue"],
    Entregue: [],
    Cancelado: [],
  }),

  // Modalidades de pagamento (RN10)
  MODALIDADES_PAGAMENTO: [
    {
      id: "Pix",
      rotulo: "Pix",
      descricao: "Aprovação imediata por código copia e cola.",
      icone: "pix",
    },
    {
      id: "Cartão",
      rotulo: "Cartão de crédito ou débito",
      descricao: "Pagamento seguro na confirmação do pedido.",
      icone: "cartao",
    },
    {
      id: "Dinheiro na entrega",
      rotulo: "Dinheiro na entrega",
      descricao: "Pague ao entregador ao receber a comanda.",
      icone: "dinheiro",
    },
  ],

  // Limites de validação de campos
  VALIDACAO: Object.freeze({
    NOME_MIN: 3,
    NOME_MAX: 80,
    SENHA_MIN: 6,
    DESCRICAO_MIN: 10,
    DESCRICAO_MAX: 240,
    IMAGEM_MAX_BYTES: 1024 * 1024, // 1 MB para prévia local
  }),

  // Credenciais de demonstração da fase 1 (apenas para teste local do mock)
  DEMO: Object.freeze({
    CLIENTE_EMAIL: "cliente@torino.com",
    CLIENTE_SENHA: "Torino@123",
    ADMIN_EMAIL: "admin@torino.com",
    ADMIN_SENHA: "Admin@123",
  }),
});
