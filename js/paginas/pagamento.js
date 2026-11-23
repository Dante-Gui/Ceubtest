import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import { obterPedidoCliente, processarPagamento } from "../nucleo/api.js";
import { formatarMoeda, resolverCaminho } from "../nucleo/formato.js";
import { iniciarLayoutCliente } from "../nucleo/layout.js";
import { protegerRota } from "../nucleo/sessao.js";
import {
  criarIcone,
  limparAlerta,
  mostrarToast,
  renderizarAlerta,
  renderizarComanda,
  renderizarEstado,
} from "../nucleo/ui.js";

const sessao = protegerRota("cliente");
if (sessao) {
  iniciarLayoutCliente({ paginaAtual: "pagamento" });

  const container = document.getElementById("conteudo-pagamento");
  const alertaEl = document.getElementById("alerta-pagamento");
  const params = new URLSearchParams(window.location.search);
  const pedidoId = Number(params.get("pedido"));

  async function carregar() {
    container.textContent = "Carregando dados do pagamento...";
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      container.textContent = "";
      container.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/erro.svg",
          titulo: MENSAGENS.UC10.erro,
          apoio: "Verifique seus pedidos para retomar o pagamento.",
          acaoTexto: "Ir para meus pedidos",
          acaoHref: "meus-pedidos.html",
        })
      );
      return;
    }

    try {
      const pedido = await obterPedidoCliente(pedidoId);
      renderizarTela(pedido);
    } catch (err) {
      container.textContent = "";
      container.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/erro.svg",
          titulo: err.message || MENSAGENS.UC10.erro,
          apoio: "Confira a lista de seus pedidos na sua conta.",
          acaoTexto: "Meus pedidos",
          acaoHref: "meus-pedidos.html",
        })
      );
    }
  }

  function renderizarTela(pedido) {
    container.textContent = "";

    if (pedido.pagamento?.status === "Aprovado") {
      renderizarAlerta(
        alertaEl,
        MENSAGENS.UC09.sucesso,
        "sucesso",
        `Pago via ${pedido.pagamento.modalidade}. Sua comanda já está com a cozinha.`
      );
      container.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/vazio-pedidos.svg",
          titulo: MENSAGENS.UC09.sucesso,
          apoio: `Pedido #${pedido.id} no valor de ${formatarMoeda(pedido.totalCentavos)}.`,
          acaoTexto: "Acompanhar pedido",
          acaoHref: `pedido.html?id=${pedido.id}`,
        })
      );
      return;
    }

    const grade = document.createElement("div");
    grade.className = "fluxo-grade";

    // Modalidades grandes (RN10)
    const painel = document.createElement("section");
    painel.className = "cartao-superficie";

    const h2 = document.createElement("h2");
    h2.style.fontSize = "var(--t1)";
    h2.textContent = "Escolha como pagar";

    const listaOpcoes = document.createElement("div");
    listaOpcoes.className = "lista-opcoes";
    listaOpcoes.setAttribute("role", "radiogroup");
    listaOpcoes.setAttribute("aria-label", "Modalidades de pagamento");

    let modalidadeSelecionada = CONFIG.MODALIDADES_PAGAMENTO[0].id;

    for (const mod of CONFIG.MODALIDADES_PAGAMENTO) {
      const label = document.createElement("label");
      label.className = "opcao-cartao";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "modalidade";
      radio.value = mod.id;
      radio.checked = mod.id === modalidadeSelecionada;
      radio.addEventListener("change", () => {
        modalidadeSelecionada = mod.id;
      });

      const icone = criarIcone(mod.icone);
      const conteudo = document.createElement("div");
      conteudo.className = "opcao-cartao-conteudo";

      const nome = document.createElement("strong");
      nome.textContent = mod.rotulo;
      const desc = document.createElement("span");
      desc.className = "texto-pequeno texto-secundario";
      desc.textContent = mod.descricao;
      conteudo.append(nome, desc);

      label.append(radio, icone, conteudo);
      listaOpcoes.appendChild(label);
    }

    // Controle discreto para testar todos os cenários da fase 1 (aprovado, recusado, indisponível)
    const campoSim = document.createElement("div");
    campoSim.className = "campo";
    const lblSim = document.createElement("label");
    lblSim.htmlFor = "simulacao-pag";
    lblSim.className = "campo-rotulo";
    lblSim.textContent = "Cenário de teste do pagamento (fase 1 mock)";
    const selectSim = document.createElement("select");
    selectSim.id = "simulacao-pag";
    selectSim.className = "campo-entrada";
    const opcoesSim = [
      { valor: "aprovado", texto: "Aprovar pagamento (fluxo básico)" },
      { valor: "recusado", texto: "Simular pagamento recusado" },
      { valor: "indisponivel", texto: "Simular meio de pagamento indisponível" },
    ];
    for (const op of opcoesSim) {
      const opt = document.createElement("option");
      opt.value = op.valor;
      opt.textContent = op.texto;
      selectSim.appendChild(opt);
    }
    campoSim.append(lblSim, selectSim);

    const btnPagar = document.createElement("button");
    btnPagar.type = "button";
    btnPagar.className = "btn btn-primario btn-bloco";
    btnPagar.textContent = `Pagar agora · ${formatarMoeda(pedido.totalCentavos)}`;

    let enviando = false;
    btnPagar.addEventListener("click", async () => {
      if (enviando) return;
      limparAlerta(alertaEl);
      enviando = true;
      btnPagar.disabled = true;
      btnPagar.classList.add("carregando");
      btnPagar.textContent = "Confirmando pagamento...";

      try {
        const atualizado = await processarPagamento(pedido.id, {
          modalidade: modalidadeSelecionada,
          simulacao: selectSim.value,
        });
        mostrarToast(MENSAGENS.UC09.sucesso, { tipo: "sucesso" });
        renderizarTela(atualizado);
      } catch (err) {
        enviando = false;
        btnPagar.disabled = false;
        btnPagar.classList.remove("carregando");
        btnPagar.textContent = `Pagar agora · ${formatarMoeda(pedido.totalCentavos)}`;
        renderizarAlerta(alertaEl, err.message || MENSAGENS.UC09.indisponivel, "erro");
      }
    });

    painel.append(h2, listaOpcoes, campoSim, btnPagar);

    // Resumo do valor na comanda
    const comanda = renderizarComanda({
      titulo: "Resumo do valor",
      subtitulo: `Pedido registrado · ${pedido.itens.length} ${pedido.itens.length === 1 ? "item" : "itens"}`,
      senha: String(pedido.id),
      itens: pedido.itens,
      subtotalCentavos: pedido.subtotalCentavos,
      taxaEntregaCentavos: pedido.taxaEntregaCentavos,
      totalCentavos: pedido.totalCentavos,
      observacoes: pedido.observacoes,
    });

    grade.append(painel, comanda);
    container.appendChild(grade);
  }

  carregar();
}
