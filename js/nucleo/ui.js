import { CONFIG } from "../config.js";
import { formatarHora, formatarMoeda, resolverCaminho } from "./formato.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export function criarIcone(nome, classeExtra = "") {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", `icone ${classeExtra}`.trim());
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `${resolverCaminho("assets/icons/sprite.svg")}#icone-${nome}`);
  svg.appendChild(use);
  return svg;
}

function garantirPilhaToast() {
  let pilha = document.querySelector(".toast-pilha");
  if (!pilha) {
    pilha = document.createElement("div");
    pilha.className = "toast-pilha";
    pilha.setAttribute("aria-live", "polite");
    document.body.appendChild(pilha);
  }
  return pilha;
}

export function mostrarToast(
  mensagem,
  { tipo = "sucesso", acaoTexto = "", aoClicarAcao = null, duracao = 4200 } = {}
) {
  const pilha = garantirPilhaToast();
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute("role", tipo === "erro" ? "alert" : "status");

  const iconeNome =
    tipo === "erro" ? "erro" : tipo === "aviso" ? "aviso" : tipo === "info" ? "info" : "check";
  toast.appendChild(criarIcone(iconeNome, "icone-sm"));

  const texto = document.createElement("span");
  texto.textContent = mensagem;
  toast.appendChild(texto);

  const remover = () => {
    if (toast.isConnected) toast.remove();
  };

  if (acaoTexto && typeof aoClicarAcao === "function") {
    const btnAcao = document.createElement("button");
    btnAcao.type = "button";
    btnAcao.className = "toast-acao";
    btnAcao.textContent = acaoTexto;
    btnAcao.addEventListener("click", () => {
      aoClicarAcao();
      remover();
    });
    toast.appendChild(btnAcao);
  }

  const btnFechar = document.createElement("button");
  btnFechar.type = "button";
  btnFechar.className = "toast-fechar";
  btnFechar.setAttribute("aria-label", "Fechar notificação");
  btnFechar.appendChild(criarIcone("fechar", "icone-sm"));
  btnFechar.addEventListener("click", remover);
  toast.appendChild(btnFechar);

  pilha.appendChild(toast);
  if (duracao > 0) {
    setTimeout(remover, duracao);
  }
  return remover;
}

export function renderizarAlerta(container, mensagem, tipo = "info", apoio = "") {
  if (!container) return;
  container.textContent = "";

  const box = document.createElement("div");
  box.className = `alerta alerta-${tipo}`;
  box.setAttribute("role", tipo === "erro" ? "alert" : "status");
  box.setAttribute("aria-live", tipo === "erro" ? "assertive" : "polite");

  const iconeNome =
    tipo === "erro" ? "erro" : tipo === "aviso" ? "aviso" : tipo === "sucesso" ? "check" : "info";
  box.appendChild(criarIcone(iconeNome));

  const conteudo = document.createElement("div");
  conteudo.className = "alerta-conteudo";

  const principal = document.createElement("strong");
  principal.textContent = mensagem;
  conteudo.appendChild(principal);

  if (apoio) {
    const sub = document.createElement("span");
    sub.textContent = apoio;
    conteudo.appendChild(sub);
  }

  box.appendChild(conteudo);
  container.appendChild(box);
}

export function limparAlerta(container) {
  if (container) container.textContent = "";
}

/**
 * Modal acessível: foco preso, Esc fecha, devolve foco ao gatilho.
 */
export function abrirModal({ titulo, corpoEl, botoes = [], gatilho = document.activeElement }) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  const caixa = document.createElement("div");
  caixa.className = "modal-caixa";
  caixa.setAttribute("role", "dialog");
  caixa.setAttribute("aria-modal", "true");
  const tituloId = `modal-titulo-${Date.now()}`;
  caixa.setAttribute("aria-labelledby", tituloId);

  const topo = document.createElement("div");
  topo.className = "modal-topo";

  const h2 = document.createElement("h2");
  h2.id = tituloId;
  h2.textContent = titulo;

  const btnFechar = document.createElement("button");
  btnFechar.type = "button";
  btnFechar.className = "btn btn-fantasma btn-icone";
  btnFechar.setAttribute("aria-label", "Fechar janela");
  btnFechar.appendChild(criarIcone("fechar"));

  topo.append(h2, btnFechar);
  caixa.appendChild(topo);

  if (typeof corpoEl === "string") {
    const p = document.createElement("p");
    p.textContent = corpoEl;
    caixa.appendChild(p);
  } else if (corpoEl instanceof Node) {
    caixa.appendChild(corpoEl);
  }

  const fechar = () => {
    document.removeEventListener("keydown", aoTeclar);
    backdrop.remove();
    if (gatilho && typeof gatilho.focus === "function") {
      gatilho.focus();
    }
  };

  const rodape = document.createElement("div");
  rodape.className = "modal-acoes";

  for (const b of botoes) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `btn ${b.classe || "btn-secundario"}`;
    btn.textContent = b.texto;
    btn.addEventListener("click", async () => {
      if (typeof b.aoClicar === "function") {
        await b.aoClicar({ fechar, botao: btn });
      } else {
        fechar();
      }
    });
    rodape.appendChild(btn);
  }
  caixa.appendChild(rodape);
  backdrop.appendChild(caixa);
  document.body.appendChild(backdrop);

  btnFechar.addEventListener("click", fechar);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) fechar();
  });

  const focaveis = () =>
    Array.from(
      caixa.querySelectorAll('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]')
    );

  const aoTeclar = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      fechar();
      return;
    }
    if (e.key === "Tab") {
      const lista = focaveis();
      if (!lista.length) return;
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
  };

  document.addEventListener("keydown", aoTeclar);
  const listaInicial = focaveis();
  (listaInicial[1] || listaInicial[0])?.focus();

  return { fechar };
}

export function renderizarEstado({
  imagem = "assets/img/estados/vazio-busca.svg",
  titulo,
  apoio = "",
  acaoTexto = "",
  acaoHref = "",
  aoClicar = null,
}) {
  const box = document.createElement("div");
  box.className = "estado-caixa";

  const img = document.createElement("img");
  img.src = resolverCaminho(imagem);
  img.alt = "";
  img.width = 140;
  img.height = 108;
  img.className = "estado-ilustracao";
  box.appendChild(img);

  const h2 = document.createElement("h2");
  h2.className = "estado-titulo";
  h2.textContent = titulo;
  box.appendChild(h2);

  if (apoio) {
    const p = document.createElement("p");
    p.className = "estado-apoio";
    p.textContent = apoio;
    box.appendChild(p);
  }

  if (acaoTexto) {
    if (acaoHref) {
      const a = document.createElement("a");
      a.href = resolverCaminho(acaoHref);
      a.className = "btn btn-primario";
      a.textContent = acaoTexto;
      box.appendChild(a);
    } else if (typeof aoClicar === "function") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primario";
      btn.textContent = acaoTexto;
      btn.addEventListener("click", aoClicar);
      box.appendChild(btn);
    }
  }

  return box;
}

export function renderizarSkeletonCards(quantidade = 8) {
  const grade = document.createElement("div");
  grade.className = "skeleton-grade";
  grade.setAttribute("aria-busy", "true");
  grade.setAttribute("aria-label", "Carregando itens");

  for (let i = 0; i < quantidade; i += 1) {
    const card = document.createElement("div");
    card.className = "skeleton-card";
    card.innerHTML =
      '<div class="skeleton-bloco skeleton-foto"></div>' +
      '<div class="skeleton-bloco skeleton-linha"></div>' +
      '<div class="skeleton-bloco skeleton-linha skeleton-linha-curta"></div>';
    grade.appendChild(card);
  }
  return grade;
}

/**
 * Assinatura visual: Comanda da hamburgueria (T05, T07, T08, T09, T16).
 */
export function renderizarComanda({
  titulo = "Comanda Torino",
  subtitulo = "",
  senha = "",
  itens = [],
  subtotalCentavos = 0,
  taxaEntregaCentavos = 0,
  totalCentavos = 0,
  observacoes = "",
  compacta = false,
  editavel = false,
  aoAlterarQtd = null,
  aoRemover = null,
}) {
  const article = document.createElement("article");
  article.className = `comanda ${compacta ? "comanda-compacta" : ""}`.trim();

  const topo = document.createElement("div");
  topo.className = "comanda-topo";

  const blocoTitulo = document.createElement("div");
  const h2 = document.createElement("h2");
  h2.className = "comanda-titulo";
  h2.textContent = titulo;
  blocoTitulo.appendChild(h2);

  if (subtitulo) {
    const sub = document.createElement("p");
    sub.className = "comanda-subtitulo";
    sub.textContent = subtitulo;
    blocoTitulo.appendChild(sub);
  }
  topo.appendChild(blocoTitulo);

  if (senha) {
    const blocoSenha = document.createElement("div");
    blocoSenha.className = "comanda-senha";
    const rot = document.createElement("span");
    rot.className = "comanda-senha-rotulo";
    rot.textContent = "Senha";
    const num = document.createElement("span");
    num.className = "comanda-senha-numero";
    num.textContent = `#${senha}`;
    blocoSenha.append(rot, num);
    topo.appendChild(blocoSenha);
  }

  article.appendChild(topo);

  const lista = document.createElement("ul");
  lista.className = "comanda-itens";

  for (const item of itens) {
    const li = document.createElement("li");
    li.className = "comanda-item";

    const linha = document.createElement("div");
    linha.className = "comanda-linha";

    const nome = document.createElement("span");
    nome.className = "comanda-item-nome";
    nome.textContent = `${item.quantidade}x ${item.nome}`;

    const pontilhado = document.createElement("span");
    pontilhado.className = "comanda-pontilhado";
    pontilhado.setAttribute("aria-hidden", "true");

    const preco = document.createElement("span");
    preco.className = "comanda-item-preco";
    preco.textContent = formatarMoeda(item.precoCentavos * item.quantidade);

    linha.append(nome, pontilhado, preco);
    li.appendChild(linha);

    if (editavel) {
      const controles = document.createElement("div");
      controles.className = "comanda-item-controles";

      const seletor = document.createElement("div");
      seletor.className = "seletor-qtd";

      const btnMenos = document.createElement("button");
      btnMenos.type = "button";
      btnMenos.setAttribute("aria-label", `Diminuir quantidade de ${item.nome}`);
      btnMenos.appendChild(criarIcone("menos", "icone-sm"));
      btnMenos.addEventListener("click", () => aoAlterarQtd?.(item.produtoId, item.quantidade - 1));

      const qtdSpan = document.createElement("span");
      qtdSpan.className = "seletor-qtd-valor";
      qtdSpan.textContent = String(item.quantidade);

      const btnMais = document.createElement("button");
      btnMais.type = "button";
      btnMais.disabled = item.quantidade >= CONFIG.QUANTIDADE_MAX_ITEM;
      btnMais.setAttribute("aria-label", `Aumentar quantidade de ${item.nome}`);
      btnMais.appendChild(criarIcone("mais", "icone-sm"));
      btnMais.addEventListener("click", () => aoAlterarQtd?.(item.produtoId, item.quantidade + 1));

      seletor.append(btnMenos, qtdSpan, btnMais);

      const btnRemover = document.createElement("button");
      btnRemover.type = "button";
      btnRemover.className = "btn btn-fantasma btn-sm";
      btnRemover.append(criarIcone("lixeira", "icone-sm"));
      const txtRem = document.createElement("span");
      txtRem.textContent = "Remover";
      btnRemover.appendChild(txtRem);
      btnRemover.addEventListener("click", () => aoRemover?.(item.produtoId));

      controles.append(seletor, btnRemover);
      li.appendChild(controles);
    }

    lista.appendChild(li);
  }

  article.appendChild(lista);

  if (observacoes) {
    const obs = document.createElement("p");
    obs.className = "comanda-obs";
    const strong = document.createElement("strong");
    strong.textContent = "Observações: ";
    obs.append(strong, document.createTextNode(observacoes));
    article.appendChild(obs);
  }

  const resumo = document.createElement("div");
  resumo.className = "comanda-resumo";

  const linhaSub = document.createElement("div");
  linhaSub.className = "comanda-linha";
  const lblSub = document.createElement("span");
  lblSub.className = "texto-secundario";
  lblSub.textContent = "Subtotal";
  const pont1 = document.createElement("span");
  pont1.className = "comanda-pontilhado";
  const valSub = document.createElement("span");
  valSub.className = "preco";
  valSub.textContent = formatarMoeda(subtotalCentavos);
  linhaSub.append(lblSub, pont1, valSub);

  const linhaTaxa = document.createElement("div");
  linhaTaxa.className = "comanda-linha";
  const lblTaxa = document.createElement("span");
  lblTaxa.className = "texto-secundario";
  lblTaxa.textContent = "Taxa de entrega";
  const pont2 = document.createElement("span");
  pont2.className = "comanda-pontilhado";
  const valTaxa = document.createElement("span");
  valTaxa.className = "preco";
  valTaxa.textContent = formatarMoeda(taxaEntregaCentavos);
  linhaTaxa.append(lblTaxa, pont2, valTaxa);

  const faixaTotal = document.createElement("div");
  faixaTotal.className = "comanda-total-faixa";
  const lblTot = document.createElement("span");
  lblTot.textContent = "Total";
  const valTot = document.createElement("span");
  valTot.className = "numero-tabular";
  valTot.textContent = formatarMoeda(totalCentavos);
  faixaTotal.append(lblTot, valTot);

  resumo.append(linhaSub, linhaTaxa, faixaTotal);
  article.appendChild(resumo);

  return article;
}

/**
 * Carimbos de status do pedido (T09).
 */
export function renderizarLinhaTempo(statusAtual, historicoStatus = []) {
  const ol = document.createElement("ol");
  ol.className = "linha-tempo";
  ol.setAttribute("aria-label", "Linha do tempo do pedido");

  const mapaHoras = new Map(
    (historicoStatus || []).map((h) => [h.status, formatarHora(h.em)])
  );

  if (statusAtual === "Cancelado") {
    const li = document.createElement("li");
    li.className = "etapa-carimbo cancelada";
    const marca = document.createElement("span");
    marca.className = "etapa-marca";
    marca.appendChild(criarIcone("fechar", "icone-sm"));
    const nome = document.createElement("span");
    nome.className = "etapa-nome";
    nome.textContent = "Pedido cancelado";
    const hora = document.createElement("span");
    hora.className = "etapa-hora";
    hora.textContent = mapaHoras.get("Cancelado") || "";
    li.append(marca, nome, hora);
    ol.appendChild(li);
    return ol;
  }

  const indiceAtual = CONFIG.ETAPAS_LINHA_TEMPO.indexOf(statusAtual);

  CONFIG.ETAPAS_LINHA_TEMPO.forEach((etapa, idx) => {
    const li = document.createElement("li");
    let estado = "";
    if (idx < indiceAtual || (idx === indiceAtual && statusAtual === "Entregue")) {
      estado = "concluida";
    } else if (idx === indiceAtual) {
      estado = "atual";
    }
    li.className = `etapa-carimbo ${estado}`.trim();
    if (estado === "atual") {
      li.setAttribute("aria-current", "step");
    }

    const marca = document.createElement("span");
    marca.className = "etapa-marca";
    if (estado === "concluida") {
      marca.appendChild(criarIcone("check", "icone-sm"));
    } else {
      marca.textContent = String(idx + 1);
    }

    const bloco = document.createElement("div");
    const nome = document.createElement("div");
    nome.className = "etapa-nome";
    nome.textContent = etapa;
    const hora = document.createElement("div");
    hora.className = "etapa-hora";
    hora.textContent = mapaHoras.get(etapa) || (estado === "atual" ? "Agora" : "Aguardando");
    bloco.append(nome, hora);

    li.append(marca, bloco);
    ol.appendChild(li);
  });

  return ol;
}

/**
 * Feedback de movimento ao tocar em Adicionar: ponto voa até o ícone do carrinho e pulsa o contador.
 */
export function animarVooCarrinho(botaoOrigem) {
  const badge = document.querySelector(".carrinho-badge");
  if (badge) {
    badge.classList.remove("pulso");
    void badge.offsetWidth;
    badge.classList.add("pulso");
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!botaoOrigem) return;

  const alvo = document.querySelector(".nav-carrinho") || document.querySelector(".barra-carrinho-mobile");
  if (!alvo) return;

  const origemRect = botaoOrigem.getBoundingClientRect();
  const alvoRect = alvo.getBoundingClientRect();

  const ponto = document.createElement("span");
  ponto.className = "voo-carrinho";
  ponto.style.left = `${origemRect.left + origemRect.width / 2}px`;
  ponto.style.top = `${origemRect.top + origemRect.height / 2}px`;
  document.body.appendChild(ponto);

  requestAnimationFrame(() => {
    const dx = alvoRect.left + alvoRect.width / 2 - (origemRect.left + origemRect.width / 2);
    const dy = alvoRect.top + alvoRect.height / 2 - (origemRect.top + origemRect.height / 2);
    ponto.style.transform = `translate(${dx}px, ${dy}px) scale(0.4)`;
    ponto.style.opacity = "0.2";
  });

  setTimeout(() => ponto.remove(), 460);
}

export function renderizarPaginacao({ paginaAtual, totalPaginas, aoMudar }) {
  const nav = document.createElement("nav");
  nav.className = "paginacao";
  nav.setAttribute("aria-label", "Paginação");

  if (totalPaginas <= 1) return nav;

  const btnAnt = document.createElement("button");
  btnAnt.type = "button";
  btnAnt.className = "btn btn-secundario btn-sm";
  btnAnt.textContent = "Anterior";
  btnAnt.disabled = paginaAtual <= 1;
  btnAnt.addEventListener("click", () => aoMudar(paginaAtual - 1));

  const info = document.createElement("span");
  info.className = "paginacao-info";
  info.textContent = `Página ${paginaAtual} de ${totalPaginas}`;

  const btnProx = document.createElement("button");
  btnProx.type = "button";
  btnProx.className = "btn btn-secundario btn-sm";
  btnProx.textContent = "Próxima";
  btnProx.disabled = paginaAtual >= totalPaginas;
  btnProx.addEventListener("click", () => aoMudar(paginaAtual + 1));

  nav.append(btnAnt, info, btnProx);
  return nav;
}
