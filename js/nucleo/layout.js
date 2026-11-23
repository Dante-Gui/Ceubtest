import { CONFIG } from "../config.js";
import { total as totalCarrinho } from "./carrinho.js";
import { formatarMoeda, resolverCaminho } from "./formato.js";
import { encerrarSessao, obterSessao, protegerRota } from "./sessao.js";
import { criarIcone } from "./ui.js";

export function iniciarLayoutCliente({ paginaAtual = "", exibirBarraMobile = false } = {}) {
  const headerAlvo = document.getElementById("topo-site");
  const footerAlvo = document.getElementById("rodape-site");

  const renderizarHeader = () => {
    if (!headerAlvo) return;
    const sessao = obterSessao();
    const resumo = totalCarrinho();

    headerAlvo.className = "topo-cliente";
    headerAlvo.textContent = "";

    const inner = document.createElement("div");
    inner.className = "container topo-cliente-inner";

    const marca = document.createElement("a");
    marca.className = "marca";
    marca.href = resolverCaminho("index.html");
    const selo = document.createElement("span");
    selo.className = "marca-selo";
    selo.appendChild(criarIcone("chama"));
    const nomeMarca = document.createElement("span");
    nomeMarca.textContent = CONFIG.NOME_LOJA;
    marca.append(selo, nomeMarca);

    const nav = document.createElement("nav");
    nav.className = "nav-cliente";
    nav.setAttribute("aria-label", "Navegação principal");

    const linkCardapio = document.createElement("a");
    linkCardapio.className = "nav-link";
    linkCardapio.href = resolverCaminho("index.html");
    if (paginaAtual === "cardapio") linkCardapio.setAttribute("aria-current", "page");
    linkCardapio.appendChild(criarIcone("produtos", "icone-sm"));
    const spanCard = document.createElement("span");
    spanCard.className = "nav-texto-desktop";
    spanCard.textContent = "Cardápio";
    linkCardapio.appendChild(spanCard);
    nav.appendChild(linkCardapio);

    if (sessao && sessao.tipo === "cliente") {
      const linkPedidos = document.createElement("a");
      linkPedidos.className = "nav-link";
      linkPedidos.href = resolverCaminho("meus-pedidos.html");
      if (paginaAtual === "meus-pedidos") linkPedidos.setAttribute("aria-current", "page");
      linkPedidos.appendChild(criarIcone("pedido", "icone-sm"));
      const spanPed = document.createElement("span");
      spanPed.className = "nav-texto-desktop";
      spanPed.textContent = "Meus pedidos";
      linkPedidos.appendChild(spanPed);
      nav.appendChild(linkPedidos);

      const btnSair = document.createElement("button");
      btnSair.type = "button";
      btnSair.className = "nav-link";
      btnSair.setAttribute("aria-label", `Sair da conta de ${sessao.nome}`);
      btnSair.appendChild(criarIcone("sair", "icone-sm"));
      const spanNome = document.createElement("span");
      spanNome.className = "nav-texto-desktop";
      spanNome.textContent = `${sessao.nome.split(" ")[0]} · Sair`;
      btnSair.appendChild(spanNome);
      btnSair.addEventListener("click", () => {
        encerrarSessao();
        window.location.href = resolverCaminho("index.html");
      });
      nav.appendChild(btnSair);
    } else {
      const linkEntrar = document.createElement("a");
      linkEntrar.className = "nav-link";
      linkEntrar.href = resolverCaminho("login.html");
      if (paginaAtual === "login") linkEntrar.setAttribute("aria-current", "page");
      linkEntrar.appendChild(criarIcone("usuario", "icone-sm"));
      const spanEnt = document.createElement("span");
      spanEnt.className = "nav-texto-desktop";
      spanEnt.textContent = "Entrar";
      linkEntrar.appendChild(spanEnt);
      nav.appendChild(linkEntrar);
    }

    const linkCarrinho = document.createElement("a");
    linkCarrinho.className = "nav-carrinho";
    linkCarrinho.href = resolverCaminho("carrinho.html");
    linkCarrinho.setAttribute("aria-label", `Carrinho com ${resumo.quantidadeTotal} itens`);
    linkCarrinho.appendChild(criarIcone("carrinho", "icone-sm"));
    const spanCar = document.createElement("span");
    spanCar.className = "nav-texto-desktop";
    spanCar.textContent = "Carrinho";
    const badge = document.createElement("span");
    badge.className = "carrinho-badge";
    badge.textContent = String(resumo.quantidadeTotal);
    linkCarrinho.append(spanCar, badge);
    nav.appendChild(linkCarrinho);

    inner.append(marca, nav);
    headerAlvo.appendChild(inner);
  };

  const renderizarBarraMobile = () => {
    let barra = document.getElementById("barra-carrinho-mobile");
    if (!exibirBarraMobile) {
      barra?.remove();
      document.body.classList.remove("tem-barra-mobile");
      return;
    }

    const resumo = totalCarrinho();
    if (resumo.quantidadeTotal === 0) {
      barra?.remove();
      document.body.classList.remove("tem-barra-mobile");
      return;
    }

    if (!barra) {
      barra = document.createElement("div");
      barra.id = "barra-carrinho-mobile";
      barra.className = "barra-carrinho-mobile";
      document.body.appendChild(barra);
    }
    document.body.classList.add("tem-barra-mobile");
    barra.textContent = "";

    const info = document.createElement("div");
    const qtd = document.createElement("div");
    qtd.className = "texto-pequeno";
    qtd.textContent = `${resumo.quantidadeTotal} ${resumo.quantidadeTotal === 1 ? "item" : "itens"}`;
    const val = document.createElement("div");
    val.className = "preco";
    val.textContent = formatarMoeda(resumo.subtotalCentavos);
    info.append(qtd, val);

    const btn = document.createElement("a");
    btn.href = resolverCaminho("carrinho.html");
    btn.className = "btn btn-primario btn-sm";
    btn.textContent = "Ver carrinho";

    barra.append(info, btn);
  };

  if (footerAlvo) {
    footerAlvo.className = "rodape-cliente";
    footerAlvo.textContent = "";
    const inner = document.createElement("div");
    inner.className = "container rodape-inner";

    const dir = document.createElement("p");
    dir.textContent = `${CONFIG.NOME_LOJA} · Chapa quente, comanda na mão.`;

    const links = document.createElement("div");
    links.style.display = "flex";
    links.style.gap = "16px";
    links.style.flexWrap = "wrap";

    const aCard = document.createElement("a");
    aCard.href = resolverCaminho("index.html");
    aCard.textContent = "Cardápio";

    const aPed = document.createElement("a");
    aPed.href = resolverCaminho("meus-pedidos.html");
    aPed.textContent = "Meus pedidos";

    const aAdmin = document.createElement("a");
    aAdmin.href = resolverCaminho("admin/login.html");
    aAdmin.textContent = "Área administrativa";

    links.append(aCard, aPed, aAdmin);
    inner.append(dir, links);
    footerAlvo.appendChild(inner);
  }

  renderizarHeader();
  renderizarBarraMobile();

  window.addEventListener("torino:carrinho-alterado", () => {
    renderizarHeader();
    renderizarBarraMobile();
  });
  window.addEventListener("torino:sessao-alterada", renderizarHeader);
}

export function iniciarLayoutAdmin({ paginaAtual = "" } = {}) {
  const sessao = protegerRota("admin");
  if (!sessao) return null;

  const barraMobile = document.getElementById("admin-barra-mobile");
  const sidebar = document.getElementById("admin-sidebar");

  if (barraMobile) {
    barraMobile.className = "admin-barra-mobile";
    barraMobile.textContent = "";

    const marca = document.createElement("a");
    marca.className = "marca";
    marca.href = resolverCaminho("admin/pedidos.html");
    const selo = document.createElement("span");
    selo.className = "marca-selo";
    selo.appendChild(criarIcone("chama"));
    const txt = document.createElement("span");
    txt.textContent = "Torino Admin";
    marca.append(selo, txt);

    const btnMenu = document.createElement("button");
    btnMenu.type = "button";
    btnMenu.className = "nav-link";
    btnMenu.setAttribute("aria-expanded", "false");
    btnMenu.setAttribute("aria-controls", "admin-sidebar");
    btnMenu.setAttribute("aria-label", "Abrir menu administrativo");
    btnMenu.appendChild(criarIcone("menu"));
    btnMenu.addEventListener("click", () => {
      const aberta = sidebar?.classList.toggle("aberta");
      btnMenu.setAttribute("aria-expanded", String(Boolean(aberta)));
    });

    barraMobile.append(marca, btnMenu);
  }

  if (sidebar) {
    sidebar.className = "admin-sidebar";
    sidebar.textContent = "";

    const marca = document.createElement("a");
    marca.className = "marca";
    marca.href = resolverCaminho("admin/pedidos.html");
    const selo = document.createElement("span");
    selo.className = "marca-selo";
    selo.appendChild(criarIcone("chama"));
    const txt = document.createElement("span");
    txt.textContent = "Torino Admin";
    marca.append(selo, txt);

    const nav = document.createElement("nav");
    nav.className = "admin-nav";
    nav.setAttribute("aria-label", "Menu do administrador");

    const itens = [
      { id: "pedidos", href: "admin/pedidos.html", rotulo: "Pedidos", icone: "pedido" },
      { id: "produtos", href: "admin/produtos.html", rotulo: "Produtos", icone: "produtos" },
      { id: "historico", href: "admin/historico.html", rotulo: "Histórico", icone: "historico" },
    ];

    for (const item of itens) {
      const a = document.createElement("a");
      a.className = "admin-nav-link";
      a.href = resolverCaminho(item.href);
      if (paginaAtual === item.id) a.setAttribute("aria-current", "page");
      a.appendChild(criarIcone(item.icone, "icone-sm"));
      const sp = document.createElement("span");
      sp.textContent = item.rotulo;
      a.appendChild(sp);
      nav.appendChild(a);
    }

    const rodape = document.createElement("div");
    rodape.className = "admin-rodape-nav";

    const linkLoja = document.createElement("a");
    linkLoja.className = "admin-nav-link";
    linkLoja.href = resolverCaminho("index.html");
    linkLoja.appendChild(criarIcone("seta-voltar", "icone-sm"));
    const spLoja = document.createElement("span");
    spLoja.textContent = "Ver loja do cliente";
    linkLoja.appendChild(spLoja);

    const btnSair = document.createElement("button");
    btnSair.type = "button";
    btnSair.className = "admin-nav-link";
    btnSair.style.background = "transparent";
    btnSair.style.border = "0";
    btnSair.style.cursor = "pointer";
    btnSair.appendChild(criarIcone("sair", "icone-sm"));
    const spSair = document.createElement("span");
    spSair.textContent = "Sair do painel";
    btnSair.appendChild(spSair);
    btnSair.addEventListener("click", () => {
      encerrarSessao();
      window.location.href = resolverCaminho("admin/login.html");
    });

    rodape.append(linkLoja, btnSair);
    sidebar.append(marca, nav, rodape);
  }

  return sessao;
}
