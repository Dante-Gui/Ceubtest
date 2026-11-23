import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import { listarHistoricoAdmin } from "../nucleo/api.js";
import {
  classeSeloStatus,
  formatarDataHora,
  formatarMoeda,
  resolverCaminho,
} from "../nucleo/formato.js";
import { iniciarLayoutAdmin } from "../nucleo/layout.js";
import { renderizarEstado, renderizarPaginacao } from "../nucleo/ui.js";

const sessao = iniciarLayoutAdmin({ paginaAtual: "historico" });
if (sessao) {
  const form = document.getElementById("form-filtros-historico");
  const selectStatus = document.getElementById("filtro-status");
  const inputInicio = document.getElementById("data-inicio");
  const inputFim = document.getElementById("data-fim");
  const btnLimpar = document.getElementById("btn-limpar-filtros");
  const tabelaContainer = document.getElementById("tabela-historico-container");
  const pagContainer = document.getElementById("paginacao-historico");
  const statusEl = document.getElementById("status-historico-admin");

  for (const st of ["Todos", ...CONFIG.STATUS_PEDIDO]) {
    const opt = document.createElement("option");
    opt.value = st;
    opt.textContent = st;
    selectStatus.appendChild(opt);
  }

  let paginaAtual = 1;

  async function carregar(pagina = 1) {
    paginaAtual = pagina;
    tabelaContainer.textContent = "Carregando histórico...";
    pagContainer.textContent = "";

    try {
      const res = await listarHistoricoAdmin({
        status: selectStatus.value,
        dataInicio: inputInicio.value,
        dataFim: inputFim.value,
        pagina: paginaAtual,
      });

      tabelaContainer.textContent = "";

      if (res.itens.length === 0) {
        statusEl.textContent = MENSAGENS.UC19.vazio;
        tabelaContainer.appendChild(
          renderizarEstado({
            imagem: "assets/img/estados/vazio-pedidos.svg",
            titulo: MENSAGENS.UC19.vazio,
            apoio: "Ajuste o período ou o status selecionado para ver outros registros.",
            acaoTexto: "Limpar filtros",
            aoClicar: () => {
              form.reset();
              carregar(1);
            },
          })
        );
        return;
      }

      statusEl.textContent = `${MENSAGENS.UC19.info} (${res.totalItens})`;

      const wrap = document.createElement("div");
      wrap.className = "tabela-envoltoria";
      const table = document.createElement("table");
      table.className = "tabela-admin";

      const thead = document.createElement("thead");
      thead.innerHTML =
        "<tr><th>Senha</th><th>Data e hora</th><th>Cliente</th><th>Pagamento</th><th>Total</th><th>Status</th><th>Detalhes</th></tr>";

      const tbody = document.createElement("tbody");

      for (const ped of res.itens) {
        const tr = document.createElement("tr");

        const tdId = document.createElement("td");
        tdId.dataset.rotulo = "Senha";
        const strongId = document.createElement("strong");
        strongId.className = "numero-tabular";
        strongId.textContent = `#${ped.id}`;
        tdId.appendChild(strongId);

        const tdData = document.createElement("td");
        tdData.dataset.rotulo = "Data e hora";
        tdData.textContent = formatarDataHora(ped.criadoEm);

        const tdCliente = document.createElement("td");
        tdCliente.dataset.rotulo = "Cliente";
        tdCliente.textContent = ped.clienteNome;

        const tdPag = document.createElement("td");
        tdPag.dataset.rotulo = "Pagamento";
        tdPag.textContent = `${ped.pagamento?.modalidade || "—"} (${ped.pagamento?.status || "Pendente"})`;

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
        tdAcao.dataset.rotulo = "Detalhes";
        const link = document.createElement("a");
        link.href = resolverCaminho(`admin/pedido.html?id=${ped.id}`);
        link.className = "btn btn-secundario btn-sm";
        link.textContent = "Abrir";
        tdAcao.appendChild(link);

        tr.append(tdId, tdData, tdCliente, tdPag, tdTotal, tdStatus, tdAcao);
        tbody.appendChild(tr);
      }

      table.append(thead, tbody);
      wrap.appendChild(table);
      tabelaContainer.appendChild(wrap);

      pagContainer.appendChild(
        renderizarPaginacao({
          paginaAtual: res.pagina,
          totalPaginas: res.totalPaginas,
          aoMudar: carregar,
        })
      );
    } catch (err) {
      tabelaContainer.textContent = "";
      tabelaContainer.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/erro.svg",
          titulo: err.message || "Não foi possível carregar o histórico.",
          acaoTexto: "Tentar novamente",
          aoClicar: () => carregar(paginaAtual),
        })
      );
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    carregar(1);
  });

  btnLimpar.addEventListener("click", () => {
    form.reset();
    carregar(1);
  });

  carregar(1);
}
