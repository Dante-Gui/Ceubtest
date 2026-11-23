import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import {
  desativarOuExcluirProdutoAdmin,
  listarProdutos,
  reativarProdutoAdmin,
} from "../nucleo/api.js";
import {
  classeSeloStatus,
  formatarMoeda,
  normalizarTexto,
  resolverCaminho,
} from "../nucleo/formato.js";
import { iniciarLayoutAdmin } from "../nucleo/layout.js";
import {
  abrirModal,
  limparAlerta,
  mostrarToast,
  renderizarAlerta,
  renderizarEstado,
  renderizarPaginacao,
} from "../nucleo/ui.js";

const sessao = iniciarLayoutAdmin({ paginaAtual: "produtos" });
if (sessao) {
  const buscaInput = document.getElementById("busca-produto-admin");
  const filtroStatus = document.getElementById("filtro-status-prod");
  const tabelaContainer = document.getElementById("tabela-produtos-container");
  const pagContainer = document.getElementById("paginacao-produtos");
  const statusEl = document.getElementById("status-produtos-admin");
  const alertaEl = document.getElementById("alerta-produtos-admin");

  let todosProdutos = [];
  let ordenacao = { campo: "nome", direcao: "asc" };
  let paginaAtual = 1;

  async function carregar() {
    tabelaContainer.textContent = "Carregando produtos...";
    try {
      todosProdutos = await listarProdutos({ incluirInativos: true });
      renderizar();
    } catch (err) {
      tabelaContainer.textContent = "";
      renderizarAlerta(alertaEl, err.message || MENSAGENS.UC01.erro, "erro");
    }
  }

  function filtrarEOrdenar() {
    const termo = normalizarTexto(buscaInput.value).toLowerCase();
    const st = filtroStatus.value;

    let lista = todosProdutos.filter((p) => {
      if (st === "ativos" && !p.ativo) return false;
      if (st === "inativos" && p.ativo) return false;
      if (!termo) return true;
      return `${p.nome} ${p.categoria} ${p.descricao}`.toLowerCase().includes(termo);
    });

    const mult = ordenacao.direcao === "asc" ? 1 : -1;
    lista.sort((a, b) => {
      if (ordenacao.campo === "preco") return (a.precoCentavos - b.precoCentavos) * mult;
      if (ordenacao.campo === "ativo") return (Number(b.ativo) - Number(a.ativo)) * mult;
      return a.nome.localeCompare(b.nome, "pt-BR") * mult;
    });
    return lista;
  }

  function alternarOrdenacao(campo) {
    if (ordenacao.campo === campo) {
      ordenacao.direcao = ordenacao.direcao === "asc" ? "desc" : "asc";
    } else {
      ordenacao = { campo, direcao: "asc" };
    }
    renderizar();
  }

  // Modal T14 (UC15): confirmação com nome do produto e aviso de preservação do histórico
  function abrirModalT14(produto, gatilho) {
    const corpo = document.createElement("div");
    corpo.style.display = "flex";
    corpo.style.flexDirection = "column";
    corpo.style.gap = "12px";

    const p1 = document.createElement("p");
    p1.textContent = `Você selecionou "${produto.nome}".`;
    const p2 = document.createElement("p");
    p2.className = "texto-secundario texto-pequeno";
    p2.textContent =
      "Ao desativar, o produto sai do cardápio do cliente e todo o histórico de pedidos anteriores é preservado. A exclusão definitiva só é permitida se não houver pedidos associados.";
    const alertaModal = document.createElement("div");

    corpo.append(p1, p2, alertaModal);

    abrirModal({
      titulo: "Desativar ou excluir produto",
      corpoEl: corpo,
      gatilho,
      botoes: [
        { texto: "Cancelar", classe: "btn-secundario" },
        {
          texto: "Excluir definitivamente",
          classe: "btn-perigo-contorno",
          aoClicar: async ({ fechar, botao }) => {
            limparAlerta(alertaModal);
            botao.disabled = true;
            try {
              await desativarOuExcluirProdutoAdmin(produto.id, { modo: "excluir" });
              fechar();
              mostrarToast("Produto excluído.", { tipo: "sucesso" });
              await carregar();
            } catch (err) {
              botao.disabled = false;
              renderizarAlerta(
                alertaModal,
                err.message || MENSAGENS.UC15.bloqueadoHistorico,
                "erro"
              );
            }
          },
        },
        {
          texto: "Desativar produto",
          classe: "btn-perigo",
          aoClicar: async ({ fechar, botao }) => {
            limparAlerta(alertaModal);
            botao.disabled = true;
            try {
              await desativarOuExcluirProdutoAdmin(produto.id, { modo: "desativar" });
              fechar();
              mostrarToast(MENSAGENS.UC15.sucesso, { tipo: "sucesso" });
              await carregar();
            } catch (err) {
              botao.disabled = false;
              renderizarAlerta(alertaModal, err.message || MENSAGENS.UC14.erro, "erro");
            }
          },
        },
      ],
    });
  }

  function renderizar() {
    tabelaContainer.textContent = "";
    pagContainer.textContent = "";

    const filtrados = filtrarEOrdenar();
    statusEl.textContent = `${filtrados.length} ${filtrados.length === 1 ? "produto" : "produtos"} encontrados`;

    if (filtrados.length === 0) {
      tabelaContainer.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/vazio-busca.svg",
          titulo: MENSAGENS.UC02.vazio,
          apoio: "Ajuste a busca ou cadastre um novo produto no cardápio.",
          acaoTexto: "Novo produto",
          acaoHref: "admin/produto-form.html",
        })
      );
      return;
    }

    const limite = CONFIG.ITENS_POR_PAGINA_ADMIN;
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / limite));
    paginaAtual = Math.min(paginaAtual, totalPaginas);
    const inicio = (paginaAtual - 1) * limite;
    const paginaItens = filtrados.slice(inicio, inicio + limite);

    const wrap = document.createElement("div");
    wrap.className = "tabela-envoltoria";

    const table = document.createElement("table");
    table.className = "tabela-admin";

    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");

    const colunas = [
      { rotulo: "Foto", ordenavel: null },
      { rotulo: "Produto", ordenavel: "nome" },
      { rotulo: "Categoria", ordenavel: null },
      { rotulo: "Preço", ordenavel: "preco" },
      { rotulo: "Status", ordenavel: "ativo" },
      { rotulo: "Ações", ordenavel: null },
    ];

    for (const col of colunas) {
      const th = document.createElement("th");
      if (col.ordenavel) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tabela-ordenar";
        const seta =
          ordenacao.campo === col.ordenavel ? (ordenacao.direcao === "asc" ? " ▲" : " ▼") : "";
        btn.textContent = `${col.rotulo}${seta}`;
        btn.addEventListener("click", () => alternarOrdenacao(col.ordenavel));
        th.appendChild(btn);
      } else {
        th.textContent = col.rotulo;
      }
      trHead.appendChild(th);
    }
    thead.appendChild(trHead);

    const tbody = document.createElement("tbody");

    for (const p of paginaItens) {
      const tr = document.createElement("tr");

      const tdFoto = document.createElement("td");
      tdFoto.dataset.rotulo = "Foto";
      const img = document.createElement("img");
      img.src = resolverCaminho(p.imagem);
      img.alt = p.nome;
      img.width = 60;
      img.height = 45;
      img.loading = "lazy";
      img.className = "tabela-miniatura";
      tdFoto.appendChild(img);

      const tdNome = document.createElement("td");
      tdNome.dataset.rotulo = "Produto";
      const strong = document.createElement("strong");
      strong.textContent = p.nome;
      tdNome.appendChild(strong);

      const tdCat = document.createElement("td");
      tdCat.dataset.rotulo = "Categoria";
      tdCat.textContent = p.categoria;

      const tdPreco = document.createElement("td");
      tdPreco.dataset.rotulo = "Preço";
      tdPreco.className = "preco";
      tdPreco.textContent = formatarMoeda(p.precoCentavos);

      const tdStatus = document.createElement("td");
      tdStatus.dataset.rotulo = "Status";
      const selo = document.createElement("span");
      const textoSt = p.ativo ? "Ativo" : "Inativo";
      selo.className = `selo ${classeSeloStatus(textoSt)}`;
      selo.textContent = textoSt;
      tdStatus.appendChild(selo);

      const tdAcoes = document.createElement("td");
      tdAcoes.dataset.rotulo = "Ações";
      const acoes = document.createElement("div");
      acoes.className = "tabela-acoes";

      const linkEditar = document.createElement("a");
      linkEditar.href = resolverCaminho(`admin/produto-form.html?id=${p.id}`);
      linkEditar.className = "btn btn-secundario btn-sm";
      linkEditar.textContent = "Editar";
      acoes.appendChild(linkEditar);

      if (p.ativo) {
        const btnDes = document.createElement("button");
        btnDes.type = "button";
        btnDes.className = "btn btn-perigo-contorno btn-sm";
        btnDes.textContent = "Desativar";
        btnDes.addEventListener("click", () => abrirModalT14(p, btnDes));
        acoes.appendChild(btnDes);
      } else {
        const btnReat = document.createElement("button");
        btnReat.type = "button";
        btnReat.className = "btn btn-fantasma btn-sm";
        btnReat.textContent = "Reativar";
        btnReat.addEventListener("click", async () => {
          btnReat.disabled = true;
          try {
            await reativarProdutoAdmin(p.id);
            mostrarToast(MENSAGENS.UC14.sucesso, { tipo: "sucesso" });
            await carregar();
          } catch (err) {
            btnReat.disabled = false;
            renderizarAlerta(alertaEl, err.message || MENSAGENS.UC14.erro, "erro");
          }
        });
        acoes.appendChild(btnReat);
      }

      tdAcoes.appendChild(acoes);
      tr.append(tdFoto, tdNome, tdCat, tdPreco, tdStatus, tdAcoes);
      tbody.appendChild(tr);
    }

    table.append(thead, tbody);
    wrap.appendChild(table);
    tabelaContainer.appendChild(wrap);

    pagContainer.appendChild(
      renderizarPaginacao({
        paginaAtual,
        totalPaginas,
        aoMudar: (nova) => {
          paginaAtual = nova;
          renderizar();
        },
      })
    );
  }

  buscaInput.addEventListener("input", () => {
    paginaAtual = 1;
    renderizar();
  });

  filtroStatus.addEventListener("change", () => {
    paginaAtual = 1;
    renderizar();
  });

  carregar();
}
