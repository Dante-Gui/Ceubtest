/**
 * Mensagens exatas dos Casos de Uso (Seção 9 do CLAUDE.md).
 * Não altere os textos oficiais nem exponha detalhes internos.
 */
export const MENSAGENS = Object.freeze({
  UC01: {
    info: "Os produtos disponíveis são exibidos.",
    erro: "Cardápio temporariamente indisponível.",
  },
  UC02: {
    vazio: "Nenhum produto encontrado.",
    termoObrigatorio: "Informe um nome ou termo para pesquisar.",
  },
  UC03: {
    info: "Detalhes do produto carregados.",
    indisponivel: "Este produto não está disponível.",
  },
  UC04: {
    sucesso: "Cadastro realizado com sucesso.",
    erroCampos: "Verifique os campos informados.",
    duplicado: "Já existe uma conta com esses dados.",
  },
  UC05: {
    sucesso: "Login realizado.",
    erro: "Não foi possível autenticar com os dados informados.",
  },
  UC06: {
    sucesso: "Carrinho atualizado.",
    vazio: "O carrinho está vazio.",
    indisponivel: "O produto não está disponível.",
  },
  UC07: {
    sucesso: "Endereço salvo.",
    erroCampos: "Preencha os campos obrigatórios do endereço.",
  },
  UC08: {
    sucesso: "Pedido registrado.",
    reviseDados: "Revise os dados do pedido antes de confirmar.",
    reviseItens: "Não foi possível confirmar o pedido; revise os itens.",
  },
  UC09: {
    sucesso: "Pagamento confirmado.",
    recusado: "Pagamento não aprovado. Tente outra modalidade.",
    indisponivel: "Não foi possível confirmar o pagamento.",
  },
  UC10: {
    info: "Status do pedido exibido.",
    erro: "Pedido não encontrado ou acesso não autorizado.",
  },
  UC11: {
    info: "Histórico carregado.",
    vazio: "Você ainda não possui pedidos.",
    erro: "Não foi possível carregar o histórico.",
  },
  UC12: {
    sucesso: "Acesso autorizado.",
    erro: "Credenciais inválidas ou acesso não autorizado.",
  },
  UC13: {
    sucesso: "Produto cadastrado.",
    erro: "Verifique os dados do produto.",
  },
  UC14: {
    sucesso: "Produto atualizado.",
    erro: "Não foi possível atualizar o produto.",
  },
  UC15: {
    sucesso: "Produto desativado.",
    bloqueadoHistorico: "Não é possível excluir este produto por causa do histórico associado.",
  },
  UC16: {
    info: "Pedidos carregados.",
    vazio: "Não há pedidos para exibir.",
  },
  UC17: {
    info: "Detalhes do pedido carregados.",
    erro: "Pedido não encontrado.",
  },
  UC18: {
    sucesso: "Status atualizado.",
    naoPermitida: "A alteração de status não é permitida.",
  },
  UC19: {
    info: "Histórico carregado.",
    vazio: "Não há registros para exibir.",
  },

  // Mensagens de apoio de validação por campo (curtas, voz ativa, sem jargão)
  CAMPO: {
    obrigatorio: "Preencha este campo.",
    email: "Informe um e-mail válido, como nome@exemplo.com.",
    telefone: "Informe um telefone com DDD (10 ou 11 dígitos).",
    senhaCurta: "A senha precisa ter pelo menos 6 caracteres.",
    senhaConfirmacao: "As senhas não conferem.",
    cep: "Informe um CEP válido com 8 dígitos.",
    preco: "Informe um preço maior que R$ 1,00.",
    quantidade: "Escolha uma quantidade entre 1 e 20.",
    opcao: "Selecione uma opção válida.",
    tamanhoMin: (n) => `Use pelo menos ${n} caracteres.`,
    tamanhoMax: (n) => `Use no máximo ${n} caracteres.`,
    imagemTipo: "Envie uma imagem PNG, JPG, WebP ou SVG.",
    imagemTamanho: "A imagem deve ter no máximo 1 MB.",
  },
});
