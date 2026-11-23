import { MENSAGENS } from "../mensagens.js";
import { loginCliente } from "../nucleo/api.js";
import { iniciarLayoutCliente } from "../nucleo/layout.js";
import { obterUrlRetorno, salvarSessao } from "../nucleo/sessao.js";
import { mostrarToast, renderizarAlerta } from "../nucleo/ui.js";
import { email, obrigatorio, vincularFormulario } from "../nucleo/validacao.js";

iniciarLayoutCliente({ paginaAtual: "login" });

const form = document.getElementById("form-login");
const resumoEl = document.getElementById("resumo-login");
const linkCadastro = document.getElementById("link-ir-cadastro");

if (window.location.search && linkCadastro) {
  linkCadastro.href = `cadastro.html${window.location.search}`;
}

vincularFormulario(
  form,
  {
    email: [obrigatorio, email],
    senha: [obrigatorio],
  },
  {
    resumoEl,
    mensagemResumo: MENSAGENS.UC05.erro,
    aoEnviar: async (dados) => {
      try {
        const sessao = await loginCliente({
          email: dados.email,
          senha: dados.senha,
        });
        salvarSessao(sessao);
        mostrarToast(MENSAGENS.UC05.sucesso, { tipo: "sucesso" });
        setTimeout(() => {
          window.location.href = obterUrlRetorno("index.html");
        }, 350);
      } catch (err) {
        renderizarAlerta(resumoEl, err.message || MENSAGENS.UC05.erro, "erro");
      }
    },
  }
);
