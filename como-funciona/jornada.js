const etapas = [
  {
    fase: '01 / ENTRADA', titulo: 'Da conversa ao portal',
    descricao: 'Na opção “Outros” do Blip, o cliente recebe um link assinado de uso único que abre o formulário.',
    entrada: 'Conversa no Blip', saida: 'Link de triagem individual',
  },
  {
    fase: '02 / TRIAGEM', titulo: 'Revisar o pedido',
    descricao: 'O cliente informa os dados e descreve que precisa de uma segunda via do boleto. Antes de encaminhar, ele confere a classificação sugerida.',
    entrada: 'Nome, CNPJ, e-mail e motivo do contato', saida: 'Categoria Boleto · Prioridade média · Resumo do pedido',
  },
  {
    fase: '03 / ENCAMINHAMENTO', titulo: 'Chegar ao Financeiro',
    descricao: 'A categoria Boleto indica o Financeiro no cenário ilustrado. A equipe recebe os dados da triagem e o contexto do pedido. Na demo do Blip, a mensagem fica registrada em outbox/.',
    entrada: 'Pedido revisado e identificado', saida: 'Solicitação encaminhada no cenário demonstrativo',
  },
  {
    fase: '04 / CONFIRMAÇÃO', titulo: 'Acompanhar o protocolo',
    entrada: 'Retorno da integração com o SysAid',
  },
];

const respostas = {
  simulada: {
    descricao: 'O modo demonstração gera um identificador fictício para ilustrar o retorno ao cliente.',
    saida: 'SYS-DEMO-4C7F2A · Protocolo de demonstração',
  },
  pendente: {
    descricao: 'Quando a criação ainda não foi confirmada, a página informa que aguarda o retorno do SysAid.',
    saida: 'Aguardando confirmação',
  },
};

const buscar = (id) => document.getElementById(id);
const botoes = Array.from(document.querySelectorAll('.etapas button'));
const nos = Array.from(document.querySelectorAll('#esquema span'));
const anterior = buscar('anterior');
const proxima = buscar('proxima');
const confirmacao = buscar('confirmacao');
let indice = 0;
let resposta = 'simulada';
let modelo;

function mostrar() {
  const etapa = etapas[indice];
  const ultima = indice === etapas.length - 1;
  const detalhe = ultima ? respostas[resposta] : etapa;
  buscar('contador').textContent = `0${indice + 1} / 04`;
  buscar('fase').textContent = etapa.fase;
  buscar('etapa').textContent = etapa.titulo;
  buscar('descricao').textContent = detalhe.descricao;
  buscar('entrada').textContent = etapa.entrada;
  buscar('saida').textContent = detalhe.saida;
  confirmacao.hidden = !ultima;
  anterior.disabled = indice === 0;
  proxima.disabled = ultima;
  botoes.forEach((botao, i) => {
    if (i === indice) botao.setAttribute('aria-current', 'step');
    else botao.removeAttribute('aria-current');
    nos[i].toggleAttribute('data-ativa', i === indice);
  });
  modelo?.atualizar(indice, ultima && resposta === 'pendente');
}

function selecionar(proximo, foco = false) {
  indice = Math.min(etapas.length - 1, Math.max(0, proximo));
  mostrar();
  if (foco || document.activeElement?.disabled) botoes[indice].focus();
}

botoes.forEach((botao, i) => {
  botao.addEventListener('click', () => selecionar(i));
  botao.addEventListener('keydown', (evento) => {
    const destinos = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: etapas.length - 1 };
    if (!(evento.key in destinos)) return;
    evento.preventDefault();
    selecionar(destinos[evento.key], true);
  });
});
anterior.addEventListener('click', () => selecionar(indice - 1));
proxima.addEventListener('click', () => selecionar(indice + 1));
confirmacao.addEventListener('change', (evento) => {
  resposta = evento.target.value;
  mostrar();
});

mostrar();

const tela = buscar('modelo');
const esquema = buscar('esquema');

function mostrarEsquema() {
  tela.hidden = true;
  esquema.hidden = false;
  modelo = undefined;
}

tela.addEventListener('webglcontextlost', mostrarEsquema);

try {
  const { criarModelo } = await import('./modelo.js');
  modelo = criarModelo(tela);
  tela.hidden = false;
  esquema.hidden = true;
  mostrar();
} catch {
  mostrarEsquema();
}
