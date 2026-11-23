import { CONFIG } from "../config.js";
import { resolverCaminho } from "./formato.js";

/**
 * Gerenciamento da sessão mock em localStorage["torino.sessao"].
 * Senhas NUNCA são armazenadas no navegador.
 */
export function obterSessao() {
  try {
    const bruto = localStorage.getItem(CONFIG.CHAVE_SESSAO);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    if (!dados || (dados.tipo !== "cliente" && dados.tipo !== "admin") || !dados.nome) {
      return null;
    }
    return {
      tipo: dados.tipo,
      id: dados.id ?? null,
      nome: String(dados.nome),
      email: dados.email ? String(dados.email) : "",
    };
  } catch {
    return null;
  }
}

export function salvarSessao({ tipo, id = null, nome, email = "" }) {
  try {
    const payload = { tipo, id, nome, email };
    localStorage.setItem(CONFIG.CHAVE_SESSAO, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("torino:sessao-alterada", { detail: payload }));
  } catch {
    // Armazenamento indisponível
  }
}

export function encerrarSessao() {
  try {
    localStorage.removeItem(CONFIG.CHAVE_SESSAO);
    window.dispatchEvent(new CustomEvent("torino:sessao-alterada", { detail: null }));
  } catch {
    // Ignora falha silenciosa
  }
}

export function estaAutenticado(tipo) {
  const sessao = obterSessao();
  return Boolean(sessao && sessao.tipo === tipo);
}

/**
 * Redireciona rotas protegidas para o login correspondente guardando o retorno.
 */
export function protegerRota(tipo) {
  const sessao = obterSessao();
  if (sessao && sessao.tipo === tipo) {
    return sessao;
  }
  const destinoAtual = `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search}`;
  const caminhoRetorno = tipo === "admin" ? `admin/${destinoAtual}` : destinoAtual;
  const paginaLogin = tipo === "admin" ? resolverCaminho("admin/login.html") : resolverCaminho("login.html");
  const url = new URL(paginaLogin);
  url.searchParams.set("voltar", caminhoRetorno);
  window.location.replace(url.href);
  return null;
}

export function obterUrlRetorno(padraoRelativo = "index.html") {
  const params = new URLSearchParams(window.location.search);
  const voltar = params.get("voltar");
  if (!voltar || /^(https?:|javascript:|\/\/)/i.test(voltar)) {
    return resolverCaminho(padraoRelativo);
  }
  return resolverCaminho(voltar);
}
