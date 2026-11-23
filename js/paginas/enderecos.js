import { MENSAGENS } from "../mensagens.js";
import { buscarCepMock, listarEnderecos, salvarEndereco } from "../nucleo/api.js";
import { formatarEnderecoLinha, mascaraCep, resolverCaminho } from "../nucleo/formato.js";
import { iniciarLayoutCliente } from "../nucleo/layout.js";
import { protegerRota } from "../nucleo/sessao.js";
import { mostrarToast, renderizarAlerta, renderizarEstado } from "../nucleo/ui.js";
import { cep, obrigatorio, tamanho, vincularFormulario } from "../nucleo/validacao.js";

const sessao = protegerRota("cliente");
if (sessao) {
  iniciarLayoutCliente({ paginaAtual: "enderecos" });

  const listaEl = document.getElementById("lista-enderecos");
  const acaoContinuar = document.getElementById("acao-continuar");
  const form = document.getElementById("form-endereco");
  const resumoEl = document.getElementById("resumo-endereco");
  const campoCep = document.getElementById("cep");
  const btnBuscarCep = document.getElementById("btn-buscar-cep");
  const params = new URLSearchParams(window.location.search);
  const veioDoCheckout = params.get("origem") === "checkout";

  const CHAVE_SELECIONADO = "torino.enderecoSelecionado";

  campoCep.addEventListener("input", () => {
    campoCep.value = mascaraCep(campoCep.value);
  });

  btnBuscarCep.addEventListener("click", async () => {
    const erroCep = cep(campoCep.value) || obrigatorio(campoCep.value);
    if (erroCep) {
      renderizarAlerta(resumoEl, MENSAGENS.CAMPO.cep, "aviso");
      campoCep.focus();
      return;
    }
    btnBuscarCep.disabled = true;
    const resultado = await buscarCepMock(campoCep.value);
    btnBuscarCep.disabled = false;

    if (!resultado) {
      mostrarToast("CEP não localizado na base local. Preencha os campos manualmente.", { tipo: "info" });
      return;
    }
    form.elements.namedItem("logradouro").value = resultado.logradouro;
    form.elements.namedItem("bairro").value = resultado.bairro;
    form.elements.namedItem("cidade").value = resultado.cidade;
    form.elements.namedItem("uf").value = resultado.uf;
    form.elements.namedItem("numero").focus();
    mostrarToast("Endereço preenchido pelo CEP.", { tipo: "sucesso" });
  });

  async function carregarEnderecos() {
    listaEl.textContent = "Carregando endereços...";
    try {
      const enderecos = await listarEnderecos();
      listaEl.textContent = "";

      if (enderecos.length === 0) {
        acaoContinuar.classList.add("oculto");
        listaEl.appendChild(
          renderizarEstado({
            imagem: "assets/img/estados/vazio-pedidos.svg",
            titulo: "Nenhum endereço cadastrado ainda.",
            apoio: "Preencha o formulário ao lado para entregar sua comanda.",
          })
        );
        return;
      }

      let selecionadoId = Number(sessionStorage.getItem(CHAVE_SELECIONADO));
      if (!enderecos.some((e) => e.id === selecionadoId)) {
        selecionadoId = (enderecos.find((e) => e.padrao) || enderecos[0]).id;
        sessionStorage.setItem(CHAVE_SELECIONADO, String(selecionadoId));
      }

      for (const end of enderecos) {
        const label = document.createElement("label");
        label.className = "opcao-cartao";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "enderecoSelecionado";
        radio.value = String(end.id);
        radio.checked = end.id === selecionadoId;
        radio.addEventListener("change", () => {
          sessionStorage.setItem(CHAVE_SELECIONADO, String(end.id));
        });

        const conteudo = document.createElement("div");
        conteudo.className = "opcao-cartao-conteudo";

        const titulo = document.createElement("strong");
        titulo.textContent = end.apelido || "Endereço";
        const linha = document.createElement("span");
        linha.className = "texto-pequeno texto-secundario";
        linha.textContent = formatarEnderecoLinha(end);

        conteudo.append(titulo, linha);
        if (end.referencia) {
          const ref = document.createElement("span");
          ref.className = "texto-pequeno texto-secundario";
          ref.textContent = `Referência: ${end.referencia}`;
          conteudo.appendChild(ref);
        }

        label.append(radio, conteudo);
        listaEl.appendChild(label);
      }

      acaoContinuar.classList.remove("oculto");
    } catch (err) {
      listaEl.textContent = "";
      renderizarAlerta(listaEl, err.message || MENSAGENS.UC07.erroCampos, "erro");
    }
  }

  vincularFormulario(
    form,
    {
      apelido: [obrigatorio, tamanho(2, 40)],
      cep: [obrigatorio, cep],
      logradouro: [obrigatorio, tamanho(3, 120)],
      numero: [obrigatorio],
      complemento: [tamanho(0, 60)],
      bairro: [obrigatorio, tamanho(2, 80)],
      cidade: [obrigatorio, tamanho(2, 80)],
      uf: [obrigatorio, tamanho(2, 2)],
      referencia: [tamanho(0, 120)],
    },
    {
      resumoEl,
      mensagemResumo: MENSAGENS.UC07.erroCampos,
      aoEnviar: async (dados) => {
        try {
          const salvo = await salvarEndereco(dados);
          sessionStorage.setItem(CHAVE_SELECIONADO, String(salvo.id));
          mostrarToast(MENSAGENS.UC07.sucesso, { tipo: "sucesso" });
          form.reset();
          if (veioDoCheckout) {
            setTimeout(() => {
              window.location.href = resolverCaminho("checkout.html");
            }, 350);
          } else {
            await carregarEnderecos();
          }
        } catch (err) {
          renderizarAlerta(resumoEl, err.message || MENSAGENS.UC07.erroCampos, "erro");
        }
      },
    }
  );

  carregarEnderecos();
}
