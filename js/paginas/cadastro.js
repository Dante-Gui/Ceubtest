import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import { cadastrarCliente } from "../nucleo/api.js";
import { mascaraTelefone } from "../nucleo/formato.js";
import { iniciarLayoutCliente } from "../nucleo/layout.js";
import { obterUrlRetorno, salvarSessao } from "../nucleo/sessao.js";
import { mostrarToast, renderizarAlerta } from "../nucleo/ui.js";
import {
  avaliarForcaSenha,
  email,
  igualA,
  obrigatorio,
  senha,
  tamanho,
  telefoneBR,
  vincularFormulario,
} from "../nucleo/validacao.js";

iniciarLayoutCliente({ paginaAtual: "cadastro" });

const form = document.getElementById("form-cadastro");
const resumoEl = document.getElementById("resumo-cadastro");
const campoTelefone = document.getElementById("telefone");
const campoSenha = document.getElementById("senha");
const forcaBox = document.getElementById("forca-senha");
const forcaFill = document.getElementById("forca-preenchimento");
const forcaTexto = document.getElementById("forca-texto");
const linkLogin = document.getElementById("link-ir-login");

if (window.location.search && linkLogin) {
  linkLogin.href = `login.html${window.location.search}`;
}

campoTelefone.addEventListener("input", () => {
  campoTelefone.value = mascaraTelefone(campoTelefone.value);
});

campoSenha.addEventListener("input", () => {
  const { nivel, rotulo, percentual } = avaliarForcaSenha(campoSenha.value);
  forcaBox.dataset.nivel = nivel;
  forcaFill.style.width = `${percentual}%`;
  forcaTexto.textContent = rotulo;
});

vincularFormulario(
  form,
  {
    nome: [obrigatorio, tamanho(CONFIG.VALIDACAO.NOME_MIN, CONFIG.VALIDACAO.NOME_MAX)],
    email: [obrigatorio, email],
    telefone: [obrigatorio, telefoneBR],
    senha: [obrigatorio, senha],
    confirmarSenha: [obrigatorio, igualA("senha")],
  },
  {
    resumoEl,
    mensagemResumo: MENSAGENS.UC04.erroCampos,
    aoEnviar: async (dados) => {
      try {
        const sessao = await cadastrarCliente({
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone,
          senha: dados.senha,
        });
        salvarSessao(sessao);
        mostrarToast(MENSAGENS.UC04.sucesso, { tipo: "sucesso" });
        setTimeout(() => {
          window.location.href = obterUrlRetorno("index.html");
        }, 400);
      } catch (err) {
        renderizarAlerta(resumoEl, err.message || MENSAGENS.UC04.erroCampos, "erro");
      }
    },
  }
);
