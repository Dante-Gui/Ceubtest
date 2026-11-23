import { MENSAGENS } from "../mensagens.js";
import { criarPedido, listarEnderecos, listarProdutos } from "../nucleo/api.js";
import { limparCarrinho, sincronizarComCatalogo, total } from "../nucleo/carrinho.js";
import { formatarEnderecoLinha, resolverCaminho } from "../nucleo/formato.js";
import { iniciarLayoutCliente } from "../nucleo/layout.js";
import { protegerRota } from "../nucleo/sessao.js";
import {
  limparAlerta,
  mostrarToast,
  renderizarAlerta,
  renderizarComanda,
  renderizarEstado,
} from "../nucleo/ui.js";

const sessao = protegerRota("cliente");
if (sessao) {
  iniciarLayoutCliente({ paginaAtual: "checkout" });

  const container = document.getElementById("conteudo-checkout");
  const alertaEl = document.getElementById("alerta-checkout");
  const CHAVE_SELECIONADO = "torino.enderecoSelecionado";

  async function carregar() {
    const resumoInicial = total();
    if (resumoInicial.itens.length === 0) {
      container.textContent = "";
      container.appendChild(
        renderizarEstado({
          imagem: "assets/img/estados/vazio-carrinho.svg",
          titulo: MENSAGENS.UC06.vazio,
          apoio: "Adicione seus itens do cardápio antes de finalizar o pedido.",
          acaoTexto: "Ver cardápio",
          acaoHref: "index.html",
        })
      );
      return;
    }

    container.textContent = "Carregando revisão do pedido...";

    try {
      const [enderecos, produtos] = await Promise.all([
        listarEnderecos(),
        listarProdutos({ incluirInativos: true }),
      ]);

      const { indisponiveis } = sincronizarComCatalogo(produtos);
      const resumo = total();

      if (indisponiveis.length > 0) {
        renderizarAlerta(
          alertaEl,
          MENSAGENS.UC08.reviseItens,
          "aviso",
          `Itens indisponíveis no momento: ${indisponiveis.join(", ")}.`
        );
      }

      let enderecoAtivo = null;
      const salvoId = Number(sessionStorage.getItem(CHAVE_SELECIONADO));
      if (enderecos.length > 0) {
        enderecoAtivo =
          enderecos.find((e) => e.id === salvoId) ||
          enderecos.find((e) => e.padrao) ||
          enderecos[0];
        sessionStorage.setItem(CHAVE_SELECIONADO, String(enderecoAtivo.id));
      }

      renderizarTela(resumo, enderecoAtivo, indisponiveis.length > 0);
    } catch (err) {
      container.textContent = "";
      renderizarAlerta(alertaEl, err.message || MENSAGENS.UC08.reviseDados, "erro");
    }
  }

  function renderizarTela(resumo, enderecoAtivo, temIndisponivel) {
    container.textContent = "";
    const grade = document.createElement("div");
    grade.className = "fluxo-grade";

    // Coluna esquerda: endereço + observações
    const colunaDados = document.createElement("div");
    colunaDados.style.display = "flex";
    colunaDados.style.flexDirection = "column";
    colunaDados.style.gap = "24px";

    const cardEndereco = document.createElement("section");
    cardEndereco.className = "cartao-superficie";

    const topoEnd = document.createElement("div");
    topoEnd.style.display = "flex";
    topoEnd.style.justifyContent = "space-between";
    topoEnd.style.alignItems = "center";
    topoEnd.style.gap = "12px";

    const h2End = document.createElement("h2");
    h2End.style.fontSize = "var(--t1)";
    h2End.textContent = "Endereço de entrega";

    const linkAltEnd = document.createElement("a");
    linkAltEnd.href = resolverCaminho("enderecos.html?origem=checkout");
    linkAltEnd.className = "btn btn-secundario btn-sm";
    linkAltEnd.textContent = enderecoAtivo ? "Alterar" : "Cadastrar endereço";

    topoEnd.append(h2End, linkAltEnd);
    cardEndereco.appendChild(topoEnd);

    if (enderecoAtivo) {
      const apelido = document.createElement("strong");
      apelido.textContent = enderecoAtivo.apelido || "Endereço selecionado";
      const textoEnd = document.createElement("p");
      textoEnd.className = "texto-secundario";
      textoEnd.textContent = formatarEnderecoLinha(enderecoAtivo);
      cardEndereco.append(apelido, textoEnd);
      if (enderecoAtivo.referencia) {
        const ref = document.createElement("p");
        ref.className = "texto-pequeno texto-secundario";
        ref.textContent = `Referência: ${enderecoAtivo.referencia}`;
        cardEndereco.appendChild(ref);
      }
    } else {
      const aviso = document.createElement("div");
      renderizarAlerta(
        aviso,
        "Você ainda não tem um endereço salvo.",
        "aviso",
        "Cadastre um endereço de entrega para confirmar o pedido."
      );
      cardEndereco.appendChild(aviso);
    }

    const cardObs = document.createElement("section");
    cardObs.className = "cartao-superficie";
    const campoObs = document.createElement("div");
    campoObs.className = "campo";
    const lblObs = document.createElement("label");
    lblObs.htmlFor = "observacoes-pedido";
    lblObs.className = "campo-rotulo";
    lblObs.textContent = "Observações para a cozinha (opcional)";
    const textarea = document.createElement("textarea");
    textarea.id = "observacoes-pedido";
    textarea.className = "campo-entrada";
    textarea.maxLength = 200;
    textarea.placeholder = "Ex.: ponto da carne, tirar cebola, tocar interfone 42...";
    campoObs.append(lblObs, textarea);
    cardObs.appendChild(campoObs);

    colunaDados.append(cardEndereco, cardObs);

    // Coluna direita: comanda de revisão + botão Confirmar pedido
    const colunaComanda = document.createElement("div");
    colunaComanda.style.display = "flex";
    colunaComanda.style.flexDirection = "column";
    colunaComanda.style.gap = "16px";

    const comanda = renderizarComanda({
      titulo: "Revisão da comanda",
      subtitulo: `Cliente: ${sessao.nome}`,
      itens: resumo.itens,
      subtotalCentavos: resumo.subtotalCentavos,
      taxaEntregaCentavos: resumo.taxaEntregaCentavos,
      totalCentavos: resumo.totalCentavos,
    });

    const acoes = document.createElement("div");
    acoes.style.display = "flex";
    acoes.style.flexDirection = "column";
    acoes.style.gap = "10px";

    const btnAlterarItens = document.createElement("a");
    btnAlterarItens.href = resolverCaminho("carrinho.html");
    btnAlterarItens.className = "btn btn-secundario btn-bloco";
    btnAlterarItens.textContent = "Alterar itens";

    const btnConfirmar = document.createElement("button");
    btnConfirmar.type = "button";
    btnConfirmar.className = "btn btn-primario btn-bloco";
    btnConfirmar.textContent = "Confirmar pedido";

    let enviando = false;
    btnConfirmar.addEventListener("click", async () => {
      if (enviando) return;
      limparAlerta(alertaEl);

      if (!enderecoAtivo) {
        renderizarAlerta(alertaEl, MENSAGENS.UC08.reviseDados, "erro", "Selecione ou cadastre um endereço de entrega.");
        linkAltEnd.focus();
        return;
      }
      if (temIndisponivel) {
        renderizarAlerta(alertaEl, MENSAGENS.UC08.reviseItens, "erro");
        btnAlterarItens.focus();
        return;
      }

      enviando = true;
      btnConfirmar.disabled = true;
      btnConfirmar.classList.add("carregando");
      btnConfirmar.textContent = "Registrando pedido...";

      try {
        const pedido = await criarPedido({
          enderecoId: enderecoAtivo.id,
          observacoes: textarea.value,
          itens: resumo.itens,
        });
        limparCarrinho();
        mostrarToast(MENSAGENS.UC08.sucesso, { tipo: "sucesso" });
        setTimeout(() => {
          window.location.href = resolverCaminho(`pagamento.html?pedido=${pedido.id}`);
        }, 350);
      } catch (err) {
        enviando = false;
        btnConfirmar.disabled = false;
        btnConfirmar.classList.remove("carregando");
        btnConfirmar.textContent = "Confirmar pedido";
        renderizarAlerta(alertaEl, err.message || MENSAGENS.UC08.reviseItens, "erro");
      }
    });

    acoes.append(btnConfirmar, btnAlterarItens);
    colunaComanda.append(comanda, acoes);

    grade.append(colunaDados, colunaComanda);
    container.appendChild(grade);
  }

  carregar();
}
