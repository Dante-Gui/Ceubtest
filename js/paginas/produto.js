import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import { obterProduto } from "../nucleo/api.js";
import { adicionarItem } from "../nucleo/carrinho.js";
import { formatarMoeda, resolverCaminho } from "../nucleo/formato.js";
import { iniciarLayoutCliente } from "../nucleo/layout.js";
import {
  animarVooCarrinho,
  criarIcone,
  mostrarToast,
  renderizarAlerta,
  renderizarEstado,
} from "../nucleo/ui.js";

iniciarLayoutCliente({ paginaAtual: "produto", exibirBarraMobile: false });

const container = document.getElementById("detalhe-produto");
const statusProduto = document.getElementById("status-produto");
const params = new URLSearchParams(window.location.search);
const produtoId = Number(params.get("id"));

async function carregar() {
  container.textContent = "";
  const carregando = document.createElement("p");
  carregando.className = "texto-secundario";
  carregando.textContent = "Carregando detalhes do produto...";
  container.appendChild(carregando);

  if (!Number.isInteger(produtoId) || produtoId <= 0) {
    container.textContent = "";
    container.appendChild(
      renderizarEstado({
        imagem: "assets/img/estados/vazio-busca.svg",
        titulo: MENSAGENS.UC03.indisponivel,
        apoio: "Escolha outro item disponível no cardápio.",
        acaoTexto: "Ver cardápio",
        acaoHref: "index.html",
      })
    );
    return;
  }

  try {
    const produto = await obterProduto(produtoId);
    document.title = `${produto.nome} — Torino Online`;
    statusProduto.textContent = MENSAGENS.UC03.info;
    renderizarDetalhe(produto);
  } catch (err) {
    container.textContent = "";
    container.appendChild(
      renderizarEstado({
        imagem: "assets/img/estados/erro.svg",
        titulo: err.message || MENSAGENS.UC03.indisponivel,
        apoio: "Volte ao cardápio para ver os itens disponíveis agora.",
        acaoTexto: "Ver cardápio",
        acaoHref: "index.html",
      })
    );
  }
}

function renderizarDetalhe(produto) {
  container.textContent = "";
  const grade = document.createElement("div");
  grade.className = "produto-detalhe";

  const fotoWrap = document.createElement("div");
  fotoWrap.className = `produto-foto-grande ${produto.ativo ? "" : "indisponivel"}`.trim();
  const img = document.createElement("img");
  img.src = resolverCaminho(produto.imagem);
  img.alt = produto.nome;
  img.width = 640;
  img.height = 480;
  fotoWrap.appendChild(img);

  const info = document.createElement("div");
  info.className = "produto-info-caixa";

  const selos = document.createElement("div");
  selos.style.display = "flex";
  selos.style.gap = "8px";
  selos.style.flexWrap = "wrap";

  const seloCat = document.createElement("span");
  seloCat.className = "selo selo-neutro";
  seloCat.textContent = produto.categoria;
  selos.appendChild(seloCat);

  if (produto.maisPedido && produto.ativo) {
    const seloMp = document.createElement("span");
    seloMp.className = "selo selo-mostarda";
    seloMp.appendChild(criarIcone("estrela", "icone-sm"));
    const t = document.createElement("span");
    t.textContent = "Mais pedido";
    seloMp.appendChild(t);
    selos.appendChild(seloMp);
  }

  const h1 = document.createElement("h1");
  h1.textContent = produto.nome;

  const desc = document.createElement("p");
  desc.textContent = produto.descricao;

  const preco = document.createElement("div");
  preco.className = "preco produto-preco-destaque";
  preco.textContent = formatarMoeda(produto.precoCentavos);

  info.append(selos, h1, desc, preco);

  if (!produto.ativo) {
    const avisoEl = document.createElement("div");
    renderizarAlerta(
      avisoEl,
      MENSAGENS.UC03.indisponivel,
      "aviso",
      "Este item está temporariamente fora da chapa."
    );
    info.appendChild(avisoEl);
  }

  if (produto.ingredientes && produto.ingredientes.length > 0) {
    const tituloIng = document.createElement("h2");
    tituloIng.style.fontSize = "var(--t1)";
    tituloIng.textContent = "Ingredientes";
    const ul = document.createElement("ul");
    ul.className = "lista-ingredientes";
    for (const ing of produto.ingredientes) {
      const li = document.createElement("li");
      li.textContent = ing;
      ul.appendChild(li);
    }
    info.append(tituloIng, ul);
  }

  let quantidade = 1;
  const barraAcao = document.createElement("div");
  barraAcao.className = "produto-barra-fixa";

  const seletor = document.createElement("div");
  seletor.className = "seletor-qtd";

  const btnMenos = document.createElement("button");
  btnMenos.type = "button";
  btnMenos.setAttribute("aria-label", "Diminuir quantidade");
  btnMenos.appendChild(criarIcone("menos", "icone-sm"));

  const spanQtd = document.createElement("span");
  spanQtd.className = "seletor-qtd-valor";
  spanQtd.textContent = "1";

  const btnMais = document.createElement("button");
  btnMais.type = "button";
  btnMais.setAttribute("aria-label", "Aumentar quantidade");
  btnMais.appendChild(criarIcone("mais", "icone-sm"));

  const btnAdicionar = document.createElement("button");
  btnAdicionar.type = "button";
  btnAdicionar.className = "btn btn-primario";

  const atualizarBotao = () => {
    spanQtd.textContent = String(quantidade);
    btnMenos.disabled = !produto.ativo || quantidade <= CONFIG.QUANTIDADE_MIN_ITEM;
    btnMais.disabled = !produto.ativo || quantidade >= CONFIG.QUANTIDADE_MAX_ITEM;
    btnAdicionar.disabled = !produto.ativo;
    btnAdicionar.textContent = produto.ativo
      ? `Adicionar ao carrinho · ${formatarMoeda(produto.precoCentavos * quantidade)}`
      : "Produto indisponível";
  };

  btnMenos.addEventListener("click", () => {
    if (quantidade > CONFIG.QUANTIDADE_MIN_ITEM) {
      quantidade -= 1;
      atualizarBotao();
    }
  });

  btnMais.addEventListener("click", () => {
    if (quantidade < CONFIG.QUANTIDADE_MAX_ITEM) {
      quantidade += 1;
      atualizarBotao();
    }
  });

  btnAdicionar.addEventListener("click", () => {
    const res = adicionarItem(produto, quantidade);
    if (!res.ok) {
      mostrarToast(MENSAGENS.UC06.indisponivel, { tipo: "erro" });
      return;
    }
    animarVooCarrinho(btnAdicionar);
    mostrarToast(MENSAGENS.UC06.sucesso, {
      tipo: "sucesso",
      acaoTexto: "Ver carrinho",
      aoClicarAcao: () => {
        window.location.href = resolverCaminho("carrinho.html");
      },
    });
  });

  atualizarBotao();
  seletor.append(btnMenos, spanQtd, btnMais);
  barraAcao.append(seletor, btnAdicionar);
  info.appendChild(barraAcao);

  grade.append(fotoWrap, info);
  container.appendChild(grade);
}

carregar();
