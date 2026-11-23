import { CONFIG } from "../config.js";
import { reaisParaCentavos } from "./formato.js";

function lerSeguro() {
  try {
    const bruto = localStorage.getItem(CONFIG.CHAVE_CARRINHO);
    if (!bruto) return { itens: [] };
    const parsed = JSON.parse(bruto);
    if (!parsed || !Array.isArray(parsed.itens)) return { itens: [] };
    const itens = parsed.itens
      .filter((item) => item && Number.isFinite(Number(item.produtoId)) && Number(item.quantidade) > 0)
      .map((item) => ({
        produtoId: Number(item.produtoId),
        nome: String(item.nome || ""),
        precoCentavos: Math.max(0, Math.round(Number(item.precoCentavos) || 0)),
        imagem: String(item.imagem || ""),
        quantidade: Math.min(
          CONFIG.QUANTIDADE_MAX_ITEM,
          Math.max(CONFIG.QUANTIDADE_MIN_ITEM, Math.round(Number(item.quantidade)))
        ),
      }));
    return { itens };
  } catch {
    return { itens: [] };
  }
}

function gravarSeguro(estado) {
  try {
    localStorage.setItem(CONFIG.CHAVE_CARRINHO, JSON.stringify(estado));
  } catch {
    // Fallback sem interromper o fluxo
  }
  window.dispatchEvent(new CustomEvent("torino:carrinho-alterado", { detail: total() }));
}

export function obterCarrinho() {
  return lerSeguro();
}

export function total() {
  const { itens } = lerSeguro();
  const quantidadeTotal = itens.reduce((acc, item) => acc + item.quantidade, 0);
  const subtotalCentavos = itens.reduce(
    (acc, item) => acc + item.precoCentavos * item.quantidade,
    0
  );
  const taxaEntregaCentavos = itens.length > 0 ? CONFIG.TAXA_ENTREGA_CENTAVOS : 0;
  const totalCentavos = subtotalCentavos + taxaEntregaCentavos;

  return {
    itens,
    quantidadeTotal,
    subtotalCentavos,
    taxaEntregaCentavos,
    totalCentavos,
  };
}

export function adicionarItem(produto, quantidade = 1) {
  if (!produto || !produto.ativo) {
    return { ok: false, motivo: "indisponivel" };
  }

  const qtd = Math.max(
    CONFIG.QUANTIDADE_MIN_ITEM,
    Math.min(CONFIG.QUANTIDADE_MAX_ITEM, Math.round(Number(quantidade) || 1))
  );
  const precoCentavos = Number.isInteger(produto.precoCentavos)
    ? produto.precoCentavos
    : reaisParaCentavos(produto.preco);

  const estado = lerSeguro();
  const existente = estado.itens.find((i) => i.produtoId === Number(produto.id));

  if (existente) {
    existente.quantidade = Math.min(CONFIG.QUANTIDADE_MAX_ITEM, existente.quantidade + qtd);
    existente.precoCentavos = precoCentavos;
    existente.nome = produto.nome;
    existente.imagem = produto.imagem;
  } else {
    estado.itens.push({
      produtoId: Number(produto.id),
      nome: produto.nome,
      precoCentavos,
      imagem: produto.imagem,
      quantidade: qtd,
    });
  }

  gravarSeguro(estado);
  return { ok: true, resumo: total() };
}

export function atualizarQuantidade(produtoId, novaQuantidade) {
  const estado = lerSeguro();
  const indice = estado.itens.findIndex((i) => i.produtoId === Number(produtoId));
  if (indice === -1) return { ok: false, removido: null };

  const qtd = Math.round(Number(novaQuantidade));
  if (qtd <= 0) {
    const [removido] = estado.itens.splice(indice, 1);
    gravarSeguro(estado);
    return { ok: true, removido, resumo: total() };
  }

  estado.itens[indice].quantidade = Math.min(CONFIG.QUANTIDADE_MAX_ITEM, qtd);
  gravarSeguro(estado);
  return { ok: true, removido: null, resumo: total() };
}

export function removerItem(produtoId) {
  const estado = lerSeguro();
  const indice = estado.itens.findIndex((i) => i.produtoId === Number(produtoId));
  if (indice === -1) return null;
  const [removido] = estado.itens.splice(indice, 1);
  gravarSeguro(estado);
  return removido;
}

export function restaurarItem(itemSnapshot) {
  if (!itemSnapshot) return;
  const estado = lerSeguro();
  const existente = estado.itens.find((i) => i.produtoId === Number(itemSnapshot.produtoId));
  if (existente) {
    existente.quantidade = Math.min(
      CONFIG.QUANTIDADE_MAX_ITEM,
      existente.quantidade + itemSnapshot.quantidade
    );
  } else {
    estado.itens.push(itemSnapshot);
  }
  gravarSeguro(estado);
}

export function sincronizarComCatalogo(produtosCatalogo) {
  const mapa = new Map(produtosCatalogo.map((p) => [Number(p.id), p]));
  const estado = lerSeguro();
  const indisponiveis = [];
  let alterado = false;

  for (const item of estado.itens) {
    const prod = mapa.get(item.produtoId);
    if (!prod || !prod.ativo) {
      indisponiveis.push(item.nome);
      continue;
    }
    if (item.precoCentavos !== prod.precoCentavos || item.nome !== prod.nome) {
      item.precoCentavos = prod.precoCentavos;
      item.nome = prod.nome;
      alterado = true;
    }
  }

  if (alterado) {
    gravarSeguro(estado);
  }
  return { indisponiveis, alterado };
}

export function limparCarrinho() {
  gravarSeguro({ itens: [] });
}
