import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import { obterProduto, salvarProdutoAdmin } from "../nucleo/api.js";
import {
  centavosParaInput,
  formatarMoeda,
  reaisParaCentavos,
  resolverCaminho,
} from "../nucleo/formato.js";
import { iniciarLayoutAdmin } from "../nucleo/layout.js";
import { criarIcone, mostrarToast, renderizarAlerta } from "../nucleo/ui.js";
import {
  obrigatorio,
  opcaoDe,
  precoCentavos,
  tamanho,
  vincularFormulario,
} from "../nucleo/validacao.js";

const sessao = iniciarLayoutAdmin({ paginaAtual: "produtos" });
if (sessao) {
  const params = new URLSearchParams(window.location.search);
  const idEdicao = Number(params.get("id")) || null;
  const editando = Boolean(idEdicao);

  const tituloEl = document.getElementById("titulo-form-produto");
  const resumoEl = document.getElementById("resumo-produto-form");
  const form = document.getElementById("form-produto");
  const selectCategoria = document.getElementById("categoria");
  const selectPreset = document.getElementById("imagemPreset");
  const inputArquivo = document.getElementById("arquivoImagem");
  const previaContainer = document.getElementById("previa-card-cliente");

  let imagemAtual = "assets/img/produtos/classico.svg";

  for (const cat of CONFIG.CATEGORIAS) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    selectCategoria.appendChild(opt);
  }

  function atualizarPrevia() {
    const nome = form.elements.namedItem("nome").value.trim() || "Nome do produto";
    const desc =
      form.elements.namedItem("descricao").value.trim() ||
      "A descrição do prato aparecerá aqui em até duas linhas.";
    const centavos = reaisParaCentavos(form.elements.namedItem("preco").value);
    const ativo = form.elements.namedItem("ativo").checked;
    const maisPedido = form.elements.namedItem("maisPedido").checked;

    previaContainer.textContent = "";
    const card = document.createElement("article");
    card.className = `card-produto ${ativo ? "" : "indisponivel"}`.trim();

    const midia = document.createElement("div");
    midia.className = "card-produto-midia";
    const img = document.createElement("img");
    img.src = resolverCaminho(imagemAtual);
    img.alt = nome;
    img.width = 400;
    img.height = 300;
    midia.appendChild(img);

    if (maisPedido && ativo) {
      const selo = document.createElement("span");
      selo.className = "selo selo-mostarda card-produto-selo";
      selo.appendChild(criarIcone("estrela", "icone-sm"));
      const txt = document.createElement("span");
      txt.textContent = "Mais pedido";
      selo.appendChild(txt);
      midia.appendChild(selo);
    }

    const corpo = document.createElement("div");
    corpo.className = "card-produto-corpo";

    const h3 = document.createElement("h3");
    h3.className = "card-produto-titulo";
    h3.textContent = nome;

    const pDesc = document.createElement("p");
    pDesc.className = "card-produto-desc";
    pDesc.textContent = desc;

    const rodape = document.createElement("div");
    rodape.className = "card-produto-rodape";
    const preco = document.createElement("span");
    preco.className = "preco card-produto-preco";
    preco.textContent = Number.isFinite(centavos) ? formatarMoeda(centavos) : "R$ 0,00";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primario btn-sm";
    btn.disabled = true;
    btn.textContent = ativo ? "Adicionar" : "Indisponível";

    rodape.append(preco, btn);
    corpo.append(h3, pDesc, rodape);
    card.append(midia, corpo);
    previaContainer.appendChild(card);
  }

  selectPreset.addEventListener("change", () => {
    imagemAtual = selectPreset.value;
    atualizarPrevia();
  });

  inputArquivo.addEventListener("change", () => {
    const arquivo = inputArquivo.files?.[0];
    if (!arquivo) return;
    const tiposPermitidos = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!tiposPermitidos.includes(arquivo.type)) {
      renderizarAlerta(resumoEl, MENSAGENS.CAMPO.imagemTipo, "erro");
      inputArquivo.value = "";
      return;
    }
    if (arquivo.size > CONFIG.VALIDACAO.IMAGEM_MAX_BYTES) {
      renderizarAlerta(resumoEl, MENSAGENS.CAMPO.imagemTamanho, "erro");
      inputArquivo.value = "";
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      imagemAtual = String(leitor.result || imagemAtual);
      atualizarPrevia();
    };
    leitor.readAsDataURL(arquivo);
  });

  form.addEventListener("input", atualizarPrevia);
  form.addEventListener("change", atualizarPrevia);

  vincularFormulario(
    form,
    {
      nome: [obrigatorio, tamanho(CONFIG.VALIDACAO.NOME_MIN, CONFIG.VALIDACAO.NOME_MAX)],
      categoria: [obrigatorio, opcaoDe(CONFIG.CATEGORIAS)],
      preco: [obrigatorio, precoCentavos],
      descricao: [
        obrigatorio,
        tamanho(CONFIG.VALIDACAO.DESCRICAO_MIN, CONFIG.VALIDACAO.DESCRICAO_MAX),
      ],
      ingredientes: [tamanho(0, 300)],
      ativo: [],
      maisPedido: [],
    },
    {
      resumoEl,
      mensagemResumo: editando ? MENSAGENS.UC14.erro : MENSAGENS.UC13.erro,
      aoEnviar: async (dados) => {
        try {
          await salvarProdutoAdmin({
            id: idEdicao,
            nome: dados.nome,
            categoria: dados.categoria,
            preco: dados.preco,
            descricao: dados.descricao,
            ingredientes: dados.ingredientes,
            imagem: imagemAtual,
            ativo: dados.ativo,
            maisPedido: dados.maisPedido,
          });
          mostrarToast(editando ? MENSAGENS.UC14.sucesso : MENSAGENS.UC13.sucesso, {
            tipo: "sucesso",
          });
          setTimeout(() => {
            window.location.href = resolverCaminho("admin/produtos.html");
          }, 350);
        } catch (err) {
          renderizarAlerta(
            resumoEl,
            err.message || (editando ? MENSAGENS.UC14.erro : MENSAGENS.UC13.erro),
            "erro"
          );
        }
      },
    }
  );

  async function iniciar() {
    if (editando) {
      tituloEl.textContent = "Editar produto";
      document.title = "Editar produto — Torino Admin";
      try {
        const prod = await obterProduto(idEdicao);
        form.elements.namedItem("nome").value = prod.nome;
        form.elements.namedItem("categoria").value = prod.categoria;
        form.elements.namedItem("preco").value = centavosParaInput(prod.precoCentavos);
        form.elements.namedItem("descricao").value = prod.descricao;
        form.elements.namedItem("ingredientes").value = (prod.ingredientes || []).join(", ");
        form.elements.namedItem("ativo").checked = prod.ativo;
        form.elements.namedItem("maisPedido").checked = prod.maisPedido;
        imagemAtual = prod.imagem;
        if (Array.from(selectPreset.options).some((o) => o.value === prod.imagem)) {
          selectPreset.value = prod.imagem;
        }
      } catch (err) {
        renderizarAlerta(resumoEl, err.message || MENSAGENS.UC14.erro, "erro");
      }
    }
    atualizarPrevia();
  }

  iniciar();
}
