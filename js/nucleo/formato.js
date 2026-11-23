const formatadorBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const formatadorHora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Formata valor inteiro em centavos para R$ 29,90 (RN03).
 */
export function formatarMoeda(centavos) {
  const seguro = Number.isFinite(Number(centavos)) ? Math.round(Number(centavos)) : 0;
  return formatadorBRL.format(seguro / 100);
}

/**
 * Converte valor em reais (número ou texto "29,90") para inteiro em centavos.
 */
export function reaisParaCentavos(valor) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.round(valor * 100);
  }
  const limpo = String(valor ?? "")
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const numero = Number(limpo);
  if (!Number.isFinite(numero)) return NaN;
  return Math.round(numero * 100);
}

export function centavosParaInput(centavos) {
  const seguro = Number.isFinite(Number(centavos)) ? Math.round(Number(centavos)) : 0;
  return (seguro / 100).toFixed(2).replace(".", ",");
}

export function formatarDataHora(iso) {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return formatadorDataHora.format(data);
}

export function formatarData(iso) {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return formatadorData.format(data);
}

export function formatarHora(iso) {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return formatadorHora.format(data);
}

export function escapeHtml(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normalizarTexto(texto) {
  return String(texto ?? "").trim().replace(/\s+/g, " ");
}

export function soDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

export function mascaraTelefone(valor) {
  const d = soDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraCep(valor) {
  const d = soDigitos(valor).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/**
 * Resolve caminhos relativos à raiz do projeto a partir de qualquer página (incluindo admin/ ou GitHub Pages).
 */
export function resolverCaminho(caminhoRelativo) {
  if (!caminhoRelativo) return "";
  if (/^(https?:|data:|blob:)/i.test(caminhoRelativo)) return caminhoRelativo;
  const limpo = String(caminhoRelativo).replace(/^\/+/, "");
  return new URL(`../../${limpo}`, import.meta.url).href;
}

export function classeSeloStatus(status) {
  switch (status) {
    case "Entregue":
    case "Aprovado":
    case "Ativo":
      return "selo-sucesso";
    case "Cancelado":
    case "Recusado":
    case "Inativo":
      return "selo-erro";
    case "Em preparo":
    case "Saiu para entrega":
    case "Pendente":
      return "selo-aviso";
    case "Recebido":
      return "selo-mostarda";
    default:
      return "selo-neutro";
  }
}

export function formatarEnderecoLinha(end) {
  if (!end) return "";
  const partes = [
    `${end.logradouro}, ${end.numero}`,
    end.complemento,
    end.bairro,
    `${end.cidade}/${end.uf}`,
    end.cep ? `CEP ${end.cep}` : "",
  ].filter(Boolean);
  return partes.join(" · ");
}
