import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import { normalizarTexto, reaisParaCentavos, resolverCaminho, soDigitos } from "./formato.js";
import { obterSessao } from "./sessao.js";

/**
 * Camada única de acesso a dados (Fase 1: JSON mock + IndexedDB).
 * Na Fase 2, basta alternar CONFIG.MODO_API para "api" sem alterar nenhuma tela.
 */

const STORES = ["produtos", "clientes", "enderecos", "pedidos"];
let promessaDb = null;
let memoriaFallback = null;

function esperarMock() {
  return new Promise((resolve) => setTimeout(resolve, CONFIG.ATRASO_MOCK_MS));
}

function normalizarProduto(p) {
  const precoCentavos = Number.isInteger(p.precoCentavos)
    ? p.precoCentavos
    : reaisParaCentavos(p.preco);
  return {
    id: Number(p.id),
    nome: String(p.nome || ""),
    descricao: String(p.descricao || ""),
    ingredientes: Array.isArray(p.ingredientes) ? p.ingredientes.map(String) : [],
    preco: precoCentavos / 100,
    precoCentavos,
    categoria: String(p.categoria || CONFIG.CATEGORIAS[0]),
    imagem: String(p.imagem || "assets/img/produtos/classico.svg"),
    ativo: p.ativo !== false,
    maisPedido: Boolean(p.maisPedido),
  };
}

async function carregarJsonMock(arquivo) {
  const resposta = await fetch(resolverCaminho(`js/mock/${arquivo}`));
  if (!resposta.ok) {
    throw new Error("MOCK_LOAD_ERROR");
  }
  return resposta.json();
}

function abrirBancoIDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("NO_IDB"));
      return;
    }
    const req = indexedDB.open(CONFIG.NOME_BANCO_IDB, CONFIG.VERSAO_BANCO_IDB);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB_ERROR"));
  });
}

function lerTodosStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function salvarStore(db, storeName, item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
}

function excluirStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function garantirBancoPronto() {
  if (!promessaDb) {
    promessaDb = (async () => {
      try {
        const db = await abrirBancoIDB();
        const produtosExistentes = await lerTodosStore(db, "produtos");
        if (produtosExistentes.length === 0) {
          const [produtos, clientes, enderecos, pedidos] = await Promise.all([
            carregarJsonMock("produtos.json"),
            carregarJsonMock("clientes.json"),
            carregarJsonMock("enderecos.json"),
            carregarJsonMock("pedidos.json"),
          ]);
          for (const p of produtos) await salvarStore(db, "produtos", normalizarProduto(p));
          for (const c of clientes) await salvarStore(db, "clientes", c);
          for (const e of enderecos) await salvarStore(db, "enderecos", e);
          for (const ped of pedidos) await salvarStore(db, "pedidos", ped);
        }
        return db;
      } catch {
        // Fallback em memória caso IndexedDB esteja indisponível
        if (!memoriaFallback) {
          const [produtos, clientes, enderecos, pedidos] = await Promise.all([
            carregarJsonMock("produtos.json"),
            carregarJsonMock("clientes.json"),
            carregarJsonMock("enderecos.json"),
            carregarJsonMock("pedidos.json"),
          ]);
          memoriaFallback = {
            produtos: produtos.map(normalizarProduto),
            clientes,
            enderecos,
            pedidos,
          };
        }
        return null;
      }
    })();
  }
  return promessaDb;
}

async function listarColecao(nome) {
  const db = await garantirBancoPronto();
  if (!db) return structuredClone(memoriaFallback[nome]);
  return lerTodosStore(db, nome);
}

async function salvarNaColecao(nome, item) {
  const db = await garantirBancoPronto();
  if (!db) {
    const lista = memoriaFallback[nome];
    const idx = lista.findIndex((x) => x.id === item.id);
    if (idx >= 0) lista[idx] = structuredClone(item);
    else lista.push(structuredClone(item));
    return structuredClone(item);
  }
  return salvarStore(db, nome, item);
}

async function removerDaColecao(nome, id) {
  const db = await garantirBancoPronto();
  if (!db) {
    memoriaFallback[nome] = memoriaFallback[nome].filter((x) => x.id !== id);
    return;
  }
  return excluirStore(db, nome, id);
}

function proximoId(lista, base = 1) {
  if (!lista.length) return base;
  return Math.max(base - 1, ...lista.map((x) => Number(x.id) || 0)) + 1;
}

export class ErroApi extends Error {
  constructor(mensagemPublica, codigo = "ERRO") {
    super(mensagemPublica);
    this.name = "ErroApi";
    this.codigo = codigo;
  }
}

/* ==================== PRODUTOS (CLIENTE) ==================== */

export async function listarProdutos({ busca = "", categoria = "", incluirInativos = false } = {}) {
  await esperarMock();
  try {
    let produtos = (await listarColecao("produtos")).map(normalizarProduto);
    if (!incluirInativos) {
      produtos = produtos.filter((p) => p.ativo);
    }
    if (categoria && categoria !== "Todos") {
      produtos = produtos.filter((p) => p.categoria === categoria);
    }
    const termo = normalizarTexto(busca).toLowerCase();
    if (termo) {
      produtos = produtos.filter((p) => {
        const alvo = `${p.nome} ${p.descricao} ${p.categoria} ${p.ingredientes.join(" ")}`.toLowerCase();
        return alvo.includes(termo);
      });
    }
    produtos.sort((a, b) => Number(b.maisPedido) - Number(a.maisPedido) || a.id - b.id);
    return produtos;
  } catch {
    throw new ErroApi(MENSAGENS.UC01.erro, "CATALOGO_INDISPONIVEL");
  }
}

export async function obterProduto(id) {
  await esperarMock();
  try {
    const numId = Number(id);
    const produtos = (await listarColecao("produtos")).map(normalizarProduto);
    const produto = produtos.find((p) => p.id === numId) || null;
    if (!produto) {
      throw new ErroApi(MENSAGENS.UC03.indisponivel, "PRODUTO_NAO_ENCONTRADO");
    }
    return produto;
  } catch (err) {
    if (err instanceof ErroApi) throw err;
    throw new ErroApi(MENSAGENS.UC03.indisponivel, "PRODUTO_INDISPONIVEL");
  }
}

/* ==================== AUTENTICAÇÃO CLIENTE ==================== */

export async function cadastrarCliente({ nome, email, telefone, senha }) {
  await esperarMock();
  const emailNorm = normalizarTexto(email).toLowerCase();
  const clientes = await listarColecao("clientes");
  if (clientes.some((c) => String(c.email).toLowerCase() === emailNorm)) {
    throw new ErroApi(MENSAGENS.UC04.duplicado, "CONTA_DUPLICADA");
  }

  const novo = {
    id: proximoId(clientes, 1),
    nome: normalizarTexto(nome),
    email: emailNorm,
    telefone: normalizarTexto(telefone),
    senhaMock: String(senha),
  };
  await salvarNaColecao("clientes", novo);
  return { id: novo.id, nome: novo.nome, email: novo.email, tipo: "cliente" };
}

export async function loginCliente({ email, senha }) {
  await esperarMock();
  const emailNorm = normalizarTexto(email).toLowerCase();
  const clientes = await listarColecao("clientes");
  const encontrado = clientes.find(
    (c) => String(c.email).toLowerCase() === emailNorm && String(c.senhaMock) === String(senha)
  );
  if (!encontrado) {
    throw new ErroApi(MENSAGENS.UC05.erro, "AUTH_FALHOU");
  }
  return {
    id: encontrado.id,
    nome: encontrado.nome,
    email: encontrado.email,
    tipo: "cliente",
  };
}

/* ==================== ENDEREÇOS ==================== */

export async function listarEnderecos() {
  await esperarMock();
  const sessao = obterSessao();
  if (!sessao || sessao.tipo !== "cliente") {
    throw new ErroApi(MENSAGENS.UC05.erro, "NAO_AUTENTICADO");
  }
  const todos = await listarColecao("enderecos");
  return todos.filter((e) => Number(e.clienteId) === Number(sessao.id));
}

export async function salvarEndereco(dados) {
  await esperarMock();
  const sessao = obterSessao();
  if (!sessao || sessao.tipo !== "cliente") {
    throw new ErroApi(MENSAGENS.UC05.erro, "NAO_AUTENTICADO");
  }
  const todos = await listarColecao("enderecos");
  const novo = {
    id: dados.id ? Number(dados.id) : proximoId(todos, 1),
    clienteId: Number(sessao.id),
    apelido: normalizarTexto(dados.apelido) || "Entrega",
    cep: normalizarTexto(dados.cep),
    logradouro: normalizarTexto(dados.logradouro),
    numero: normalizarTexto(dados.numero),
    complemento: normalizarTexto(dados.complemento),
    bairro: normalizarTexto(dados.bairro),
    cidade: normalizarTexto(dados.cidade),
    uf: normalizarTexto(dados.uf).toUpperCase(),
    referencia: normalizarTexto(dados.referencia),
    padrao: Boolean(dados.padrao),
  };
  await salvarNaColecao("enderecos", novo);
  return novo;
}

const CEPS_LOCAL_MOCK = Object.freeze({
  "01310100": { logradouro: "Av. Paulista", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP" },
  "04543011": { logradouro: "Av. Presidente Juscelino Kubitschek", bairro: "Vila Nova Conceição", cidade: "São Paulo", uf: "SP" },
  "05422001": { logradouro: "Rua dos Pinheiros", bairro: "Pinheiros", cidade: "São Paulo", uf: "SP" },
  "30130010": { logradouro: "Praça Sete de Setembro", bairro: "Centro", cidade: "Belo Horizonte", uf: "MG" },
  "22041001": { logradouro: "Av. Atlântica", bairro: "Copacabana", cidade: "Rio de Janeiro", uf: "RJ" },
});

export async function buscarCepMock(cepTexto) {
  await esperarMock();
  const digitos = soDigitos(cepTexto);
  return CEPS_LOCAL_MOCK[digitos] || null;
}

/* ==================== PEDIDOS E PAGAMENTO (CLIENTE) ==================== */

export async function criarPedido({ enderecoId, observacoes = "", itens = [] }) {
  await esperarMock();
  const sessao = obterSessao();
  if (!sessao || sessao.tipo !== "cliente") {
    throw new ErroApi(MENSAGENS.UC08.reviseDados, "NAO_AUTENTICADO");
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new ErroApi(MENSAGENS.UC08.reviseItens, "CARRINHO_VAZIO");
  }

  const enderecos = await listarEnderecos();
  const endereco = enderecos.find((e) => Number(e.id) === Number(enderecoId));
  if (!endereco) {
    throw new ErroApi(MENSAGENS.UC08.reviseDados, "ENDERECO_INVALIDO");
  }

  // RN12: Revalidar preço e disponibilidade no catálogo antes de gravar
  const catalogo = (await listarColecao("produtos")).map(normalizarProduto);
  const mapaProdutos = new Map(catalogo.map((p) => [p.id, p]));
  const itensSnapshot = [];

  for (const item of itens) {
    const prod = mapaProdutos.get(Number(item.produtoId));
    const qtd = Math.round(Number(item.quantidade));
    if (!prod || !prod.ativo || qtd < CONFIG.QUANTIDADE_MIN_ITEM || qtd > CONFIG.QUANTIDADE_MAX_ITEM) {
      throw new ErroApi(MENSAGENS.UC08.reviseItens, "ITEM_INDISPONIVEL");
    }
    // RN06: Cópia congelada de nome e preço no momento do pedido
    itensSnapshot.push({
      produtoId: prod.id,
      nome: prod.nome,
      precoCentavos: prod.precoCentavos,
      quantidade: qtd,
    });
  }

  // RN03: Recalcular tudo em centavos
  const subtotalCentavos = itensSnapshot.reduce((acc, i) => acc + i.precoCentavos * i.quantidade, 0);
  const taxaEntregaCentavos = CONFIG.TAXA_ENTREGA_CENTAVOS;
  const totalCentavos = subtotalCentavos + taxaEntregaCentavos;

  const pedidos = await listarColecao("pedidos");
  const clientes = await listarColecao("clientes");
  const cliente = clientes.find((c) => Number(c.id) === Number(sessao.id));
  const agora = new Date().toISOString();

  const novoPedido = {
    id: proximoId(pedidos, 1044),
    clienteId: Number(sessao.id),
    clienteNome: sessao.nome,
    clienteTelefone: cliente?.telefone || "",
    criadoEm: agora,
    atualizadoEm: agora,
    status: "Recebido",
    pagamento: {
      modalidade: null,
      status: "Pendente",
      confirmadoEm: null,
    },
    endereco: {
      apelido: endereco.apelido,
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf,
      referencia: endereco.referencia,
    },
    itens: itensSnapshot,
    subtotalCentavos,
    taxaEntregaCentavos,
    totalCentavos,
    observacoes: normalizarTexto(observacoes),
    historicoStatus: [{ status: "Recebido", em: agora }],
  };

  await salvarNaColecao("pedidos", novoPedido);
  return novoPedido;
}

export async function processarPagamento(pedidoId, { modalidade, simulacao = "aprovado" }) {
  await esperarMock();
  const sessao = obterSessao();
  if (!sessao || sessao.tipo !== "cliente") {
    throw new ErroApi(MENSAGENS.UC10.erro, "NAO_AUTENTICADO");
  }

  const modalidadesValidas = CONFIG.MODALIDADES_PAGAMENTO.map((m) => m.id);
  if (!modalidadesValidas.includes(modalidade)) {
    throw new ErroApi(MENSAGENS.UC09.indisponivel, "MODALIDADE_INVALIDA");
  }

  const pedidos = await listarColecao("pedidos");
  const pedido = pedidos.find((p) => Number(p.id) === Number(pedidoId));
  if (!pedido || Number(pedido.clienteId) !== Number(sessao.id)) {
    throw new ErroApi(MENSAGENS.UC10.erro, "NAO_AUTORIZADO");
  }

  if (simulacao === "indisponivel") {
    throw new ErroApi(MENSAGENS.UC09.indisponivel, "PAGAMENTO_INDISPONIVEL");
  }

  if (simulacao === "recusado") {
    pedido.pagamento = {
      modalidade,
      status: "Recusado",
      confirmadoEm: null,
    };
    pedido.atualizadoEm = new Date().toISOString();
    await salvarNaColecao("pedidos", pedido);
    throw new ErroApi(MENSAGENS.UC09.recusado, "PAGAMENTO_RECUSADO");
  }

  const agora = new Date().toISOString();
  pedido.pagamento = {
    modalidade,
    status: "Aprovado",
    confirmadoEm: agora,
  };
  pedido.atualizadoEm = agora;
  await salvarNaColecao("pedidos", pedido);
  return pedido;
}

export async function obterPedidoCliente(pedidoId) {
  await esperarMock();
  const sessao = obterSessao();
  if (!sessao || sessao.tipo !== "cliente") {
    throw new ErroApi(MENSAGENS.UC10.erro, "NAO_AUTENTICADO");
  }
  const pedidos = await listarColecao("pedidos");
  const pedido = pedidos.find((p) => Number(p.id) === Number(pedidoId));
  if (!pedido || Number(pedido.clienteId) !== Number(sessao.id)) {
    throw new ErroApi(MENSAGENS.UC10.erro, "NAO_AUTORIZADO");
  }
  return pedido;
}

export async function listarPedidosCliente({ pagina = 1, limite = CONFIG.ITENS_POR_PAGINA } = {}) {
  await esperarMock();
  const sessao = obterSessao();
  if (!sessao || sessao.tipo !== "cliente") {
    throw new ErroApi(MENSAGENS.UC11.erro, "NAO_AUTENTICADO");
  }
  try {
    const todos = await listarColecao("pedidos");
    const meus = todos
      .filter((p) => Number(p.clienteId) === Number(sessao.id))
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    const totalItens = meus.length;
    const totalPaginas = Math.max(1, Math.ceil(totalItens / limite));
    const paginaSegura = Math.min(Math.max(1, pagina), totalPaginas);
    const inicio = (paginaSegura - 1) * limite;
    return {
      itens: meus.slice(inicio, inicio + limite),
      pagina: paginaSegura,
      totalPaginas,
      totalItens,
    };
  } catch {
    throw new ErroApi(MENSAGENS.UC11.erro, "ERRO_HISTORICO");
  }
}

/* ==================== ADMINISTRADOR ==================== */

export async function loginAdmin({ email, senha }) {
  await esperarMock();
  const emailNorm = normalizarTexto(email).toLowerCase();
  if (
    emailNorm === CONFIG.DEMO.ADMIN_EMAIL.toLowerCase() &&
    String(senha) === CONFIG.DEMO.ADMIN_SENHA
  ) {
    return {
      id: 0,
      nome: "Gerência Torino",
      email: CONFIG.DEMO.ADMIN_EMAIL,
      tipo: "admin",
    };
  }
  throw new ErroApi(MENSAGENS.UC12.erro, "ADMIN_AUTH_FALHOU");
}

function exigirAdmin() {
  const sessao = obterSessao();
  if (!sessao || sessao.tipo !== "admin") {
    throw new ErroApi(MENSAGENS.UC12.erro, "ADMIN_NAO_AUTENTICADO");
  }
  return sessao;
}

export async function salvarProdutoAdmin(dados) {
  await esperarMock();
  exigirAdmin();

  const produtos = (await listarColecao("produtos")).map(normalizarProduto);
  const editando = Boolean(dados.id);
  const precoCentavos = reaisParaCentavos(dados.preco);

  if (!Number.isFinite(precoCentavos) || precoCentavos < CONFIG.PRECO_MIN_CENTAVOS) {
    throw new ErroApi(editando ? MENSAGENS.UC14.erro : MENSAGENS.UC13.erro, "PRECO_INVALIDO");
  }

  const ingredientes = String(dados.ingredientes || "")
    .split(/[\n,]/)
    .map((s) => normalizarTexto(s))
    .filter(Boolean);

  const registro = normalizarProduto({
    id: editando ? Number(dados.id) : proximoId(produtos, 1),
    nome: normalizarTexto(dados.nome),
    descricao: normalizarTexto(dados.descricao),
    ingredientes,
    precoCentavos,
    categoria: normalizarTexto(dados.categoria),
    imagem: dados.imagem || "assets/img/produtos/classico.svg",
    ativo: dados.ativo !== false,
    maisPedido: Boolean(dados.maisPedido),
  });

  if (editando && !produtos.some((p) => p.id === registro.id)) {
    throw new ErroApi(MENSAGENS.UC14.erro, "PRODUTO_INEXISTENTE");
  }

  await salvarNaColecao("produtos", registro);
  return registro;
}

export async function desativarOuExcluirProdutoAdmin(id, { modo = "desativar" } = {}) {
  await esperarMock();
  exigirAdmin();

  const numId = Number(id);
  const produtos = (await listarColecao("produtos")).map(normalizarProduto);
  const produto = produtos.find((p) => p.id === numId);
  if (!produto) {
    throw new ErroApi(MENSAGENS.UC14.erro, "PRODUTO_INEXISTENTE");
  }

  const pedidos = await listarColecao("pedidos");
  const temHistorico = pedidos.some((ped) =>
    Array.isArray(ped.itens) && ped.itens.some((i) => Number(i.produtoId) === numId)
  );

  if (modo === "excluir") {
    if (temHistorico) {
      throw new ErroApi(MENSAGENS.UC15.bloqueadoHistorico, "HISTORICO_ASSOCIADO");
    }
    await removerDaColecao("produtos", numId);
    return { acao: "excluido", produto };
  }

  produto.ativo = false;
  await salvarNaColecao("produtos", produto);
  return { acao: "desativado", produto, temHistorico };
}

export async function reativarProdutoAdmin(id) {
  await esperarMock();
  exigirAdmin();
  const numId = Number(id);
  const produtos = (await listarColecao("produtos")).map(normalizarProduto);
  const produto = produtos.find((p) => p.id === numId);
  if (!produto) {
    throw new ErroApi(MENSAGENS.UC14.erro, "PRODUTO_INEXISTENTE");
  }
  produto.ativo = true;
  await salvarNaColecao("produtos", produto);
  return produto;
}

export async function listarPedidosAdmin({ status = "Todos" } = {}) {
  await esperarMock();
  exigirAdmin();
  const todos = (await listarColecao("pedidos")).sort(
    (a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)
  );

  const contadores = { Todos: todos.length };
  for (const st of CONFIG.STATUS_PEDIDO) {
    contadores[st] = todos.filter((p) => p.status === st).length;
  }

  const filtrados = status && status !== "Todos" ? todos.filter((p) => p.status === status) : todos;
  return { itens: filtrados, contadores };
}

export async function obterPedidoAdmin(pedidoId) {
  await esperarMock();
  exigirAdmin();
  const pedidos = await listarColecao("pedidos");
  const pedido = pedidos.find((p) => Number(p.id) === Number(pedidoId));
  if (!pedido) {
    throw new ErroApi(MENSAGENS.UC17.erro, "PEDIDO_NAO_ENCONTRADO");
  }
  return pedido;
}

export async function atualizarStatusPedidoAdmin(pedidoId, novoStatus) {
  await esperarMock();
  exigirAdmin();
  const pedidos = await listarColecao("pedidos");
  const pedido = pedidos.find((p) => Number(p.id) === Number(pedidoId));
  if (!pedido) {
    throw new ErroApi(MENSAGENS.UC17.erro, "PEDIDO_NAO_ENCONTRADO");
  }

  const permitidas = CONFIG.TRANSICOES_STATUS[pedido.status] || [];
  if (!permitidas.includes(novoStatus)) {
    throw new ErroApi(MENSAGENS.UC18.naoPermitida, "TRANSICAO_INVALIDA");
  }

  const agora = new Date().toISOString();
  pedido.status = novoStatus;
  pedido.atualizadoEm = agora;
  pedido.historicoStatus = Array.isArray(pedido.historicoStatus) ? pedido.historicoStatus : [];
  pedido.historicoStatus.push({ status: novoStatus, em: agora });

  await salvarNaColecao("pedidos", pedido);
  return pedido;
}

export async function listarHistoricoAdmin({
  status = "Todos",
  dataInicio = "",
  dataFim = "",
  pagina = 1,
  limite = CONFIG.ITENS_POR_PAGINA_ADMIN,
} = {}) {
  await esperarMock();
  exigirAdmin();
  let todos = (await listarColecao("pedidos")).sort(
    (a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)
  );

  if (status && status !== "Todos") {
    todos = todos.filter((p) => p.status === status);
  }
  if (dataInicio) {
    const inicio = new Date(`${dataInicio}T00:00:00`);
    todos = todos.filter((p) => new Date(p.criadoEm) >= inicio);
  }
  if (dataFim) {
    const fim = new Date(`${dataFim}T23:59:59.999`);
    todos = todos.filter((p) => new Date(p.criadoEm) <= fim);
  }

  const totalItens = todos.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / limite));
  const paginaSegura = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (paginaSegura - 1) * limite;

  return {
    itens: todos.slice(inicio, inicio + limite),
    pagina: paginaSegura,
    totalPaginas,
    totalItens,
  };
}
