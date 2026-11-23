import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import { atualizarStatusPedidoAdmin, obterPedidoAdmin } from "../nucleo/api.js";
import {
  classeSeloStatus,
  formatarDataHora,
  formatarEnderecoLinha,
} from "../nucleo/formato.js";
import { iniciarLayoutAdmin } from "../nucleo/layout.js";
import {
  limparAlerta,
  mostrarToast,
  renderizarAlerta,
  renderizarComanda,
  renderizarEstado,
} from "../nucleo/ui.js";

const sessao = iniciarLayoutAdmin({ paginaAtual: "pedidos" });
if (sessao) {
  const params = new URLSearchParams(window.location.search);
  const pedidoId = Number(params.get("id"));
  const tituloEl = document.getElementById("titulo-pedido-admin");
  const statusEl = document.getElementById("status-pedido-admin");
  const alertaEl = document.getElementById("alerta-pedido-admin");
  const container = document.getElementById("detalhe-pedido-admin");

  async function carregar() {
    container.textContent = "Carregando comanda...";
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      container.textContent = "";
      container.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/erro.svg",
          titulo: MENSAGENS.UC17.erro,
          acaoTexto: "Voltar para pedidos",
          acaoHref: "admin/pedidos.html",
        })
      );
      return;
    }

    try {
      const pedido = await obterPedidoAdmin(pedidoId);
      tituloEl.textContent = `Pedido #${pedido.id}`;
      document.title = `Pedido #${pedido.id} — Torino Admin`;
      statusEl.textContent = MENSAGENS.UC17.info;
      renderizarTela(pedido);
    } catch (err) {
      container.textContent = "";
      container.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/erro.svg",
          titulo: err.message || MENSAGENS.UC17.erro,
          acaoTexto: "Voltar para pedidos",
          acaoHref: "admin/pedidos.html",
        })
      );
    }
  }

  function renderizarTela(pedido) {
    container.textContent = "";

    const grade = document.createElement("div");
    grade.className = "admin-pedido-grade";

    // Comanda compacta para a cozinha (T16)
    const comanda = renderizarComanda({
      titulo: "Comanda da cozinha",
      subtitulo: `Recebido em ${formatarDataHora(pedido.criadoEm)}`,
      senha: String(pedido.id),
      itens: pedido.itens,
      subtotalCentavos: pedido.subtotalCentavos,
      taxaEntregaCentavos: pedido.taxaEntregaCentavos,
      totalCentavos: pedido.totalCentavos,
      observacoes: pedido.observacoes,
      compacta: true,
    });

    // Painel de status e dados do cliente
    const colunaDireita = document.createElement("div");
    colunaDireita.style.display = "flex";
    colunaDireita.style.flexDirection = "column";
    colunaDireita.style.gap = "20px";

    const cardStatus = document.createElement("section");
    cardStatus.className = "cartao-superficie";

    const topoSt = document.createElement("div");
    topoSt.style.display = "flex";
    topoSt.style.alignItems = "center";
    topoSt.style.justifyContent = "space-between";
    topoSt.style.gap = "12px";

    const h2St = document.createElement("h2");
    h2St.style.fontSize = "var(--t1)";
    h2St.textContent = "Status do pedido";

    const seloSt = document.createElement("span");
    seloSt.className = `selo ${classeSeloStatus(pedido.status)}`;
    seloSt.textContent = pedido.status;

    topoSt.append(h2St, seloSt);
    cardStatus.appendChild(topoSt);

    const transicoesPermitidas = CONFIG.TRANSICOES_STATUS[pedido.status] || [];

    if (transicoesPermitidas.length > 0) {
      const formStatus = document.createElement("form");
      formStatus.style.display = "flex";
      formStatus.style.flexDirection = "column";
      formStatus.style.gap = "12px";

      const campo = document.createElement("div");
      campo.className = "campo";
      const lbl = document.createElement("label");
      lbl.htmlFor = "novo-status";
      lbl.className = "campo-rotulo";
      lbl.textContent = "Avançar ou cancelar pedido";

      const select = document.createElement("select");
      select.id = "novo-status";
      select.className = "campo-entrada";

      for (const prox of transicoesPermitidas) {
        const opt = document.createElement("option");
        opt.value = prox;
        opt.textContent = prox;
        select.appendChild(opt);
      }

      campo.append(lbl, select);

      const btnAtualizar = document.createElement("button");
      btnAtualizar.type = "submit";
      btnAtualizar.className = "btn btn-primario";
      btnAtualizar.textContent = "Atualizar status";

      let enviando = false;
      formStatus.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (enviando) return;
        limparAlerta(alertaEl);
        enviando = true;
        btnAtualizar.disabled = true;
        btnAtualizar.textContent = "Atualizando...";

        try {
          const atualizado = await atualizarStatusPedidoAdmin(pedido.id, select.value);
          mostrarToast(MENSAGENS.UC18.sucesso, { tipo: "sucesso" });
          renderizarTela(atualizado);
        } catch (err) {
          enviando = false;
          btnAtualizar.disabled = false;
          btnAtualizar.textContent = "Atualizar status";
          renderizarAlerta(alertaEl, err.message || MENSAGENS.UC18.naoPermitida, "erro");
        }
      });

      formStatus.append(campo, btnAtualizar);
      cardStatus.appendChild(formStatus);
    } else {
      const pFim = document.createElement("p");
      pFim.className = "texto-pequeno texto-secundario";
      pFim.textContent = "Este pedido já está finalizado e não permite novas alterações de status.";
      cardStatus.appendChild(pFim);
    }

    const cardCliente = document.createElement("section");
    cardCliente.className = "cartao-superficie";

    const h2Cli = document.createElement("h2");
    h2Cli.style.fontSize = "var(--t1)";
    h2Cli.textContent = "Cliente e entrega";

    const pNome = document.createElement("p");
    const strongNome = document.createElement("strong");
    strongNome.textContent = pedido.clienteNome;
    pNome.append(strongNome);
    if (pedido.clienteTelefone) {
      pNome.append(document.createTextNode(` · ${pedido.clienteTelefone}`));
    }

    const pEnd = document.createElement("p");
    pEnd.className = "texto-secundario texto-pequeno";
    pEnd.textContent = formatarEnderecoLinha(pedido.endereco);

    const pPag = document.createElement("p");
    pPag.className = "texto-pequeno";
    pPag.textContent = `Pagamento: ${pedido.pagamento?.modalidade || "A definir"} (${pedido.pagamento?.status || "Pendente"})`;

    cardCliente.append(h2Cli, pNome, pEnd, pPag);
    colunaDireita.append(cardStatus, cardCliente);

    grade.append(comanda, colunaDireita);
    container.appendChild(grade);
  }

  carregar();
}
