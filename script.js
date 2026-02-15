document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');

    form.addEventListener('submit', (event) => {
        // Impede o recarregamento da página
        event.preventDefault();

        // Captura o botão clicado para saber se foi o de "Criar"
        const botaoClicado = event.submitter.id;

        if (botaoClicado === 'criar_ticket') {
            // Utiliza FormData para pegar todos os campos pelo atributo "name"
            const formData = new FormData(form);
            const dados = Object.fromEntries(formData.entries());

            // Criando uma mensagem formatada para o alerta
            let mensagem = "🎫 Novo Ticket Criado!\n\n";
            mensagem += `Tipo: ${dados.ticket || 'Não selecionado'}\n`;
            mensagem += `Categoria: ${dados.categoria || 'Não selecionada'}\n`;
            mensagem += `Contato: ${dados.nome_contato}\n`;
            mensagem += `Email: ${dados.email_contato}\n`;
            mensagem += `Telefone: ${dados.telefone_contato}\n`;
            mensagem += `Nível: ${dados.nivel_suporte || 'Não definido'}\n`;
            mensagem += `Descrição: ${dados.descricao}\n`;

            alert(mensagem);
            
            // Opcional: Limpar o formulário após criar
            // form.reset();
        }
    });
});