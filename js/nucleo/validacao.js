import { CONFIG } from "../config.js";
import { MENSAGENS } from "../mensagens.js";
import { normalizarTexto, reaisParaCentavos, soDigitos } from "./formato.js";
import { criarIcone, limparAlerta, renderizarAlerta } from "./ui.js";

export function obrigatorio(valor) {
  return normalizarTexto(valor).length > 0 ? null : MENSAGENS.CAMPO.obrigatorio;
}

export function tamanho(min, max) {
  return (valor) => {
    const v = normalizarTexto(valor);
    if (!v) return null;
    if (min && v.length < min) return MENSAGENS.CAMPO.tamanhoMin(min);
    if (max && v.length > max) return MENSAGENS.CAMPO.tamanhoMax(max);
    return null;
  };
}

export function email(valor) {
  const v = normalizarTexto(valor);
  if (!v) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : MENSAGENS.CAMPO.email;
}

export function telefoneBR(valor) {
  const d = soDigitos(valor);
  if (!d) return null;
  return d.length === 10 || d.length === 11 ? null : MENSAGENS.CAMPO.telefone;
}

export function senha(valor) {
  const v = String(valor ?? "");
  if (!v) return null;
  return v.length >= CONFIG.VALIDACAO.SENHA_MIN ? null : MENSAGENS.CAMPO.senhaCurta;
}

export function igualA(nomeOutroCampo, mensagem = MENSAGENS.CAMPO.senhaConfirmacao) {
  return (valor, form) => {
    const outro = form?.elements?.namedItem(nomeOutroCampo);
    const valorOutro = outro ? String(outro.value ?? "") : "";
    return String(valor ?? "") === valorOutro ? null : mensagem;
  };
}

export function cep(valor) {
  const d = soDigitos(valor);
  if (!d) return null;
  return d.length === 8 ? null : MENSAGENS.CAMPO.cep;
}

export function precoCentavos(valor) {
  const centavos = reaisParaCentavos(valor);
  if (!Number.isFinite(centavos)) return MENSAGENS.CAMPO.preco;
  if (centavos < CONFIG.PRECO_MIN_CENTAVOS || centavos > CONFIG.PRECO_MAX_CENTAVOS) {
    return MENSAGENS.CAMPO.preco;
  }
  return null;
}

export function inteiroEntre(min, max) {
  return (valor) => {
    const n = Number(valor);
    if (!Number.isInteger(n) || n < min || n > max) {
      return MENSAGENS.CAMPO.quantidade;
    }
    return null;
  };
}

export function opcaoDe(lista) {
  return (valor) => {
    const v = normalizarTexto(valor);
    if (!v) return null;
    return lista.includes(v) ? null : MENSAGENS.CAMPO.opcao;
  };
}

export function avaliarForcaSenha(valor) {
  const v = String(valor ?? "");
  let pontos = 0;
  if (v.length >= 6) pontos += 1;
  if (v.length >= 10) pontos += 1;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) pontos += 1;
  if (/\d/.test(v)) pontos += 1;
  if (/[^A-Za-z0-9]/.test(v)) pontos += 1;

  if (!v) return { nivel: "vazia", rotulo: "", percentual: 0 };
  if (pontos <= 2) return { nivel: "fraca", rotulo: "Fraca", percentual: 33 };
  if (pontos <= 3) return { nivel: "media", rotulo: "Boa", percentual: 66 };
  return { nivel: "forte", rotulo: "Forte", percentual: 100 };
}

function obterContainerErro(input) {
  const campo = input.closest(".campo");
  if (!campo) return null;
  let erroEl = campo.querySelector(".campo-erro");
  if (!erroEl) {
    erroEl = document.createElement("span");
    erroEl.className = "campo-erro";
    erroEl.id = `${input.id || input.name}-erro`;
    campo.appendChild(erroEl);
  }
  return erroEl;
}

export function definirErroCampo(input, mensagemErro) {
  if (!input) return;
  const erroEl = obterContainerErro(input);
  const ajudaEl = input.closest(".campo")?.querySelector(".campo-ajuda");
  const ids = [];
  if (ajudaEl?.id) ids.push(ajudaEl.id);

  if (mensagemErro) {
    input.setAttribute("aria-invalid", "true");
    input.classList.remove("campo-valido");
    if (erroEl) {
      erroEl.textContent = "";
      erroEl.appendChild(criarIcone("erro", "icone-sm"));
      const texto = document.createElement("span");
      texto.textContent = mensagemErro;
      erroEl.appendChild(texto);
      erroEl.classList.add("visivel");
      if (erroEl.id) ids.push(erroEl.id);
    }
  } else {
    input.removeAttribute("aria-invalid");
    if (normalizarTexto(input.value).length > 0) {
      input.classList.add("campo-valido");
    } else {
      input.classList.remove("campo-valido");
    }
    if (erroEl) {
      erroEl.textContent = "";
      erroEl.classList.remove("visivel");
    }
  }

  if (ids.length > 0) {
    input.setAttribute("aria-describedby", ids.join(" "));
  } else {
    input.removeAttribute("aria-describedby");
  }
}

export function validarCampo(input, regras = [], form = null) {
  const valor = input.type === "checkbox" ? (input.checked ? "1" : "") : input.value;
  for (const regra of regras) {
    const erro = regra(valor, form);
    if (erro) {
      definirErroCampo(input, erro);
      return { valido: false, erro };
    }
  }
  definirErroCampo(input, null);
  return { valido: true, erro: null };
}

/**
 * Conecta validação ao sair do campo, revalidação ao digitar após o primeiro erro,
 * bloqueio de duplo envio, resumo no topo com mensagem do UC e foco no primeiro erro.
 */
export function vincularFormulario(form, esquema, { resumoEl, mensagemResumo, aoEnviar }) {
  const nomes = Object.keys(esquema);

  for (const nome of nomes) {
    const campo = form.elements.namedItem(nome);
    if (!campo || !(campo instanceof HTMLElement)) continue;

    campo.addEventListener("blur", () => {
      const resultado = validarCampo(campo, esquema[nome], form);
      if (!resultado.valido) {
        campo.dataset.tentou = "true";
      }
    });

    const eventoRevalidar = campo.tagName === "SELECT" ? "change" : "input";
    campo.addEventListener(eventoRevalidar, () => {
      if (campo.dataset.tentou === "true") {
        validarCampo(campo, esquema[nome], form);
      }
    });
  }

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (form.dataset.enviando === "true") return;

    if (resumoEl) limparAlerta(resumoEl);

    let primeiroInvalido = null;
    const dados = {};

    for (const nome of nomes) {
      const campo = form.elements.namedItem(nome);
      if (!campo || !(campo instanceof HTMLElement)) continue;

      if (campo.type !== "password" && typeof campo.value === "string") {
        campo.value = campo.tagName === "TEXTAREA" ? campo.value.trim() : normalizarTexto(campo.value);
      }

      const resultado = validarCampo(campo, esquema[nome], form);
      if (!resultado.valido) {
        campo.dataset.tentou = "true";
        if (!primeiroInvalido) primeiroInvalido = campo;
      }

      dados[nome] = campo.type === "checkbox" ? campo.checked : campo.value;
    }

    if (primeiroInvalido) {
      if (resumoEl && mensagemResumo) {
        renderizarAlerta(resumoEl, mensagemResumo, "erro");
      }
      primeiroInvalido.focus();
      return;
    }

    const botaoSubmit = form.querySelector('button[type="submit"]');
    const textoOriginal = botaoSubmit?.textContent || "";

    form.dataset.enviando = "true";
    if (botaoSubmit) {
      botaoSubmit.disabled = true;
      botaoSubmit.classList.add("carregando");
      botaoSubmit.textContent = "";
      const spinner = document.createElement("span");
      spinner.className = "btn-spinner";
      spinner.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = botaoSubmit.dataset.textoCarregando || "Enviando...";
      botaoSubmit.append(spinner, label);
    }

    try {
      await aoEnviar(dados, form);
    } finally {
      form.dataset.enviando = "false";
      if (botaoSubmit) {
        botaoSubmit.disabled = false;
        botaoSubmit.classList.remove("carregando");
        botaoSubmit.textContent = textoOriginal;
      }
    }
  });
}
