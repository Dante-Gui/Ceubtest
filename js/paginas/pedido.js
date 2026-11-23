import { MENSAGENS } from "../mensagens.js";
import { obterPedidoCliente } from "../nucleo/api.js";
import {
  classeSeloStatus,
  formatarDataHora,
  formatarEnderecoLinha,
  resolverCaminho,
} from "../nucleo/formato.js";
import { iniciarLayoutCliente } from "../nucleo/layout.js";
import { protegerRota } from "../nucleo/sessao.js";
import {
  mostrarToast,
  renderizarComanda,
  renderizarEstado,
  renderizarLinhaTempo,
} from "../nucleo/ui.js";

const sessao = protegerRota("cliente");
if (sessao) {
  iniciarLayoutCliente({ paginaAtual: "pedido" });

  const container = document.getElementById("conteudo-pedido");
  const statusEl = document.getElementById("status-acomp");
  const btnAtualizar = document.getElementById("btn-atualizar-pedido");
  const params = new URLSearchParams(window.location.search);
  const pedidoId = Number(params.get("id"));

  async function carregar(notificar = false) {
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      btnAtualizar.classList.add("oculto");
      container.textContent = "";
      container.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/erro.svg",
          titulo: MENSAGENS.UC10.erro,
          apoio: "Confira o número do pedido na sua lista de pedidos.",
          acaoTexto: "Ver meus pedidos",
          acaoHref: "meus-pedidos.html",
        })
      );
      return;
    }

    btnAtualizar.disabled = true;
    try {
      const pedido = await obterPedidoCliente(pedidoId);
      document.title = `Pedido #${pedido.id} — Torino Online`;
      statusEl.textContent = MENSAGENS.UC10.info;
      renderizarTela(pedido);
      if (notificar) {
        mostrarToast(MENSAGENS.UC10.info, { tipo: "info" });
      }
    } catch (err) {
      btnAtualizar.classList.add("oculto");
      container.textContent = "";
      container.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/erro.svg",
          titulo: err.message || MENSAGENS.UC10.erro,
          apoio: "Este pedido pode pertencer a outra conta ou não existir.",
          acaoTexto: "Meus pedidos",
          acaoHref: "meus-pedidos.html",
        })
      );
    } finally {
      btnAtualizar.disabled = false;
    }
  }

  function renderizarTela(pedido) {
    container.textContent = "";

    const blocoStatus = document.createElement("section");
    blocoStatus.className = "cartao-superficie";
    blocoStatus.style.marginBottom = "24px";

    const cab = document.createElement("div");
    cab.style.display = "flex";
    cab.style.flexWrap = "wrap";
    cab.style.alignItems = "center";
    cab.style.justifyContent = "space-between";
    cab.style.gap = "12px";

    const esq = document.createElement("div");
    const h2 = document.createElement("h2");
    h2.textContent = `Pedido #${pedido.id}`;
    const data = document.createElement("p");
    data.className = "texto-pequeno texto-secundario";
    data.textContent = `Feito em ${formatarDataHora(pedido.criadoEm)} · Atualizado em ${formatarDataHora(pedido.atualizadoEm)}`;
    esq.append(h2, data);

    const selo = document.createElement("span");
    selo.className = `selo ${classeSeloStatus(pedido.status)}`;
    selo.textContent = pedido.status;

    cab.append(esq, selo);
    blocoStatus.append(cab, renderizarLinhaTempo(pedido.status, pedido.historicoStatus));

    const grade = document.createElement("div");
    grade.className = "fluxo-grade";

    const comanda = renderizarComanda({
      titulo: "Comanda do pedido",
      subtitulo: formatarDataHora(pedido.criadoEm),
      senha: String(pedido.id),
      itens: pedido.itens,
      subtotalCentavos: pedido.subtotalCentavos,
      taxaEntregaCentavos: pedido.taxaEntregaCentavos,
      totalCentavos: pedido.totalCentavos,
      observacoes: pedido.observacoes,
    });

    const detalhes = document.createElement("aside");
    detalhes.className = "cartao-superficie";

    const h3End = document.createElement("h2");
    h3End.style.fontSize = "var(--t1)";
    h3End.textContent = "Entrega e pagamento";

    const pEnd = document.createElement("p");
    pEnd.className = "texto-secundario";
    pEnd.textContent = formatarEnderecoLinha(pedido.endereco);

    const linhaPag = document.createElement("div");
    linhaPag.style.display = "flex";
    linhaPag.style.alignItems = "center";
    linhaPag.style.justifyContent = "space-between";
    linhaPag.style.gap = "8px";
    linhaPag.style.paddingTop = "12px";
    linhaPag.style.borderTop = "1px solid var(--borda)";

    const pagInfo = document.createElement("span");
    pagInfo.textContent = `Pagamento: ${pedido.pagamento?.modalidade || "A definir"}`;
    const seloPag = document.createElement("span");
    seloPag.className = `selo ${classeSeloStatus(pedido.pagamento?.status || "Pendente")}`;
    seloPag.textContent = pedido.pagamento?.status || "Pendente";
    linhaPag.append(pagInfo, seloPag);

    detalhes.append(h3End, pEnd, linhaPag);

    if (pedido.pagamento?.status !== "Aprovado" && pedido.status !== "Cancelado") {
      const btnPagar = document.createElement("a");
      btnPagar.href = resolverCaminho(`pagamento.html?pedido=${pedido.id}`);
      btnPagar.className = "btn btn-primario btn-bloco";
      btnPagar.textContent = "Pagar agora";
      detalhes.appendChild(btnPagar);
    }

    grade.append(comanda, detalhes);
    container.append(blocoStatus, grade);
  }

  btnAtualizar.addEventListener("click", () => carregar(true));
  carregar(false);
}
