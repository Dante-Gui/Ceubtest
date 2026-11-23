import { MENSAGENS } from "../mensagens.js";
import { listarPedidosCliente } from "../nucleo/api.js";
import {
  classeSeloStatus,
  formatarDataHora,
  formatarMoeda,
  resolverCaminho,
} from "../nucleo/formato.js";
import { iniciarLayoutCliente } from "../nucleo/layout.js";
import { protegerRota } from "../nucleo/sessao.js";
import { renderizarEstado, renderizarPaginacao } from "../nucleo/ui.js";

const sessao = protegerRota("cliente");
if (sessao) {
  iniciarLayoutCliente({ paginaAtual: "meus-pedidos" });

  const container = document.getElementById("lista-meus-pedidos");
  const pagContainer = document.getElementById("paginacao-pedidos");
  const statusEl = document.getElementById("status-meus-pedidos");

  let paginaAtual = 1;

  async function carregar(pagina = 1) {
    paginaAtual = pagina;
    container.textContent = "Carregando seus pedidos...";
    pagContainer.textContent = "";

    try {
      const res = await listarPedidosCliente({ pagina: paginaAtual });
      container.textContent = "";

      if (res.itens.length === 0) {
        statusEl.textContent = MENSAGENS.UC11.vazio;
        container.appendChild(
          renderizarEstado({
            imagem: "assets/img/estados/vazio-pedidos.svg",
            titulo: MENSAGENS.UC11.vazio,
            apoio: "Quando você fizer seu primeiro pedido, ele vai aparecer aqui com o acompanhamento completo.",
            acaoTexto: "Explorar o cardápio",
            acaoHref: "index.html",
          })
        );
        return;
      }

      statusEl.textContent = `${MENSAGENS.UC11.info} (${res.totalItens})`;
      const lista = document.createElement("div");
      lista.className = "pedidos-lista";

      for (const ped of res.itens) {
        const card = document.createElement("article");
        card.className = "pedido-card";

        const info = document.createElement("div");
        info.className = "pedido-card-info";

        const linhaTopo = document.createElement("div");
        linhaTopo.style.display = "flex";
        linhaTopo.style.alignItems = "center";
        linhaTopo.style.gap = "10px";
        linhaTopo.style.flexWrap = "wrap";

        const titulo = document.createElement("h2");
        titulo.style.fontSize = "var(--t1)";
        titulo.textContent = `Pedido #${ped.id}`;

        const selo = document.createElement("span");
        selo.className = `selo ${classeSeloStatus(ped.status)}`;
        selo.textContent = ped.status;

        linhaTopo.append(titulo, selo);

        const meta = document.createElement("p");
        meta.className = "texto-pequeno texto-secundario";
        const resumoItens = ped.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(", ");
        meta.textContent = `${formatarDataHora(ped.criadoEm)} · ${resumoItens}`;

        info.append(linhaTopo, meta);

        const direita = document.createElement("div");
        direita.style.display = "flex";
        direita.style.alignItems = "center";
        direita.style.gap = "16px";
        direita.style.flexWrap = "wrap";

        const valor = document.createElement("span");
        valor.className = "preco";
        valor.style.color = "var(--brasa)";
        valor.textContent = formatarMoeda(ped.totalCentavos);

        const link = document.createElement("a");
        link.href = resolverCaminho(`pedido.html?id=${ped.id}`);
        link.className = "btn btn-secundario btn-sm";
        link.textContent = "Acompanhar";

        direita.append(valor, link);
        card.append(info, direita);
        lista.appendChild(card);
      }

      container.appendChild(lista);
      pagContainer.appendChild(
        renderizarPaginacao({
          paginaAtual: res.pagina,
          totalPaginas: res.totalPaginas,
          aoMudar: carregar,
        })
      );
    } catch (err) {
      container.textContent = "";
      statusEl.textContent = "";
      container.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/erro.svg",
          titulo: err.message || MENSAGENS.UC11.erro,
          apoio: "Tente carregar novamente em instantes.",
          acaoTexto: "Tentar novamente",
          aoClicar: () => carregar(paginaAtual),
        })
      );
    }
  }

  carregar(1);
}
