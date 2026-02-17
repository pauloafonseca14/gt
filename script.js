document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const btnCriar = document.getElementById('criar_ticket');
    const campoResolucao = document.getElementById('descricao_resolução');
    const inputOutraCategoria = document.getElementById('outra_categoria');
    const botoesSecundarios = document.querySelectorAll('.acoes-secundarias button');

    // Lógica para habilitar/desabilitar o campo "Outra Categoria" em tempo real
    form.addEventListener('change', (e) => {
        if (e.target.name === 'categoria') {
            inputOutraCategoria.disabled = (e.target.id !== 'catZ');
            if (inputOutraCategoria.disabled) inputOutraCategoria.value = '';
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const botaoClicado = event.submitter.id;

        // 1. Estrutura de dados inicial
        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());
        
        // Exceção: Remover a lista drop-down do JSON
        delete dados.lista;

        // Vínculo: Se a categoria for "Outro", substitui pelo valor do input de texto
        if (dados.categoria === 'Outro') {
            dados.categoria = dados.outra_categoria;
        }
        // Remove o campo auxiliar 'outra_categoria' para manter o JSON limpo
        delete dados.outra_categoria;

        // 2. Bloco Switch Case para as ações
        switch (botaoClicado) {
            case 'criar_ticket':
                await executarCriarTicket(dados);
                break;
            case 'consultar_ticket':
                console.log("Consultar:", dados);
                break;
            case 'atualizar_ticket':
                console.log("Atualizar:", dados);
                break;
            default:
                console.log("Ação executada:", botaoClicado);
        }
    });

    async function executarCriarTicket(dados) {
        // Validação: Garante que a categoria (mesmo sendo a 'Outra') não seja nula
        const camposParaValidar = ['ticket', 'categoria', 'nome_contato', 'email_contato', 'descricao'];
        const camposVazios = camposParaValidar.filter(campo => !dados[campo] || dados[campo].trim() === "");

        if (camposVazios.length > 0) {
            alert("⚠️ Por favor, preencha todos os campos (incluindo a especificação da categoria, se selecionado 'Outro').");
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/criar_ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (response.ok) {
                const resultado = await response.json();
                console.log("Confirmação do Servidor:", resultado);
                alert("🎫 Ticket criado com sucesso!");

                // Alteração de estado da UI
                ativarInterfacePosCriacao();
            }
        } catch (error) {
            alert("⚠️ Erro de conexão com o servidor.");
        }
    }

    function ativarInterfacePosCriacao() {
        btnCriar.disabled = true;
        campoResolucao.disabled = false;
        botoesSecundarios.forEach(btn => btn.disabled = false);
    }
});