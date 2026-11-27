# Demonstração em imagens

[Voltar ao README](../README.md)

## Cobrança em duplicidade

### Portal de Triagem

![Página inicial do Service Hub com atalhos para o assistente e o formulário](imagens/portal-triagem.jpg)

### Encaminhamento pelo assistente

O cliente relata uma cobrança em duplicidade. O assistente identifica Financeiro e oferece o encaminhamento com o contexto da conversa.

![Conversa de exemplo no assistente, com a cobrança em duplicidade encaminhada para Financeiro](imagens/assistente-triagem.jpg)

### Protocolo e acompanhamento

O cliente acompanha o chamado pelo protocolo, consulta o status e vê as atualizações na linha do tempo.

![Detalhes do chamado de cobrança em duplicidade, incluindo protocolo, status e histórico](imagens/chamado-cliente.jpg)

### E-mail gerado

Na demonstração, a prévia da mensagem mostra o mesmo protocolo e preserva o relato do cliente. O destinatário e o remetente são fictícios.

![Prévia do e-mail de confirmação com protocolo e relato original](imagens/email-confirmacao.jpg)

### Fila de suporte

A equipe encontra o chamado na fila Financeiro e pode assumir o atendimento.

![Fila de suporte com a cobrança em duplicidade entre os chamados](imagens/fila-suporte.jpg)

## Segunda via de boleto via Blip

Essa execução usa dados fictícios e uma resposta de classificação simulada do Ollama. A confirmação usa protocolo `SYS-DEMO-…`.

### Entrada

A página de demonstração representa a opção **Outros** do Blip e gera um link assinado de uso único.

![Entrada da demonstração do Blip com o atalho para o portal de triagem](imagens/blip-entrada.jpg)

### Formulário

O cliente informa nome, CNPJ, e-mail e motivo do contato.

![Formulário preenchido com um pedido fictício de segunda via de boleto](imagens/blip-formulario.jpg)

### Revisão

O cliente confere categoria, prioridade e resumo antes de enviar para a equipe.

![Tela de revisão com a categoria Boleto, prioridade média e resumo da solicitação](imagens/blip-revisao.jpg)

### Confirmação

O portal exibe o código da solicitação e o protocolo de teste do SysAid. O e-mail é gravado em `outbox/` no modo demonstração.

![Confirmação simulada com o código TRI e o protocolo de teste SYS-DEMO](imagens/blip-protocolo.jpg)
