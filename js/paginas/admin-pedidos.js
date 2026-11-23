import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import { listarPedidosAdmin } from "../nucleo/api.js";
import {
  classeSeloStatus,
  formatarDataHora,
  formatarMoeda,
  resolverCaminho,
} from "../nucleo/formato.js";
import { iniciarLayoutAdmin } from "../nucleo/layout.js";
import { mostrarToast, renderizarEstado } from "../nucleo/ui.js";

const sessao = iniciarLayoutAdmin({ paginaAtual: "pedidos" });
if (sessao) {
  const chipsContainer = document.getElementById("chips-status-admin");
  const tabelaContainer = document.getElementById("tabela-pedidos-container");
  const statusEl = document.getElementById("status-pedidos-admin");
  const btnAtualizar = document.getElementById("btn-atualizar-pedidos");

  let statusFiltro = "Todos";

  function renderizarChips(contadores) {
    chipsContainer.textContent = "";
    const lista = ["Todos", ...CONFIG.STATUS_PEDIDO];

    for (const st of lista) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.setAttribute("aria-pressed", String(st === statusFiltro));

      const lbl = document.createElement("span");
      lbl.textContent = st;
      const badge = document.createElement("span");
      badge.className = "chip-contador";
      badge.textContent = String(contadores[st] ?? 0);

      btn.append(lbl, badge);
      btn.addEventListener("click", () => {
        statusFiltro = st;
        carregar(false);
      });
      chipsContainer.appendChild(btn);
    }
  }

  async function carregar(notificar = false) {
    btnAtualizar.disabled = true;
    tabelaContainer.textContent = "Carregando pedidos...";

    try {
      const { itens, contadores } = await listarPedidosAdmin({ status: statusFiltro });
      renderizarChips(contadores);
      tabelaContainer.textContent = "";

      if (itens.length === 0) {
        statusEl.textContent = MENSAGENS.UC16.vazio;
        tabelaContainer.appendChild(
          renderizarEstado({
            imagem: "assets/img/estados/vazio-pedidos.svg",
            titulo: MENSAGENS.UC16.vazio,
            apoio: "Quando novos pedidos chegarem ou mudarem para este status, eles aparecerão aqui.",
            acaoTexto: statusFiltro !== "Todos" ? "Mostrar todos" : "",
            aoClicar: () => {
              statusFiltro = "Todos";
              carregar(false);
            },
          })
        );
        return;
      }

      statusEl.textContent = `${MENSAGENS.UC16.info} (${itens.length})`;
      if (notificar) {
        mostrarToast(MENSAGENS.UC16.info, { tipo: "info" });
      }

      const wrap = document.createElement("div");
      wrap.className = "tabela-envoltoria";
      const table = document.createElement("table");
      table.className = "tabela-admin";

      const thead = document.createElement("thead");
      thead.innerHTML =
        "<tr><th>Senha</th><th>Cliente</th><th>Data e hora</th><th>Itens</th><th>Total</th><th>Status</th><th>Ação</th></tr>";

      const tbody = document.createElement("tbody");

      for (const ped of itens) {
        const tr = document.createElement("tr");
        if (ped.status === "Recebido") {
          tr.classList.add("linha-destaque");
        }

        const tdId = document.createElement("td");
        tdId.dataset.rotulo = "Senha";
        const strongId = document.createElement("strong");
        strongId.className = "numero-tabular";
        strongId.textContent = `#${ped.id}`;
        tdId.appendChild(strongId);

        const tdCliente = document.createElement("td");
        tdCliente.dataset.rotulo = "Cliente";
        tdCliente.textContent = ped.clienteNome;

        const tdData = document.createElement("td");
        tdData.dataset.rotulo = "Data e hora";
        tdData.textContent = formatarDataHora(ped.criadoEm);

        const tdItens = document.createElement("td");
        tdItens.dataset.rotulo = "Itens";
        const qtdItens = ped.itens.reduce((acc, i) => acc + i.quantidade, 0);
        tdItens.textContent = `${qtdItens} ${qtdItens === 1 ? "item" : "itens"}`;

        const tdTotal = document.createElement("td");
        tdTotal.dataset.rotulo = "Total";
        tdTotal.className = "preco";
        tdTotal.textContent = formatarMoeda(ped.totalCentavos);

        const tdStatus = document.createElement("td");
        tdStatus.dataset.rotulo = "Status";
        const selo = document.createElement("span");
        selo.className = `selo ${classeSeloStatus(ped.status)}`;
        selo.textContent = ped.status;
        tdStatus.appendChild(selo);

        const tdAcao = document.createElement("td");
        tdAcao.dataset.rotulo = "Ação";
        const link = document.createElement("a");
        link.href = resolverCaminho(`admin/pedido.html?id=${ped.id}`);
        link.className = "btn btn-secundario btn-sm";
        link.textContent = "Ver comanda";
        tdAcao.appendChild(link);

        tr.append(tdId, tdCliente, tdData, tdItens, tdTotal, tdStatus, tdAcao);
        tbody.appendChild(tr);
      }

      table.append(thead, tbody);
      wrap.appendChild(table);
      tabelaContainer.appendChild(wrap);
    } catch (err) {
      tabelaContainer.textContent = "";
      tabelaContainer.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/erro.svg",
          titulo: err.message || "Não foi possível carregar os pedidos.",
          acaoTexto: "Tentar novamente",
          aoClicar: () => carregar(false),
        })
      );
    } finally {
      btnAtualizar.disabled = false;
    }
  }

  btnAtualizar.addEventListener("click", () => carregar(true));
  carregar(false);
}
