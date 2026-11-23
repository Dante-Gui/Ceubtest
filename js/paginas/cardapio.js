import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import { listarProdutos } from "../nucleo/api.js";
import { adicionarItem } from "../nucleo/carrinho.js";
import { formatarMoeda, normalizarTexto, resolverCaminho } from "../nucleo/formato.js";
import { iniciarLayoutCliente } from "../nucleo/layout.js";
import {
  animarVooCarrinho,
  criarIcone,
  limparAlerta,
  mostrarToast,
  renderizarAlerta,
  renderizarEstado,
  renderizarSkeletonCards,
} from "../nucleo/ui.js";

iniciarLayoutCliente({ paginaAtual: "cardapio", exibirBarraMobile: true });

const formBusca = document.getElementById("form-busca");
const campoBusca = document.getElementById("campo-busca");
const btnLimparBusca = document.getElementById("btn-limpar-busca");
const alertaBusca = document.getElementById("alerta-busca");
const chipsContainer = document.getElementById("chips-categorias");
const listaContainer = document.getElementById("lista-cardapio");
const statusCardapio = document.getElementById("status-cardapio");

let categoriaAtual = "Todos";
let termoBuscaAtual = "";

function renderizarChips() {
  chipsContainer.textContent = "";
  const categorias = ["Todos", ...CONFIG.CATEGORIAS];

  for (const cat of categorias) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = cat;
    btn.setAttribute("aria-pressed", String(cat === categoriaAtual));
    btn.addEventListener("click", () => {
      categoriaAtual = cat;
      limparAlerta(alertaBusca);
      renderizarChips();
      carregarCardapio();
    });
    chipsContainer.appendChild(btn);
  }
}

function criarCardProduto(produto) {
  const card = document.createElement("article");
  card.className = `card-produto ${produto.ativo ? "" : "indisponivel"}`.trim();

  const linkMidia = document.createElement("a");
  linkMidia.className = "card-produto-midia";
  linkMidia.href = resolverCaminho(`produto.html?id=${produto.id}`);

  const img = document.createElement("img");
  img.src = resolverCaminho(produto.imagem);
  img.alt = produto.nome;
  img.width = 400;
  img.height = 300;
  img.loading = "lazy";
  linkMidia.appendChild(img);

  if (produto.maisPedido && produto.ativo) {
    const selo = document.createElement("span");
    selo.className = "selo selo-mostarda card-produto-selo";
    selo.appendChild(criarIcone("estrela", "icone-sm"));
    const txt = document.createElement("span");
    txt.textContent = "Mais pedido";
    selo.appendChild(txt);
    linkMidia.appendChild(selo);
  }

  const corpo = document.createElement("div");
  corpo.className = "card-produto-corpo";

  const titulo = document.createElement("h3");
  titulo.className = "card-produto-titulo";
  const linkTitulo = document.createElement("a");
  linkTitulo.href = resolverCaminho(`produto.html?id=${produto.id}`);
  linkTitulo.textContent = produto.nome;
  titulo.appendChild(linkTitulo);

  const desc = document.createElement("p");
  desc.className = "card-produto-desc";
  desc.textContent = produto.descricao;

  const rodape = document.createElement("div");
  rodape.className = "card-produto-rodape";

  const preco = document.createElement("span");
  preco.className = "preco card-produto-preco";
  preco.textContent = formatarMoeda(produto.precoCentavos);

  const btnAdd = document.createElement("button");
  btnAdd.type = "button";
  btnAdd.className = "btn btn-primario btn-sm";
  btnAdd.textContent = "Adicionar";
  btnAdd.setAttribute("aria-label", `Adicionar ${produto.nome} ao carrinho`);

  if (!produto.ativo) {
    btnAdd.disabled = true;
    btnAdd.textContent = "Indisponível";
  } else {
    btnAdd.addEventListener("click", () => {
      const res = adicionarItem(produto, 1);
      if (!res.ok) {
        mostrarToast(MENSAGENS.UC06.indisponivel, { tipo: "erro" });
        return;
      }
      animarVooCarrinho(btnAdd);
      mostrarToast(MENSAGENS.UC06.sucesso, { tipo: "sucesso" });
    });
  }

  rodape.append(preco, btnAdd);
  corpo.append(titulo, desc, rodape);
  card.append(linkMidia, corpo);
  return card;
}

async function carregarCardapio() {
  listaContainer.textContent = "";
  listaContainer.appendChild(renderizarSkeletonCards(8));
  statusCardapio.textContent = "Carregando cardápio...";

  try {
    const produtos = await listarProdutos({
      busca: termoBuscaAtual,
      categoria: categoriaAtual,
      incluirInativos: false,
    });

    listaContainer.textContent = "";

    if (produtos.length === 0) {
      statusCardapio.textContent = MENSAGENS.UC02.vazio;
      listaContainer.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/vazio-busca.svg",
          titulo: MENSAGENS.UC02.vazio,
          apoio: "Tente buscar outro termo ou explorar todas as categorias do cardápio.",
          acaoTexto: "Mostrar todos os produtos",
          aoClicar: () => {
            termoBuscaAtual = "";
            categoriaAtual = "Todos";
            campoBusca.value = "";
            btnLimparBusca.classList.add("oculto");
            limparAlerta(alertaBusca);
            renderizarChips();
            carregarCardapio();
          },
        })
      );
      return;
    }

    statusCardapio.textContent = `${MENSAGENS.UC01.info} (${produtos.length})`;
    const grade = document.createElement("div");
    grade.className = "cardapio-grade";
    for (const p of produtos) {
      grade.appendChild(criarCardProduto(p));
    }
    listaContainer.appendChild(grade);
  } catch (err) {
    listaContainer.textContent = "";
    statusCardapio.textContent = "";
    listaContainer.appendChild(
      renderizarEstado({
        imagem: "assets/img/estados/erro.svg",
        titulo: err.message || MENSAGENS.UC01.erro,
        apoio: "Confira sua conexão ou tente carregar novamente.",
        acaoTexto: "Tentar novamente",
        aoClicar: carregarCardapio,
      })
    );
  }
}

formBusca.addEventListener("submit", (e) => {
  e.preventDefault();
  limparAlerta(alertaBusca);
  const termo = normalizarTexto(campoBusca.value);
  if (!termo) {
    renderizarAlerta(alertaBusca, MENSAGENS.UC02.termoObrigatorio, "erro");
    campoBusca.focus();
    return;
  }
  termoBuscaAtual = termo;
  btnLimparBusca.classList.remove("oculto");
  carregarCardapio();
});

btnLimparBusca.addEventListener("click", () => {
  termoBuscaAtual = "";
  campoBusca.value = "";
  btnLimparBusca.classList.add("oculto");
  limparAlerta(alertaBusca);
  carregarCardapio();
});

renderizarChips();
carregarCardapio();
