document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const botaoClicado = event.submitter.id;

        if (botaoClicado === 'criar_ticket') {
            const formData = new FormData(form);
            const dados = Object.fromEntries(formData.entries());

            // 1. Remover o select da validação e do objeto final
            delete dados.lista;

            // 2. Lista de campos obrigatórios baseada no atributo 'name' do HTML
            const camposObrigatorios = [
                'ticket', 
                'categoria', 
                'nome_contato', 
                'email_contato', 
                'telefone_contato', 
                'descricao', 
                'nivel_suporte'
            ];

            // 3. Validação: Verifica se todos os campos possuem valor não nulo/vazio
            const camposVazios = camposObrigatorios.filter(campo => !dados[campo] || dados[campo].trim() === "");

            if (camposVazios.length > 0) {
                alert(`⚠️ Por favor, preencha todos os campos obrigatórios antes de criar o ticket.`);
                return; // Interrompe a execução aqui
            }

            // 4. Se passar na validação, empacota e envia
            const payload = JSON.stringify(dados);
            
            try {
                const response = await fetch('http://127.0.0.1:8000/criar_ticket', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: payload
                });

                if (response.ok) {
                    alert("🎫 Ticket enviado com sucesso!");
                    form.reset(); 
                } else {
                    alert("❌ Erro no servidor: " + response.status);
                }
            } catch (error) {
                alert("⚠️ Erro de conexão: Certifique-se que o backend em 127.0.0.1:8000 está ativo.");
            }
        }
    });
});