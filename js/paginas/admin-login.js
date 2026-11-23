import { MENSAGENS } from "../mensagens.js";
import { loginAdmin } from "../nucleo/api.js";
import { obterUrlRetorno, salvarSessao } from "../nucleo/sessao.js";
import { mostrarToast, renderizarAlerta } from "../nucleo/ui.js";
import { email, obrigatorio, vincularFormulario } from "../nucleo/validacao.js";

const form = document.getElementById("form-admin-login");
const resumoEl = document.getElementById("resumo-admin-login");

vincularFormulario(
  form,
  {
    email: [obrigatorio, email],
    senha: [obrigatorio],
  },
  {
    resumoEl,
    mensagemResumo: MENSAGENS.UC12.erro,
    aoEnviar: async (dados) => {
      try {
        const sessao = await loginAdmin({
          email: dados.email,
          senha: dados.senha,
        });
        salvarSessao(sessao);
        mostrarToast(MENSAGENS.UC12.sucesso, { tipo: "sucesso" });
        setTimeout(() => {
          window.location.href = obterUrlRetorno("admin/pedidos.html");
        }, 350);
      } catch (err) {
        renderizarAlerta(resumoEl, err.message || MENSAGENS.UC12.erro, "erro");
      }
    },
  }
);
