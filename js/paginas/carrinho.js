import { MENSAGENS } from "../mensagens.js";
import { listarProdutos } from "../nucleo/api.js";
import {
  atualizarQuantidade,
  removerItem,
  restaurarItem,
  sincronizarComCatalogo,
  total,
} from "../nucleo/carrinho.js";
import { resolverCaminho } from "../nucleo/formato.js";
import { iniciarLayoutCliente } from "../nucleo/layout.js";
import {
  limparAlerta,
  mostrarToast,
  renderizarAlerta,
  renderizarComanda,
  renderizarEstado,
} from "../nucleo/ui.js";

iniciarLayoutCliente({ paginaAtual: "carrinho", exibirBarraMobile: false });

const container = document.getElementById("conteudo-carrinho");
const alertaEl = document.getElementById("alerta-carrinho");

let nomesIndisponiveis = [];

function renderizar() {
  container.textContent = "";
  const resumo = total();

  if (resumo.itens.length === 0) {
    limparAlerta(alertaEl);
    container.appendChild(
      renderizarEstado({
        imagem: "assets/img/estados/vazio-carrinho.svg",
        titulo: MENSAGENS.UC06.vazio,
        apoio: "Que tal começar pelo cardápio? Seus hambúrgueres vão aparecer aqui na comanda.",
        acaoTexto: "Ver cardápio",
        acaoHref: "index.html",
      })
    );
    return;
  }

  const grade = document.createElement("div");
  grade.className = "fluxo-grade";

  const comanda = renderizarComanda({
    titulo: "Sua comanda",
    subtitulo: `${resumo.quantidadeTotal} ${resumo.quantidadeTotal === 1 ? "item" : "itens"} na bandeja`,
    itens: resumo.itens,
    subtotalCentavos: resumo.subtotalCentavos,
    taxaEntregaCentavos: resumo.taxaEntregaCentavos,
    totalCentavos: resumo.totalCentavos,
    editavel: true,
    aoAlterarQtd: (produtoId, novaQtd) => {
      const resultado = atualizarQuantidade(produtoId, novaQtd);
      if (resultado.removido) {
        mostrarToast(MENSAGENS.UC06.sucesso, {
          tipo: "info",
          acaoTexto: "Desfazer",
          aoClicarAcao: () => {
            restaurarItem(resultado.removido);
            renderizar();
          },
        });
      } else {
        mostrarToast(MENSAGENS.UC06.sucesso, { tipo: "sucesso" });
      }
      renderizar();
    },
    aoRemover: (produtoId) => {
      const removido = removerItem(produtoId);
      if (!removido) return;
      mostrarToast(MENSAGENS.UC06.sucesso, {
        tipo: "info",
        acaoTexto: "Desfazer",
        aoClicarAcao: () => {
          restaurarItem(removido);
          renderizar();
        },
      });
      renderizar();
    },
  });

  const painelAcoes = document.createElement("aside");
  painelAcoes.className = "cartao-superficie";

  const h2 = document.createElement("h2");
  h2.style.fontSize = "var(--t1)";
  h2.textContent = "Próximo passo";

  const texto = document.createElement("p");
  texto.className = "texto-secundario texto-pequeno";
  texto.textContent =
    "Na próxima tela você escolhe o endereço de entrega e revisa sua comanda antes de confirmar.";

  const btnFinalizar = document.createElement("a");
  btnFinalizar.href = resolverCaminho("checkout.html");
  btnFinalizar.className = "btn btn-primario btn-bloco";
  btnFinalizar.textContent = "Finalizar pedido";

  if (nomesIndisponiveis.length > 0) {
    btnFinalizar.setAttribute("aria-disabled", "true");
    btnFinalizar.addEventListener("click", (e) => {
      e.preventDefault();
      renderizarAlerta(
        alertaEl,
        MENSAGENS.UC06.indisponivel,
        "erro",
        `Remova os itens indisponíveis para continuar: ${nomesIndisponiveis.join(", ")}.`
      );
    });
  }

  const btnCardapio = document.createElement("a");
  btnCardapio.href = resolverCaminho("index.html");
  btnCardapio.className = "btn btn-secundario btn-bloco";
  btnCardapio.textContent = "Adicionar mais itens";

  painelAcoes.append(h2, texto, btnFinalizar, btnCardapio);
  grade.append(comanda, painelAcoes);
  container.appendChild(grade);
}

async function iniciar() {
  renderizar();
  try {
    const produtos = await listarProdutos({ incluirInativos: true });
    const { indisponiveis } = sincronizarComCatalogo(produtos);
    nomesIndisponiveis = indisponiveis;
    if (indisponiveis.length > 0) {
      renderizarAlerta(
        alertaEl,
        MENSAGENS.UC06.indisponivel,
        "aviso",
        `Itens indisponíveis no momento: ${indisponiveis.join(", ")}.`
      );
    }
    renderizar();
  } catch {
    // Mantém dados locais do carrinho
  }
}

iniciar();
